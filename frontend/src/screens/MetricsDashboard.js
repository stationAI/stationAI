import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Dimensions, Alert, ActivityIndicator } from 'react-native';
import OrangeLayout from '../components/OrangeLayout';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function MetricsDashboard({ navigation }) {
  const [coachName, setCoachName] = useState('Coach');
  const [wakeWord, setWakeWord] = useState('Hey Coach');
  const [savingSettings, setSavingSettings] = useState(false);
  const [trainees, setTrainees] = useState([
    { id: '101', name: 'Trainee #101', station: 'Burger', active: true, lastQuestion: 'How much mayo on Zinger?', timeSpent: '45m' },
    { id: '102', name: 'Trainee #102', station: 'Grill', active: true, lastQuestion: 'What temperature for chicken breast?', timeSpent: '1h 15m' },
    { id: '103', name: 'Trainee #103', station: 'Fryer', active: false, lastQuestion: 'Standard cook time for fries?', timeSpent: '2h' },
    { id: '104', name: 'Trainee #104', station: 'Drinks', active: false, lastQuestion: 'Is the carbonation level standard?', timeSpent: '15m' },
  ]);

  const [flaggedSessions, setFlaggedSessions] = useState(new Set());

  // Handle saving customized voice name and wake word per restaurant
  const handleSaveVoiceSettings = async () => {
    setSavingSettings(true);
    try {
      // Mock network latency or actual update if tenant context is loaded
      setTimeout(() => {
        setSavingSettings(false);
        Alert.alert(
          "Settings Saved", 
          `Voice assistant configured as: "${coachName}". Trainees can wake Coach by saying: "${wakeWord}".`
        );
      }, 800);
    } catch (error) {
      setSavingSettings(false);
      Alert.alert("Error", "Failed to update voice configuration settings.");
    }
  };

  // Flag an incorrect Coach response for evaluation in the Feedback Store
  const handleFlagResponse = (traineeId) => {
    if (flaggedSessions.has(traineeId)) return;
    
    setFlaggedSessions(prev => {
      const updated = new Set(prev);
      updated.add(traineeId);
      return updated;
    });

    Alert.alert(
      "Response Flagged",
      "This question and answer have been flagged and sent to your Feedback Store. Sasi and Kartik will audit this in your weekly Golden Test Set.",
      [{ text: "OK" }]
    );
  };

  const handleExportLogs = () => {
    Alert.alert("Compliance Export", "UK Food Safety Audit logs successfully generated and emailed as a secure PDF.");
  };

  return (
    <OrangeLayout 
      title="QSR Manager Dashboard" 
      subtitle="Real-time shift metrics and configurations"
      onLogout={() => navigation.navigate("Login")}
    >
      <View style={styles.dashboardContainer}>
        {/* Navigation Breadcrumb & Actions Header */}
        <View style={styles.breadcrumbHeader}>
          <TouchableOpacity onPress={() => navigation.navigate("MenuScreen")}>
            <Text style={styles.breadcrumbLink}>← Back to Modules</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.uploadCTA} 
            onPress={() => navigation.navigate("UploadScreen")}
          >
            <Text style={styles.uploadCTAText}>+ Ingest Training Material</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Trainees Active Today</Text>
            <Text style={styles.metricValue}>2 <Text style={styles.metricSubtext}>on shift</Text></Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sessions (Week)</Text>
            <Text style={styles.metricValue}>34 <Text style={styles.metricSubtext}>completed</Text></Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg. Completion Rate</Text>
            <Text style={styles.metricValue}>92% <Text style={styles.metricSubtext}>compliance</Text></Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Most Questioned Station</Text>
            <Text style={styles.metricValue}>Burger <Text style={styles.metricSubtext}>14 queries</Text></Text>
          </View>
        </View>

        <View style={isWeb ? styles.webMainLayout : styles.mobileMainLayout}>
          {/* Left Column: Live Feed & Auditing */}
          <View style={[styles.column, isWeb && styles.leftColumn]}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionTitle}>Live Shift Feed</Text>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportLogs}>
                <Text style={styles.exportBtnText}>📄 Export Audit Logs</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={trainees}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.traineeCard}>
                  <View style={styles.traineeCardHeader}>
                    <View style={styles.traineeMeta}>
                      <View style={[styles.statusDot, item.active ? styles.activeDot : styles.inactiveDot]} />
                      <Text style={styles.traineeName}>{item.name}</Text>
                      <Text style={styles.stationBadge}>{item.station} Station</Text>
                    </View>
                    <Text style={styles.timeSpent}>{item.timeSpent} training</Text>
                  </View>
                  
                  <View style={styles.traineeQueryContainer}>
                    <Text style={styles.queryLabel}>Last Session Query:</Text>
                    <Text style={styles.queryText}>"{item.lastQuestion}"</Text>
                  </View>
                  
                  <View style={styles.traineeActions}>
                    <Text style={styles.coachAnswerLabel}>Coach answer correct?</Text>
                    <TouchableOpacity 
                      style={[
                        styles.flagButton, 
                        flaggedSessions.has(item.id) && styles.flagButtonDisabled
                      ]} 
                      onPress={() => handleFlagResponse(item.id)}
                      disabled={flaggedSessions.has(item.id)}
                    >
                      <Text style={styles.flagButtonText}>
                        {flaggedSessions.has(item.id) ? '👎 Flagged' : '👎 Report Error'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>

          {/* Right Column: Assistant settings & Headset paired state */}
          <View style={[styles.column, isWeb && styles.rightColumn]}>
            {/* Customize assistant identity */}
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Customize In-Ear Assistant</Text>
              <Text style={styles.cardSubtitle}>Change the Coach's name and wake word for your specific restaurant.</Text>
              
              <Text style={styles.inputLabel}>Coach Name</Text>
              <TextInput
                style={styles.textInput}
                value={coachName}
                onChangeText={(text) => {
                  setCoachName(text);
                  setWakeWord(`Hey ${text}`);
                }}
                placeholder="e.g. Patty"
                placeholderTextColor="#C4A895"
              />
              
              <Text style={styles.inputLabel}>Wake Word (Auto-Matches Name)</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={wakeWord}
                editable={false}
              />
              
              <TouchableOpacity 
                style={styles.saveSettingsBtn}
                onPress={handleSaveVoiceSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveSettingsBtnText}>Save Assistant Config</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Bluetooth configuration */}
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Bluetooth Headset Control</Text>
              <Text style={styles.cardSubtitle}>Configure bone conduction headsets for kitchen environments.</Text>
              
              <View style={styles.headsetRow}>
                <Text style={styles.headsetLabel}>Recommended model:</Text>
                <Text style={styles.headsetValue}>Shokz OpenComm 2</Text>
              </View>

              <TouchableOpacity 
                style={styles.bluetoothBtn}
                onPress={() => Alert.alert("Bluetooth pairing", "Headset scan initiated. Please turn on your Shokz OpenComm 2 in pairing mode.")}
              >
                <Text style={styles.bluetoothBtnText}>🔌 Pair Headset to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </OrangeLayout>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  breadcrumbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  breadcrumbLink: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadCTA: {
    backgroundColor: '#FF6D00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  uploadCTAText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A6851',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3B1800',
  },
  metricSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8A6851',
  },
  webMainLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  mobileMainLayout: {
    flexDirection: 'column',
    gap: 24,
  },
  column: {
    flex: 1,
  },
  leftColumn: {
    flex: 1.5,
  },
  rightColumn: {
    flex: 1,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B1800',
  },
  exportBtn: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1.2,
    borderColor: '#FFD3B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  exportBtnText: {
    color: '#C45200',
    fontSize: 12,
    fontWeight: '700',
  },
  traineeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFEFE5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  traineeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEFE5',
    paddingBottom: 10,
    marginBottom: 10,
  },
  traineeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    backgroundColor: '#2E7D32', // Rich green active light
  },
  inactiveDot: {
    backgroundColor: '#8A6851', // Soft grey/brown inactive
  },
  traineeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B1800',
  },
  stationBadge: {
    backgroundColor: '#FFEFE5',
    color: '#FF6D00',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeSpent: {
    fontSize: 11,
    color: '#8A6851',
    fontWeight: '600',
  },
  traineeQueryContainer: {
    backgroundColor: '#FFFBF9',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEFE5',
    marginBottom: 12,
  },
  queryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A6851',
    marginBottom: 2,
  },
  queryText: {
    fontSize: 12,
    color: '#3B1800',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  traineeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachAnswerLabel: {
    fontSize: 12,
    color: '#8A6851',
    fontWeight: '600',
  },
  flagButton: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1,
    borderColor: '#FFD3B8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  flagButtonDisabled: {
    backgroundColor: '#E6DDD7',
    borderColor: '#E6DDD7',
  },
  flagButtonText: {
    color: '#C45200',
    fontSize: 11,
    fontWeight: '700',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#8A6851',
    lineHeight: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B1800',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#3B1800',
  },
  disabledInput: {
    backgroundColor: '#FFEFE5',
    color: '#FF6D00',
    fontWeight: '700',
  },
  saveSettingsBtn: {
    backgroundColor: '#FF6D00',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headsetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFF8F4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEFE5',
  },
  headsetLabel: {
    fontSize: 12,
    color: '#8A6851',
  },
  headsetValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6D00',
  },
  bluetoothBtn: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bluetoothBtnText: {
    color: '#C45200',
    fontSize: 12,
    fontWeight: '700',
  },
});
