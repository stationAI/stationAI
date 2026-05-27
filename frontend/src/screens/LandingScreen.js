import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { BACKEND_URL } from '../utils/config';
import { showAlert } from '../utils/alert';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function LandingScreen({ navigation }) {
  const [serverState, setServerState] = useState('checking'); // checking | online | offline
  const [latency, setLatency] = useState(0);

  // Perform active backend connectivity and loopback diagnostics
  useEffect(() => {
    let active = true;
    const checkBackend = async () => {
      const startTime = Date.now();
      try {
        // Ping authentication endpoint or root to verify connection
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'ping@test.com', password: 'ping' }),
        });
        
        // Even if unauthorized or 404/422, the server IS alive and reachable!
        if (active) {
          setServerState('online');
          setLatency(Date.now() - startTime);
        }
      } catch (error) {
        if (active) {
          setServerState('offline');
        }
      }
    };

    checkBackend();
    return () => { active = false; };
  }, []);

  const handleEnterDemoMode = () => {
    showAlert(
      "Offline Demo Mode Active",
      "Entering StationAI prototype in offline bypass mode. Databases and servers are fully simulated.",
      [{ text: "Proceed", onPress: () => navigation.navigate("DomainPicker") }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        {/* Brand Logo Header */}
        <Text style={styles.logoText}>Station<Text style={styles.orangeLogo}>AI</Text></Text>
        <Text style={styles.tagline}>Next-Generation AI Voice Mentor & Procedure Guidance for QSR</Text>
        
        {/* Diagnostic Connection Widget */}
        <View style={styles.diagnosticBar}>
          {serverState === 'checking' && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#FF6D00" />
              <Text style={styles.statusText}>Pinging local server loopback...</Text>
            </View>
          )}
          {serverState === 'online' && (
            <View style={styles.statusRow}>
              <View style={[styles.indicator, styles.onlineIndicator]} />
              <Text style={styles.statusText}>
                Connection Secure (Port 8000 Reachable | Latency: {latency}ms)
              </Text>
            </View>
          )}
          {serverState === 'offline' && (
            <View style={styles.offlineContainer}>
              <View style={styles.statusRow}>
                <View style={[styles.indicator, styles.offlineIndicator]} />
                <Text style={[styles.statusText, styles.offlineText]}>
                  Local Server Unreachable (Port 8000 Blocked / Offline)
                </Text>
              </View>
              <Text style={styles.offlineHint}>
                Note: Your Windows firewall or IPv6 resolution may be blocking port 8000. 
                You can bypass this instantly and use our built-in offline simulation mode!
              </Text>
            </View>
          )}
        </View>

        {/* Feature Cards Grid */}
        <Text style={styles.sectionTitle}>Explore Core Modules</Text>
        <View style={isWeb ? styles.featureGridWeb : styles.featureListMobile}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎙️</Text>
            <Text style={styles.featureName}>AI In-Ear Coach</Text>
            <Text style={styles.featureDesc}>
              Hands-free bone conduction voice guides trainees step-by-step through fryer & burger SOPs.
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📥</Text>
            <Text style={styles.featureName}>Multimodal Ingest</Text>
            <Text style={styles.featureDesc}>
              Upload PDF manuals, images, cooking audio, or instruction videos to compile pgvector knowledge.
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📈</Text>
            <Text style={styles.featureName}>Manager Controls</Text>
            <Text style={styles.featureDesc}>
              Track live shift metrics, audit trainee logs, and progress canary rollouts with custom wake words.
            </Text>
          </View>
        </View>

        {/* Dynamic Action Portals */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.primaryCTA, styles.managerBtn]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.primaryCTAText}>💼 Enter Manager Console</Text>
            <Text style={styles.btnSubtitle}>Track metrics & customize AI voice coach</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryCTA, styles.traineeBtn]}
            onPress={() => navigation.navigate("TraineeWorkspace")}
          >
            <Text style={styles.primaryCTAText}>🎧 Launch Trainee Workspace</Text>
            <Text style={styles.btnSubtitle}>Activate voice guidance earphone</Text>
          </TouchableOpacity>
        </View>

        {/* Offline Demo Mode Bypass Trigger */}
        <TouchableOpacity 
          style={styles.demoBypassButton} 
          onPress={handleEnterDemoMode}
        >
          <Text style={styles.demoBypassText}>✨ Quick Access: Enter Offline Demo Mode (Bypass All Servers)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEFE5', // Warm cream backdrop
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        minHeight: '100vh',
      }
    })
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: isWeb ? 48 : 24,
    maxWidth: 900,
    width: '100%',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 109, 0, 0.15)',
  },
  logoText: {
    fontSize: isWeb ? 36 : 28,
    fontWeight: '900',
    color: '#3B1800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  orangeLogo: {
    color: '#FF6D00',
  },
  tagline: {
    fontSize: isWeb ? 16 : 14,
    color: '#8A6851',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
    lineHeight: 22,
  },
  diagnosticBar: {
    backgroundColor: '#FFF8F4',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineIndicator: {
    backgroundColor: '#2E7D32',
  },
  offlineIndicator: {
    backgroundColor: '#C62828',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#553622',
  },
  offlineText: {
    color: '#C62828',
  },
  offlineHint: {
    fontSize: 11,
    color: '#8A6851',
    marginTop: 6,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureGridWeb: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  featureListMobile: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#FFEFE5',
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 12,
    color: '#6E4E37',
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 16,
    marginBottom: 20,
  },
  primaryCTA: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  managerBtn: {
    backgroundColor: '#FF6D00',
    shadowColor: '#FF6D00',
  },
  traineeBtn: {
    backgroundColor: '#3B1800',
    shadowColor: '#3B1800',
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  btnSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 4,
  },
  demoBypassButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#FF6D00',
    borderRadius: 16,
    backgroundColor: '#FFF8F4',
  },
  demoBypassText: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
