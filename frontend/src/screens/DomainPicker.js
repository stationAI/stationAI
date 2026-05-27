import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import OrangeLayout from '../components/OrangeLayout';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function DomainPicker({ navigation }) {
  const domains = [
    {
      id: 'qsr',
      name: 'Quick Service Restaurant (QSR)',
      description: 'Train kitchen staff in high-decibel environments on burgers, grills, and fryers step-by-step.',
      active: true,
      icon: '🍔',
    },
    {
      id: 'care',
      name: 'Care Home Training',
      description: 'Instructional compliance and healthcare safety guidance.',
      active: false,
      icon: '🏥',
    },
    {
      id: 'warehouse',
      name: 'Warehouse Operations',
      description: 'SOPs for inventory sorting, logistics, and forklift safety controls.',
      active: false,
      icon: '📦',
    },
    {
      id: 'retail',
      name: 'Retail & Service Desk',
      description: 'Point of sale operations and customer satisfaction guidelines.',
      active: false,
      icon: '🛍️',
    },
  ];

  const handlePress = (domain) => {
    if (domain.active) {
      navigation.navigate("MenuScreen");
    }
  };

  const handleLogout = () => {
    navigation.navigate("Login");
  };

  return (
    <OrangeLayout 
      title="Manager Console" 
      subtitle="Select your industry vertical" 
      onLogout={handleLogout}
    >
      <View style={styles.gridContainer}>
        <Text style={styles.welcomeTitle}>Welcome, Sasi Kiran Neelam</Text>
        <Text style={styles.welcomeText}>Select your business segment to configure your voice training mentor.</Text>
        
        <View style={isWeb ? styles.webGrid : styles.mobileList}>
          {domains.map((domain) => (
            <TouchableOpacity
              key={domain.id}
              style={[
                styles.card,
                domain.active ? styles.activeCard : styles.disabledCard,
                isWeb && styles.webCard
              ]}
              onPress={() => handlePress(domain)}
              disabled={!domain.active}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.icon}>{domain.icon}</Text>
                {!domain.active && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                )}
              </View>
              
              <Text style={[styles.cardTitle, !domain.active && styles.disabledText]}>
                {domain.name}
              </Text>
              
              <Text style={[styles.cardDescription, !domain.active && styles.disabledText]}>
                {domain.description}
              </Text>

              {domain.active && (
                <View style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Configure Vertical →</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </OrangeLayout>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 4,
    fontFamily: 'System',
  },
  welcomeText: {
    fontSize: 14,
    color: '#8A6851',
    marginBottom: 28,
    fontFamily: 'System',
  },
  webGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  mobileList: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  webCard: {
    width: '48%', // Grid layout for desktop
  },
  activeCard: {
    borderColor: '#FF6D00',
    shadowColor: '#FF6D00',
    shadowOpacity: 0.08,
  },
  disabledCard: {
    borderColor: '#E6DDD7',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  comingSoonBadge: {
    backgroundColor: '#E6DDD7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonText: {
    color: '#8A6851',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B1800',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6E4E37',
    lineHeight: 18,
    marginBottom: 16,
  },
  disabledText: {
    color: '#A08472',
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF2EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FF6D00',
    fontSize: 13,
    fontWeight: '700',
  },
});
