import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function GDPRModal({ visible, onClose, onAccept }) {
  if (!visible) return null;
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>UK GDPR Consent & Privacy Notice</Text>
          
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            <Text style={styles.sectionHeader}>1. Who We Are</Text>
            <Text style={styles.textBody}>
              StationAI provides real-time voice-guided training under contract to your employer (the franchisee). 
              We operate under strict compliance with the UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018.
            </Text>

            <Text style={styles.sectionHeader}>2. How We Handle Your Audio & Voice Data</Text>
            <Text style={styles.textBody}>
              • **Audio Deletion**: All voice recording audio samples are processed in real-time for speech-to-text transcription and **permanently deleted within 24 hours**. We never store raw audio on our servers.
            </Text>
            <Text style={styles.textBody}>
              • **Audio Streams**: AI-synthesized feedback responses are streamed directly to your headset and never saved.
            </Text>

            <Text style={styles.sectionHeader}>3. Data Retention & Anonymization</Text>
            <Text style={styles.textBody}>
              We store only written text transcripts of training sessions for performance analytics, logs, and food safety compliance. 
              All logs use a randomized trainee ID code to isolate transcripts from your legal name, ensuring privacy throughout.
            </Text>

            <Text style={styles.sectionHeader}>4. Your Rights</Text>
            <Text style={styles.textBody}>
              You maintain the right to review, request deletion, or correct your records. To execute any of your rights, you can request data deletion directly from your store manager's dashboard.
            </Text>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]} 
              onPress={() => {
                onAccept();
                onClose();
              }}
            >
              <Text style={styles.acceptText}>I Agree & Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 12, 4, 0.6)', // Subtle premium dark translucent background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFBF7', // Premium warm off-white cream tone
    borderRadius: 20,
    padding: 24,
    shadowColor: '#DD5A00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.25)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B1800', // Deep chocolate text
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'System',
  },
  scrollContainer: {
    maxHeight: 300,
    marginBottom: 20,
    paddingRight: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DD5A00', // Harmonious rich orange
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'System',
  },
  textBody: {
    fontSize: 12,
    color: '#553622', // Warm grey/brown body
    lineHeight: 18,
    fontFamily: 'System',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1,
    borderColor: '#FFD3B8',
  },
  acceptButton: {
    backgroundColor: '#FF6D00', // Rich vibrant orange
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  cancelText: {
    color: '#C45200',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
