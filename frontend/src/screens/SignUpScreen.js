import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import GDPRModal from '../components/GDPRModal';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('trainee'); // Default role is trainee
  const [restaurantId, setRestaurantId] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Real-time password criteria checking
  const checkPasswordStrength = (pwd) => {
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return { hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  };

  const criteria = checkPasswordStrength(password);
  const isFormValid = 
    email.includes('@') && 
    Object.values(criteria).every(Boolean) && 
    gdprConsent;

  const handleSignUp = async () => {
    if (!isFormValid) {
      Alert.alert("Invalid Input", "Please review the password requirements and verify GDPR consent is checked.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          restaurant_id: restaurantId || null,
          gdpr_consent: gdprConsent
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        Alert.alert(
          "Registration Successful",
          "Your StationAI account has been created. Please log in to continue.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      } else {
        Alert.alert("Signup Failed", data.detail || "Unable to register. Please try again.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not connect to StationAI servers. Please ensure the backend is running.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start training naturally with StationAI</Text>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="trainee@restaurant.com"
            placeholderTextColor="#C4A895"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#C4A895"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          {/* Password Strength Validation Indicators */}
          <View style={styles.criteriaContainer}>
            <Text style={[styles.criteriaText, criteria.hasLength ? styles.valid : styles.invalid]}>
              • At least 8 characters
            </Text>
            <Text style={[styles.criteriaText, criteria.hasUpper && criteria.hasLower ? styles.valid : styles.invalid]}>
              • Case-sensitive (A-Z & a-z)
            </Text>
            <Text style={[styles.criteriaText, criteria.hasNumber ? styles.valid : styles.invalid]}>
              • At least one number
            </Text>
            <Text style={[styles.criteriaText, criteria.hasSpecial ? styles.valid : styles.invalid]}>
              • At least one special symbol (!@#$)
            </Text>
          </View>

          {/* Role Picker (Trainee vs Manager Toggle) */}
          <Text style={styles.label}>Registering As</Text>
          <View style={styles.rolePicker}>
            <TouchableOpacity 
              style={[styles.roleOption, role === 'trainee' && styles.selectedRoleOption]}
              onPress={() => setRole('trainee')}
            >
              <Text style={[styles.roleText, role === 'trainee' && styles.selectedRoleText]}>Trainee</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roleOption, role === 'manager' && styles.selectedRoleOption]}
              onPress={() => setRole('manager')}
            >
              <Text style={[styles.roleText, role === 'manager' && styles.selectedRoleText]}>Manager</Text>
            </TouchableOpacity>
          </View>

          {/* Restaurant ID Input */}
          <Text style={styles.label}>Restaurant ID (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            placeholderTextColor="#C4A895"
            value={restaurantId}
            onChangeText={setRestaurantId}
            autoCapitalize="none"
          />

          {/* GDPR Consent Box */}
          <View style={styles.consentContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, gdprConsent && styles.checkedBox]} 
              onPress={() => setGdprConsent(!gdprConsent)}
            >
              {gdprConsent && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            
            <Text style={styles.consentLabel}>
              I consent to the{' '}
              <Text style={styles.consentLink} onPress={() => setModalVisible(true)}>
                UK GDPR Data Processing Agreement
              </Text>{' '}
              required for voice mentor services.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, !isFormValid && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={!isFormValid}
          >
            <Text style={styles.submitButtonText}>Register & Proceed</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginRedirect}>
            <Text style={styles.loginRedirectText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* GDPR Details Modal */}
      <GDPRModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onAccept={() => setGdprConsent(true)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEFE5', // Light premium orange tint
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 109, 0, 0.15)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B1800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A6851',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B1800',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#3B1800',
  },
  criteriaContainer: {
    marginTop: 10,
    backgroundColor: '#FFF8F4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEFE5',
  },
  criteriaText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'System',
  },
  valid: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  invalid: {
    color: '#C62828',
  },
  rolePicker: {
    flexDirection: 'row',
    backgroundColor: '#FFEFE5',
    borderRadius: 12,
    padding: 4,
    height: 48,
    alignItems: 'center',
  },
  roleOption: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedRoleOption: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A6851',
  },
  selectedRoleText: {
    color: '#FF6D00',
  },
  consentContainer: {
    flexDirection: 'row',
    marginTop: 18,
    alignItems: 'flex-start',
    gap: 10,
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
  checkedBox: {
    backgroundColor: '#FF6D00',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  consentLabel: {
    flex: 1,
    fontSize: 12,
    color: '#8A6851',
    lineHeight: 18,
  },
  consentLink: {
    color: '#FF6D00',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#FF6D00',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#FFCB9E',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginRedirect: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginRedirectText: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '600',
  },
});
