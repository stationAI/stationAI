import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Platform } from 'react-native';

export default function OrangeLayout({ children, title, subtitle, showHeader = true, scrollable = true, onLogout }) {
  // Use native browser window scrollbar on Web (by using View instead of ScrollView), and ScrollView on mobile devices
  const Container = (scrollable && Platform.OS !== 'web') ? ScrollView : View;
  
  // Bounded safeArea: allow natural window scrolling when scrollable is true, and lock to viewport when scrollable is false
  const safeAreaStyle = [
    styles.safeArea,
    Platform.OS === 'web' && (scrollable 
      ? { minHeight: '100vh' } 
      : { height: '100vh', overflow: 'hidden' })
  ];
  
  return (
    <SafeAreaView style={safeAreaStyle}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFEFE5" />
      
      {/* Dynamic Header */}
      {showHeader && (
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.logoText}>Station<Text style={styles.logoOrange}>AI</Text></Text>
            {title && <Text style={styles.headerTitle}>{title}</Text>}
            {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>
          
          {onLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main Container Content */}
      <Container 
        style={styles.mainContainer} 
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFEFE5', // Premium warm orange backdrop
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFD3B8',
    backgroundColor: '#FFEFE5',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3B1800',
    letterSpacing: -0.3,
  },
  logoOrange: {
    color: '#FF6D00',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6D00',
    marginTop: 2,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8A6851',
    marginTop: 1,
    fontFamily: 'System',
  },
  logoutButton: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#C45200',
    fontSize: 12,
    fontWeight: '700',
  },
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
});
