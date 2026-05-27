import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import OrangeLayout from '../components/OrangeLayout';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function MenuScreen({ navigation }) {
  const features = [
    {
      id: 'training',
      name: 'Training & Procedure Guidance',
      description: 'Upload kitchen manuals, configure station categories, and review step-by-step guidance metrics.',
      active: true,
      tag: 'ACTIVE MVP',
      color: '#FF6D00',
      icon: '🎓',
    },
    {
      id: 'live_help',
      name: 'Live Help Mode',
      description: 'Allows trainees to trigger an SOS alert directly to the manager dashboard when stuck.',
      active: false,
      tag: 'COMING SOON V2',
      color: '#8A6851',
      icon: '🚨',
    },
    {
      id: 'shift_recap',
      name: 'Shift Recap & Analytics',
      description: 'Automated end-of-shift reports summarizing question frequencies and compliance trends.',
      active: false,
      tag: 'COMING SOON V2',
      color: '#8A6851',
      icon: '📊',
    },
    {
      id: 'manager_wingman',
      name: 'Manager Wingman',
      description: 'Speech-to-text task reminders and hands-free shift planning logs.',
      active: false,
      tag: 'COMING SOON V2',
      color: '#8A6851',
      icon: '🤝',
    },
  ];

  const handlePress = (feat) => {
    if (feat.active) {
      // In the build order: Phase 2 includes the upload dashboard, so we navigate to the Metrics/Upload Dashboard
      navigation.navigate("MetricsDashboard");
    }
  };

  return (
    <OrangeLayout 
      title="QSR Workspaces" 
      subtitle="Select a management module" 
      onLogout={() => navigation.navigate("Login")}
    >
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.backLink} 
          onPress={() => navigation.navigate("DomainPicker")}
        >
          <Text style={styles.backLinkText}>← Change Industry Vertical</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>QSR Control Center</Text>
        <Text style={styles.sectionSubtitle}>Deploy and monitor in-ear training across all stations.</Text>
        
        <View style={isWeb ? styles.webGrid : styles.mobileList}>
          {features.map((feat) => (
            <TouchableOpacity
              key={feat.id}
              style={[
                styles.card,
                feat.active ? styles.activeCard : styles.disabledCard,
                isWeb && styles.webCard
              ]}
              onPress={() => handlePress(feat)}
              disabled={!feat.active}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.icon}>{feat.icon}</Text>
                <View style={[
                  styles.badge, 
                  feat.active ? styles.activeBadge : styles.disabledBadge
                ]}>
                  <Text style={[
                    styles.badgeText, 
                    feat.active ? styles.activeBadgeText : styles.disabledBadgeText
                  ]}>
                    {feat.tag}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.cardTitle, !feat.active && styles.disabledText]}>
                {feat.name}
              </Text>
              
              <Text style={[styles.cardDescription, !feat.active && styles.disabledText]}>
                {feat.description}
              </Text>

              {feat.active && (
                <View style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Open Console →</Text>
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
  menuContainer: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 10,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3B1800',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8A6851',
    marginBottom: 28,
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
    width: '48%',
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
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadge: {
    backgroundColor: '#FFEFE5',
  },
  disabledBadge: {
    backgroundColor: '#E6DDD7',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeBadgeText: {
    color: '#FF6D00',
  },
  disabledBadgeText: {
    color: '#8A6851',
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
