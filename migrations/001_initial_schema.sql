-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID-OSSP extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    restaurant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    subscription_tier TEXT DEFAULT 'standard',
    coach_name TEXT DEFAULT 'Coach',
    wake_word TEXT DEFAULT 'Hey Coach'
);

-- 2. users table
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT CHECK (role IN ('trainee', 'manager', 'admin')),
    restaurant_id UUID REFERENCES public.tenants(restaurant_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainee_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.tenants(restaurant_id) ON DELETE CASCADE,
    station_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    last_active TIMESTAMPTZ DEFAULT now()
);

-- 4. documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.tenants(restaurant_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB DEFAULT '{}'::jsonb,
    station TEXT NOT NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for vector similarity search (HNSW or IVFFlat)
-- We will use HNSW as it provides super-fast sub-100ms retrieval queries on larger datasets
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON public.documents 
USING hnsw (embedding vector_cosine_ops);

-- 5. logs table
CREATE TABLE IF NOT EXISTS public.logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(session_id) ON DELETE CASCADE,
    question TEXT,
    answer TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    response_time_ms INT,
    confidence_score NUMERIC(4,3),
    flagged BOOLEAN DEFAULT FALSE
);

-- 6. audit table
CREATE TABLE IF NOT EXISTS public.audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    details JSONB DEFAULT '{}'::jsonb
);

-- -------------------------------------------------------------
-- SECURITY DEFINER HELPERS (Avoid RLS Recursion)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE user_id = auth.uid();
  RETURN COALESCE(v_role, 'trainee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_user_restaurant_id()
RETURNS uuid AS $$
DECLARE
  v_restaurant_id uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Overwrite get_auth_user_restaurant_id to handle correct retrieval
CREATE OR REPLACE FUNCTION public.get_auth_user_restaurant_id()
RETURNS uuid AS $$
DECLARE
  v_restaurant_id uuid;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.users WHERE user_id = auth.uid();
  RETURN v_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit ENABLE ROW LEVEL SECURITY;

-- Tenants Policies
CREATE POLICY tenants_select_policy ON public.tenants
    FOR SELECT TO authenticated
    USING (restaurant_id = public.get_auth_user_restaurant_id() OR public.get_auth_user_role() = 'admin');

CREATE POLICY tenants_admin_policy ON public.tenants
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() = 'admin');

-- Users Policies
CREATE POLICY users_self_policy ON public.users
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY users_manager_policy ON public.users
    FOR SELECT TO authenticated
    USING (restaurant_id = public.get_auth_user_restaurant_id() AND public.get_auth_user_role() = 'manager');

CREATE POLICY users_admin_policy ON public.users
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() = 'admin');

-- Sessions Policies
CREATE POLICY sessions_trainee_policy ON public.sessions
    FOR ALL TO authenticated
    USING (trainee_id = auth.uid());

CREATE POLICY sessions_manager_policy ON public.sessions
    FOR ALL TO authenticated
    USING (restaurant_id = public.get_auth_user_restaurant_id() AND public.get_auth_user_role() = 'manager');

CREATE POLICY sessions_admin_policy ON public.sessions
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() = 'admin');

-- Documents Policies
CREATE POLICY documents_select_policy ON public.documents
    FOR SELECT TO authenticated
    USING (restaurant_id = public.get_auth_user_restaurant_id() OR public.get_auth_user_role() = 'admin');

CREATE POLICY documents_manager_policy ON public.documents
    FOR ALL TO authenticated
    USING (restaurant_id = public.get_auth_user_restaurant_id() AND public.get_auth_user_role() = 'manager');

CREATE POLICY documents_admin_policy ON public.documents
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() = 'admin');

-- Logs Policies
CREATE POLICY logs_trainee_policy ON public.logs
    FOR ALL TO authenticated
    USING (session_id IN (
        SELECT session_id FROM public.sessions WHERE trainee_id = auth.uid()
    ));

CREATE POLICY logs_manager_policy ON public.logs
    FOR ALL TO authenticated
    USING (session_id IN (
        SELECT session_id FROM public.sessions WHERE restaurant_id = public.get_auth_user_restaurant_id()
    ) AND public.get_auth_user_role() = 'manager');

CREATE POLICY logs_admin_policy ON public.logs
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() = 'admin');

-- Audit Policies
CREATE POLICY audit_admin_policy ON public.audit
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() = 'admin');

-- -------------------------------------------------------------
-- TRIGGERS: AUTOMATIC USER CREATION ON SIGN-UP
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_restaurant_id uuid;
  v_role text;
BEGIN
  -- Extract metadata properties passed from client signup
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'trainee');
  
  IF new.raw_user_meta_data->>'restaurant_id' IS NOT NULL THEN
    v_restaurant_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
  ELSE
    v_restaurant_id := NULL;
  END IF;

  INSERT INTO public.users (user_id, email, role, restaurant_id)
  VALUES (new.id, new.email, v_role, v_restaurant_id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users schema
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------
-- PGVECTOR MATCH_DOCUMENTS FUNCTION
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_restaurant_id uuid,
  filter_station text DEFAULT 'all'
)
RETURNS TABLE (
  id uuid,
  restaurant_id uuid,
  content text,
  metadata jsonb,
  station text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.restaurant_id,
    documents.content,
    documents.metadata,
    documents.station,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM public.documents
  WHERE 
    documents.restaurant_id = filter_restaurant_id
    AND (
      filter_station = 'all' 
      OR documents.station = filter_station 
      OR documents.station = 'all'
    )
    AND 1 - (documents.embedding <=> query_embedding) >= match_threshold
  ORDER BY documents.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
