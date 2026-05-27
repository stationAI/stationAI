import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import OrangeLayout from '../components/OrangeLayout';

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants', 'models', 'deploy', 'audits'
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newTier, setNewTier] = useState('standard');
  const [canaryWeight, setCanaryWeight] = useState(10); // 10%, 25%, 50%, 100%
  const [loading, setLoading] = useState(false);

  const [tenants, setTenants] = useState([
    { id: '1a-550e', name: "Morley's Chicken", created: '2026-05-10', tier: 'standard', coach: 'Coach' },
    { id: 'ryz-220d', name: "KFC London", created: '2026-05-25', tier: 'premium', coach: 'Zinger' },
    { id: 'bk-990e', name: "Burger King Leicester", created: '2026-05-26', tier: 'premium', coach: 'Patty' },
  ]);

  const [loraJobs, setLoraJobs] = useState([
    { id: 'job_082', restaurant: 'KFC London', base: 'Gemma 4 2B', status: 'completed', accuracy: '96.2%', date: '2026-05-24' },
    { id: 'job_091', restaurant: 'Burger King', base: 'Gemma 4 2B', status: 'training', accuracy: 'Evaluating...', date: 'Running now' },
  ]);

  const handleCreateTenant = () => {
    if (!newRestaurantName.trim()) return;
    
    setLoading(true);
    setTimeout(() => {
      const newTenant = {
        id: `tenant_${Math.floor(Math.random() * 8000) + 1000}`,
        name: newRestaurantName,
        created: new Date().toISOString().split('T')[0],
        tier: newTier,
        coach: 'Coach'
      };
      
      setTenants(prev => [...prev, newTenant]);
      setNewRestaurantName('');
      setLoading(false);
      Alert.alert("Tenant Added", `Successfully registered ${newRestaurantName} under ${newTier} billing tier.`);
    }, 800);
  };

  const handleTriggerRollback = () => {
    setCanaryWeight(0);
    Alert.alert(
      "CANARY ROLLBACK",
      "Immediate rollback command executed. All active trainee connections successfully routed back to the stable production container.",
      [{ text: "OK" }]
    );
  };

  return (
    <OrangeLayout 
      title="Sasi's Command Console" 
      subtitle="Global system settings & tenant isolation metrics"
      onLogout={() => navigation.navigate("Login")}
    >
      <View style={styles.adminContainer}>
        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'tenants' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tenants')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'tenants' && styles.tabButtonTextActive]}>
              🏢 Tenants
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'models' && styles.tabButtonActive]}
            onPress={() => setActiveTab('models')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'models' && styles.tabButtonTextActive]}>
              🧠 Model Registry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'deploy' && styles.tabButtonActive]}
            onPress={() => setActiveTab('deploy')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'deploy' && styles.tabButtonTextActive]}>
              🚀 Canary Deploy
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- TAB CONTENT: TENANT MANAGEMENT --- */}
        {activeTab === 'tenants' && (
          <View style={styles.tabContent}>
            {/* Create New Tenant Card */}
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Register New Restaurant Franchise</Text>
              <Text style={styles.cardSubtitle}>Instantly allocate a isolated multi-tenant database space.</Text>
              
              <View style={styles.formRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Restaurant Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newRestaurantName}
                    onChangeText={setNewRestaurantName}
                    placeholder="e.g. KFC Leicester Square"
                    placeholderTextColor="#C4A895"
                  />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Subscription Tier</Text>
                  <View style={styles.tierToggle}>
                    <TouchableOpacity 
                      style={[styles.tierOpt, newTier === 'standard' && styles.tierOptActive]}
                      onPress={() => setNewTier('standard')}
                    >
                      <Text style={[styles.tierOptText, newTier === 'standard' && styles.tierOptTextActive]}>Std</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tierOpt, newTier === 'premium' && styles.tierOptActive]}
                      onPress={() => setNewTier('premium')}
                    >
                      <Text style={[styles.tierOptText, newTier === 'premium' && styles.tierOptTextActive]}>Prem</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={handleCreateTenant}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Add Restaurant Tenant</Text>}
              </TouchableOpacity>
            </View>

            {/* Tenant Grid List */}
            <Text style={styles.sectionTitle}>Active Franchises</Text>
            {tenants.map(t => (
              <View key={t.id} style={styles.recordCard}>
                <View>
                  <Text style={styles.recordTitle}>{t.name}</Text>
                  <Text style={styles.recordMeta}>ID: {t.id} • Created: {t.created}</Text>
                </View>
                <View style={styles.recordBadge}>
                  <Text style={styles.recordBadgeText}>{t.tier.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- TAB CONTENT: MODEL REGISTRY & LoRA --- */}
        {activeTab === 'models' && (
          <View style={styles.tabContent}>
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Global Model Registry</Text>
              <Text style={styles.cardSubtitle}>
                Manages standard base models and LoRA adapters. Fine-tuning runs require manual admin approval before release.
              </Text>
              <View style={styles.registryRow}>
                <Text style={styles.registryLabel}>Active Base SLM:</Text>
                <Text style={styles.registryValue}>Gemma 4 2B (Cloud Run GPU)</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>LoRA Fine-Tuning Runs</Text>
            {loraJobs.map(job => (
              <View key={job.id} style={styles.recordCard}>
                <View>
                  <Text style={styles.recordTitle}>{job.restaurant} Adaptation</Text>
                  <Text style={styles.recordMeta}>Job: {job.id} • Base: {job.base} • Released: {job.date}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  job.status === 'completed' ? styles.statusSuccess : styles.statusProgress
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {job.status === 'completed' ? `✓ ${job.accuracy}` : '⚙ Training...'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- TAB CONTENT: CANARY DEPLOYMENTS --- */}
        {activeTab === 'deploy' && (
          <View style={styles.tabContent}>
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Canary Deployment Rollout</Text>
              <Text style={styles.cardSubtitle}>
                Progressively route user WebSocket traffic to the newly deployed container version.
              </Text>

              <Text style={styles.inputLabel}>Traffic Routing Weight: {canaryWeight}%</Text>
              <View style={styles.weightSelector}>
                {[10, 25, 50, 100].map(w => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.weightBtn, canaryWeight === w && styles.weightBtnActive]}
                    onPress={() => setCanaryWeight(w)}
                  >
                    <Text style={[styles.weightText, canaryWeight === w && styles.weightTextActive]}>{w}%</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.canaryStatusCard}>
                <Text style={styles.canaryStatusHeader}>Deployment Status:</Text>
                <Text style={styles.canaryStatusBody}>
                  {canaryWeight === 100 
                    ? "Production Release complete. 100% of trainee sessions routed to v2.4 container."
                    : `Routing ${canaryWeight}% of new training sessions to v2.4 container. Monitoring latencies.`}
                </Text>
              </View>

              {/* EMERGENCY ROLLBACK TRIGGER */}
              <TouchableOpacity style={styles.rollbackBtn} onPress={handleTriggerRollback}>
                <Text style={styles.rollbackBtnText}>🛑 FORCE EMERGENCY ROLLBACK (0%)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </OrangeLayout>
  );
}

const styles = StyleSheet.create({
  adminContainer: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFEFE5',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A6851',
  },
  tabButtonTextActive: {
    color: '#FF6D00',
  },
  tabContent: {
    animationType: 'fade',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8A6851',
    lineHeight: 18,
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B1800',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#3B1800',
  },
  tierToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFEFE5',
    borderRadius: 10,
    padding: 3,
    height: 42,
    alignItems: 'center',
  },
  tierOpt: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
  },
  tierOptActive: {
    backgroundColor: '#FFFFFF',
  },
  tierOptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A6851',
  },
  tierOptTextActive: {
    color: '#FF6D00',
  },
  actionBtn: {
    backgroundColor: '#FF6D00',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 16,
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFEFE5',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B1800',
  },
  recordMeta: {
    fontSize: 11,
    color: '#8A6851',
    marginTop: 2,
  },
  recordBadge: {
    backgroundColor: '#FFEFE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  recordBadgeText: {
    color: '#FF6D00',
    fontSize: 11,
    fontWeight: '800',
  },
  registryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF8F4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD3B8',
  },
  registryLabel: {
    fontSize: 13,
    color: '#8A6851',
  },
  registryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6D00',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusProgress: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  weightSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  weightBtn: {
    flex: 1,
    backgroundColor: '#FFFBF9',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightBtnActive: {
    backgroundColor: '#FF6D00',
    borderColor: '#FF6D00',
  },
  weightText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A6851',
  },
  weightTextActive: {
    color: '#FFFFFF',
  },
  canaryStatusCard: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#FFD3B8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  canaryStatusHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6D00',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  canaryStatusBody: {
    fontSize: 12,
    color: '#3B1800',
    lineHeight: 18,
  },
  rollbackBtn: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1.5,
    borderColor: '#FFB8B8',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rollbackBtnText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '800',
  },
});
