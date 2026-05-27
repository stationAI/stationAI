import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { BACKEND_URL } from '../utils/config';
import { showAlert } from '../utils/alert';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  const isEmailValid = email.includes('@') && email.length > 3;
  const isPasswordValid = password.length >= 4;
  const canSubmit = isEmailValid && isPasswordValid;

  const handleLogin = async () => {
    if (!canSubmit) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        // Step 1: Save tokens locally or in context here if needed
        // Step 2: Show the premium welcome message for exactly 2 seconds
        setWelcomeVisible(true);
        
        setTimeout(() => {
          setWelcomeVisible(false);
          // Step 3: Redirect dynamically based on the role
          if (data.role === 'manager' || data.role === 'admin') {
            navigation.navigate("DomainPicker");
          } else {
            navigation.navigate("TraineeWorkspace");
          }
        }, 2000);
      } else {
        showAlert("Login Failed", data.detail || "Invalid email or password.");
      }
    } catch (error) {
      setLoading(false);
      showAlert("Connection Error", `Details: ${error.message}. Please ensure the backend is running at ${BACKEND_URL}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.formCard}>
        {welcomeVisible ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeText}>
              Welcome to the new way to train and supervise your staff with StationAI
            </Text>
            <ActivityIndicator size="large" color="#FF6D00" style={styles.spinner} />
          </View>
        ) : (
          <View>
            <Text style={styles.logoText}>Station<Text style={styles.orangeLogo}>AI</Text></Text>
            <Text style={styles.subtitle}>Enter your credentials to log in</Text>

            {/* Email Input */}
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="manager@kfc.co.uk"
              placeholderTextColor="#C4A895"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              disabled={loading}
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
              disabled={loading}
            />

            {/* Login Button with Dynamic Highlighting */}
            <TouchableOpacity 
              style={[
                styles.loginButton, 
                canSubmit ? styles.loginButtonActive : styles.loginButtonInactive
              ]}
              onPress={handleLogin}
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate("SignUp")} 
              style={styles.signUpRedirect}
              disabled={loading}
            >
              <Text style={styles.signUpRedirectText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>

            {/* Offline Demo Mode Bypass */}
            <TouchableOpacity 
              onPress={() => {
                setWelcomeVisible(true);
                setTimeout(() => {
                  setWelcomeVisible(false);
                  navigation.navigate("DomainPicker");
                }, 1500);
              }}
              style={styles.demoBypassButton}
            >
              <Text style={styles.demoBypassText}>✨ Enter Offline Demo Mode (Bypass Server)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEFE5', // Light premium orange tint
    justifyContent: 'center',
    padding: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 109, 0, 0.15)',
    minHeight: 380,
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3B1800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  orangeLogo: {
    color: '#FF6D00',
  },
  subtitle: {
    fontSize: 13,
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
  loginButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  loginButtonInactive: {
    backgroundColor: '#FFCB9E', // Low contrast orange when invalid
  },
  loginButtonActive: {
    backgroundColor: '#FF6D00', // Vibrant active orange
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signUpRedirect: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpRedirectText: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '600',
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6D00',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: '#553622',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: 'System',
  },
  spinner: {
    marginTop: 24,
  },
  demoBypassButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#FF6D00',
    borderRadius: 14,
    backgroundColor: '#FFF8F4',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  demoBypassText: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '700',
  },
});
