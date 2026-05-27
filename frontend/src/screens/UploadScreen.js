import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import OrangeLayout from '../components/OrangeLayout';
import { showAlert } from '../utils/alert';

export default function UploadScreen({ navigation }) {
  const [selectedStation, setSelectedStation] = useState('burger');
  const [approved, setApproved] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Uploading, 2: Extracting, 3: Chunking, 4: Embedding, 5: Ready
  const [chunkCount, setChunkCount] = useState(0);

  const stations = [
    { label: '🍔 Burger Station', value: 'burger' },
    { label: '🥩 Grill Station', value: 'grill' },
    { label: '🍟 Fryer Station', value: 'fryer' },
    { label: '🥤 Drinks Station', value: 'drinks' },
    { label: '🌟 All Stations', value: 'all' },
  ];

  // Mocking file picker for the prototype
  const handleSelectFile = (format) => {
    setFile({
      name: `training_sop_shift_${format === 'pdf' ? 'procedure' : 'media'}.${format}`,
      size: '2.4 MB',
      format: format,
    });
    setApproved(false);
  };

  const handleDragOver = () => {
    // Standard mock file drop action
    handleSelectFile('pdf');
  };

  const handleIngest = async () => {
    if (!file) {
      showAlert("No File Selected", "Please select or drop a training manual file first.");
      return;
    }
    if (!approved) {
      showAlert("Review Required", "Please review and tick the checkbox to approve this training material.");
      return;
    }

    setUploading(true);
    setChunkCount(0);
    
    // Animate through the ingestion stepper stages synchronously
    try {
      // Step 1: Uploading
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Extracting Text (PyPDF2, moviepy, or OCR)
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 3: Chunking
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 4: Embedding & Saving (sentence-transformers & pgvector)
      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 5: Complete
      setCurrentStep(5);
      setChunkCount(Math.floor(Math.random() * 30) + 15); // Dynamic mock chunks processed
      setUploading(false);
    } catch (error) {
      setUploading(false);
      setCurrentStep(0);
      showAlert("Upload Failed", "An error occurred while parsing and embedding your training document. Please verify the format.");
    }
  };

  const resetUpload = () => {
    setFile(null);
    setApproved(false);
    setCurrentStep(0);
    setChunkCount(0);
  };

  return (
    <OrangeLayout 
      title="Training Library Ingestion" 
      subtitle="Upload standard operating procedures (SOPs)"
      onLogout={() => navigation.navigate("Login")}
    >
      <View style={styles.uploadContainer}>
        {/* Navigation Breadcrumb */}
        <TouchableOpacity onPress={() => navigation.navigate("MetricsDashboard")} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Knowledge Ingest Engine</Text>
          <Text style={styles.formSubtitle}>
            Drag-and-drop training PDFs, audio manuals, compliance videos, or checklist images.
          </Text>

          {currentStep === 0 ? (
            <View>
              {/* Drag and Drop Dropzone */}
              <TouchableOpacity 
                style={styles.dropZone}
                onPress={() => handleSelectFile('pdf')}
                onLongPress={handleDragOver}
                activeOpacity={0.8}
              >
                <Text style={styles.plusSymbol}>+</Text>
                <Text style={styles.dropZoneText}>Drag & Drop or Click to Select File</Text>
                <Text style={styles.supportedFormats}>Supports PDF, MP4/MOV, MP3/WAV, JPG/PNG (Max 10MB)</Text>
              </TouchableOpacity>

              {/* Format Quick Selection for Prototype Demonstration */}
              <Text style={styles.demoLabel}>Demo: Choose Ingestion Format</Text>
              <View style={styles.formatSelectors}>
                <TouchableOpacity style={styles.formatBtn} onPress={() => handleSelectFile('pdf')}>
                  <Text style={styles.formatBtnText}>📄 PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formatBtn} onPress={() => handleSelectFile('mp3')}>
                  <Text style={styles.formatBtnText}>🎵 Audio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formatBtn} onPress={() => handleSelectFile('mp4')}>
                  <Text style={styles.formatBtnText}>🎥 Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formatBtn} onPress={() => handleSelectFile('jpg')}>
                  <Text style={styles.formatBtnText}>📷 Image</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentStep < 5 ? (
            /* Active Loading Stepper */
            <View style={styles.stepperContainer}>
              <ActivityIndicator size="large" color="#FF6D00" style={styles.loader} />
              <Text style={styles.processingTitle}>Hold tight, your Coach is getting ready...</Text>
              
              <View style={styles.stepperWrapper}>
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, currentStep >= 1 ? styles.activeDot : styles.inactiveDot]} />
                  <Text style={[styles.stepText, currentStep >= 1 ? styles.activeStepText : styles.inactiveStepText]}>
                    Uploading file to secure cloud bucket...
                  </Text>
                </View>
                
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, currentStep >= 2 ? styles.activeDot : styles.inactiveDot]} />
                  <Text style={[styles.stepText, currentStep >= 2 ? styles.activeStepText : styles.inactiveStepText]}>
                    Extracting text content (PDF parsing, transcription, or OCR)...
                  </Text>
                </View>
                
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, currentStep >= 3 ? styles.activeDot : styles.inactiveDot]} />
                  <Text style={[styles.stepText, currentStep >= 3 ? styles.activeStepText : styles.inactiveStepText]}>
                    Splitting content into 500-word context chunks...
                  </Text>
                </View>
                
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, currentStep >= 4 ? styles.activeDot : styles.inactiveDot]} />
                  <Text style={[styles.stepText, currentStep >= 4 ? styles.activeStepText : styles.inactiveStepText]}>
                    Generating 384-dimension vector embeddings and indexing...
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* Complete Success Screen */
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Knowledge Base Updated!</Text>
              
              <View style={styles.resultsCard}>
                <Text style={styles.resultsHeader}>Ingestion Outcome:</Text>
                <Text style={styles.resultsMain}>Processed and indexed {chunkCount} distinct operational sections.</Text>
                <Text style={styles.resultsBody}>Your AI Coach is fully trained and ready for shift sessions on these updates.</Text>
              </View>

              <TouchableOpacity style={styles.resetButton} onPress={resetUpload}>
                <Text style={styles.resetButtonText}>Upload Another Document</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form details when file is selected but not yet processed */}
          {file && currentStep === 0 && (
            <View style={styles.fileDetailsSection}>
              <View style={styles.fileCard}>
                <View>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileSize}>{file.size} • {file.format.toUpperCase()} format</Text>
                </View>
                <TouchableOpacity onPress={() => setFile(null)}>
                  <Text style={styles.removeFile}>Remove</Text>
                </TouchableOpacity>
              </View>

              {/* Station Categories Selection */}
              <Text style={styles.label}>Assign to Kitchen Station</Text>
              <View style={styles.stationGrid}>
                {stations.map((st) => (
                  <TouchableOpacity
                    key={st.value}
                    style={[
                      styles.stationBtn,
                      selectedStation === st.value && styles.stationBtnActive
                    ]}
                    onPress={() => setSelectedStation(st.value)}
                  >
                    <Text style={[
                      styles.stationBtnText,
                      selectedStation === st.value && styles.stationBtnTextActive
                    ]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Approval Checkbox */}
              <View style={styles.approvalWrapper}>
                <TouchableOpacity 
                  style={[styles.checkbox, approved && styles.checkboxChecked]}
                  onPress={() => setApproved(!approved)}
                >
                  {approved && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text style={styles.approvalText}>
                  I have reviewed and approve this document. I authorize StationAI to use this to guide trainees.
                </Text>
              </View>

              {/* Ingestion Submit Button */}
              <TouchableOpacity 
                style={[styles.submitButton, (!approved || uploading) && styles.submitButtonDisabled]}
                onPress={handleIngest}
                disabled={!approved || uploading}
              >
                <Text style={styles.submitButtonText}>Train Coach Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Compliance notice */}
          <View style={styles.divider} />
          <Text style={styles.lmsNotice}>Future LMS and shift compliance integrations coming soon</Text>
        </View>
      </View>
    </OrangeLayout>
  );
}

const styles = StyleSheet.create({
  uploadContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  backLink: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#8A6851',
    marginBottom: 24,
    lineHeight: 18,
  },
  dropZone: {
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: '#FFD3B8',
    borderRadius: 16,
    backgroundColor: '#FFFBF9',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  plusSymbol: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FF6D00',
    marginBottom: 8,
  },
  dropZoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B1800',
    marginBottom: 6,
  },
  supportedFormats: {
    fontSize: 11,
    color: '#8A6851',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B1800',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formatSelectors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  formatBtn: {
    backgroundColor: '#FFF8F4',
    borderWidth: 1.2,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  formatBtnText: {
    color: '#FF6D00',
    fontSize: 12,
    fontWeight: '700',
  },
  fileDetailsSection: {
    marginTop: 20,
  },
  fileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8F4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD3B8',
    marginBottom: 18,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B1800',
  },
  fileSize: {
    fontSize: 11,
    color: '#8A6851',
    marginTop: 2,
  },
  removeFile: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B1800',
    marginBottom: 8,
  },
  stationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  stationBtn: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stationBtnActive: {
    backgroundColor: '#FF6D00',
    borderColor: '#FF6D00',
  },
  stationBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A6851',
  },
  stationBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  approvalWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    paddingRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FF6D00',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#FF6D00',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approvalText: {
    flex: 1,
    fontSize: 12,
    color: '#553622',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#FF6D00',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#FFCB9E',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  stepperContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loader: {
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6D00',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepperWrapper: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#FFD3B8',
    borderRadius: 14,
    padding: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    backgroundColor: '#FF6D00',
  },
  inactiveDot: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1,
    borderColor: '#FFD3B8',
  },
  stepText: {
    fontSize: 12,
    flex: 1,
  },
  activeStepText: {
    color: '#3B1800',
    fontWeight: '700',
  },
  inactiveStepText: {
    color: '#8A6851',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    width: 80,
    height: 80,
    borderRadius: 40,
    textAlign: 'center',
    lineHeight: 80,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 16,
  },
  resultsCard: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  resultsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6D00',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  resultsMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B1800',
    marginBottom: 4,
  },
  resultsBody: {
    fontSize: 12,
    color: '#8A6851',
    lineHeight: 18,
  },
  resetButton: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFEFE5',
    marginVertical: 20,
  },
  lmsNotice: {
    fontSize: 11,
    color: '#C4A895',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
