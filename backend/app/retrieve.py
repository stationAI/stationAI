import numpy as np
import asyncio
import logging
from typing import List, Dict, Any
from app.db import supabase, redis_client
from app.ingest import embedding_model

logger = logging.getLogger("station_ai.retrieve")

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """
    Computes the cosine similarity between two 384-dimension vectors.
    Used to normalize similarity scores for chunks retrieved via keyword search.
    """
    a = np.array(v1)
    b = np.array(v2)
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

# -------------------------------------------------------------
# HYBRID RETRIEVAL PIPELINE
# -------------------------------------------------------------

async def retrieve_context(
    question: str,
    restaurant_id: str,
    station: str = "all",
    similarity_threshold: float = 0.70,
    top_k: int = 4
) -> List[Dict[str, Any]]:
    """
    Retrieves the top K most relevant training procedure chunks using hybrid search:
    Dense Vector + Postgres Full-Text Search (BM25 Equivalent) with reciprocal reranking.
    """
    logger.info(f"Retrieving context for query: '{question}' (restaurant: {restaurant_id}, station: {station})")
    
    # Check cache first for common questions to keep latency under 100ms
    cache_key = f"cache:{restaurant_id}:{station}:{question.lower().strip()}"
    try:
        cached_result = await redis_client.get(cache_key)
        if cached_result:
            import json
            logger.info("Serving retrieval query directly from Redis cache.")
            return json.loads(cached_result)
    except Exception as e:
        logger.warning(f"Cache lookup failed: {e}")

    start_time = asyncio.get_event_loop().time()

    # 1. Generate Query Embedding (runs in thread pool)
    query_vector = await asyncio.to_thread(
        lambda: embedding_model.encode(question).tolist()
    )

    # 2. Run Dense Vector Search via Supabase match_documents RPC function
    # Strictly filtered by restaurant_id and station (or station='all')
    dense_task = asyncio.to_thread(
        lambda: supabase.rpc("match_documents", {
            "query_embedding": query_vector,
            "match_threshold": similarity_threshold,
            "match_count": top_k * 2,
            "filter_restaurant_id": restaurant_id,
            "filter_station": station
        }).execute()
    )

    # 3. Run Postgres Full-Text Search (BM25 Equivalent)
    # Strictly filtered by restaurant_id and station to prevent cross-tenant leak
    keyword_sql = """
        SELECT 
            id, 
            restaurant_id, 
            content, 
            metadata, 
            station, 
            embedding::text as raw_embedding,
            ts_rank_cd(to_tsvector('english', content), plainto_tsquery('english', :query)) as fts_rank
        FROM public.documents
        WHERE 
            restaurant_id = :restaurant_id
            AND (:station = 'all' OR station = :station OR station = 'all')
            AND to_tsvector('english', content) @@ plainto_tsquery('english', :query)
        ORDER BY fts_rank DESC
        LIMIT :limit;
    """
    
    # We execute keyword FTS using standard supabase select/rpc or filter queries to keep it clean.
    # To execute cleanly with RLS without raw sql tools, we query the table using .fts filtering in supabase-py:
    station_filter = ["all", station] if station != "all" else ["all"]
    keyword_task = asyncio.to_thread(
        lambda: supabase.table("documents")
            .select("id, restaurant_id, content, metadata, station, embedding")
            .eq("restaurant_id", restaurant_id)
            .in_("station", station_filter)
            .textSearch("content", question, config="english")
            .limit(top_k * 2)
            .execute()
    )

    # Run dense and keyword searches concurrently
    dense_res, keyword_res = await asyncio.gather(dense_task, keyword_task)
    
    # 4. Merge and Deduplicate Chunks
    unique_chunks: Dict[str, Dict[str, Any]] = {}
    
    # Process Dense Results
    if dense_res.data:
        for idx, row in enumerate(dense_res.data):
            chunk_id = row["id"]
            unique_chunks[chunk_id] = {
                "id": chunk_id,
                "restaurant_id": row["restaurant_id"],
                "content": row["content"],
                "metadata": row["metadata"],
                "station": row["station"],
                "dense_rank": idx + 1,
                "keyword_rank": None,
                "similarity": float(row["similarity"])
            }
            
    # Process Keyword Results
    if keyword_res.data:
        for idx, row in enumerate(keyword_res.data):
            chunk_id = row["id"]
            if chunk_id in unique_chunks:
                unique_chunks[chunk_id]["keyword_rank"] = idx + 1
            else:
                # Resolve embedding for image/audio documents if stored as float arrays
                raw_embed = row.get("embedding")
                similarity_score = 0.0
                if raw_embed:
                    # Convert to vector list and compute cosine similarity
                    if isinstance(raw_embed, str):
                        # Clean up formatting if stringified
                        clean_embed = [float(x) for x in raw_embed.replace("[", "").replace("]", "").split(",")]
                    else:
                        clean_embed = list(raw_embed)
                    similarity_score = cosine_similarity(query_vector, clean_embed)
                
                # Check similarity threshold
                if similarity_score >= similarity_threshold:
                    unique_chunks[chunk_id] = {
                        "id": chunk_id,
                        "restaurant_id": row["restaurant_id"],
                        "content": row["content"],
                        "metadata": row["metadata"],
                        "station": row["station"],
                        "dense_rank": None,
                        "keyword_rank": idx + 1,
                        "similarity": similarity_score
                    }

    # 5. Apply Reciprocal Rank Fusion (RRF) Reranking
    # Fusion formula: RRF_Score = 1 / (60 + dense_rank) + 1 / (60 + keyword_rank)
    reranked_list = []
    for chunk in unique_chunks.values():
        dense_rank = chunk["dense_rank"] if chunk["dense_rank"] is not None else 999
        keyword_rank = chunk["keyword_rank"] if chunk["keyword_rank"] is not None else 999
        
        rrf_score = (1.0 / (60.0 + dense_rank)) + (1.0 / (60.0 + keyword_rank))
        chunk["rrf_score"] = rrf_score
        reranked_list.append(chunk)

    # Sort descending by RRF Score first, with Cosine Similarity as tie-breaker
    reranked_list.sort(key=lambda x: (x["rrf_score"], x["similarity"]), reverse=True)
    
    # Slice to top_k matching chunks
    top_chunks = reranked_list[:top_k]

    # Clean internal ranks for return payload
    final_output = []
    for c in top_chunks:
        final_output.append({
            "id": c["id"],
            "restaurant_id": c["restaurant_id"],
            "content": c["content"],
            "metadata": c["metadata"],
            "station": c["station"],
            "similarity": c["similarity"]
        })

    # Cache the final response in Redis with an 8-hour TTL
    try:
        import json
        await redis_client.setex(cache_key, 28800, json.dumps(final_output))
    except Exception as e:
        logger.warning(f"Failed to cache retrieval result in Redis: {e}")

    end_time = asyncio.get_event_loop().time()
    logger.info(f"Hybrid retrieval complete. Latency: {int((end_time - start_time) * 1000)}ms. Chunks returned: {len(final_output)}")

    return final_output
