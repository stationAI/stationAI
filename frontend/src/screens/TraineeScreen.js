import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Dimensions, ScrollView } from 'react-native';
import OrangeLayout from '../components/OrangeLayout';
import WaveVisualizer from '../components/WaveVisualizer';
import { showAlert } from '../utils/alert';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function TraineeScreen({ navigation }) {
  const [sessionState, setSessionState] = useState('paused'); // 'listening', 'thinking', 'speaking', 'paused'
  const [textMode, setTextMode] = useState(false); // Toggle fallback text mode
  const [textQuery, setTextQuery] = useState('');
  const [currentStepText, setCurrentStepText] = useState('Press the microphone or say "Hey Coach" to begin your training shift.');
  const [activeSessionId, setActiveSessionId] = useState('sess_450e');
  
  // Mock session list for the left ChatGPT-style sidebar
  const [sessions, setSessions] = useState([
    { id: 'sess_450e', title: '🍔 Burger Station Shift', timestamp: 'Today, 11:30 AM', active: true, paused: true },
    { id: 'sess_840f', title: '🥩 Grill Meat Prep SOP', timestamp: 'Yesterday, 4:15 PM', active: false, paused: false },
    { id: 'sess_220a', title: '🍟 Fryer Category Training', timestamp: 'May 25, 2:00 PM', active: false, paused: false },
  ]);

  // Mock chat messages log inside the active session
  const [chatLogs, setChatLogs] = useState([
    { id: '1', sender: 'coach', text: "Let's change the way of getting trained. I am Zinger, your KFC Coach. Say 'done' when you complete each step or ask me how to do anything." },
  ]);

  const flatListRef = useRef(null);

  // Auto-scroll chat history logs
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [chatLogs]);

  // Simulate speaking and receiving voice response
  const triggerVoiceMentor = async (queryText) => {
    if (!queryText) return;
    
    // Add user query
    const userMessageId = String(Date.now());
    setChatLogs(prev => [...prev, { id: userMessageId, sender: 'trainee', text: queryText }]);
    setSessionState('thinking');

    try {
      // Simulate RAG + Gemma 4 execution latency
      await new Promise(resolve => setTimeout(resolve, 1200));

      const coachMessageId = String(Date.now() + 1);
      let responseText = "";

      // Simple mock intent routing
      const cleaned = queryText.toLowerCase().strip ? queryText.toLowerCase().strip() : queryText.toLowerCase();
      
      if (cleaned.includes("done") || cleaned.includes("next") || cleaned.includes("yes")) {
        responseText = "Got it. Step 2: Apply exactly 15ml of standard mayonnaise onto the toasted bun wrapper.";
        setCurrentStepText(responseText);
      } else if (cleaned.includes("burger") || cleaned.includes("how")) {
        responseText = "To build a burger, Step 1: Toast your bun for 15 seconds. Then spread mayonnaise, add shredded lettuce, lay the chicken breast, and wrap. Say 'done' to proceed.";
        setCurrentStepText("Step 1: Toast your bun for 15 seconds.");
      } else if (cleaned.includes("stop")) {
        setSessionState('paused');
        responseText = "Session paused. Your progress is cached. Say wake word to resume.";
      } else {
        responseText = "Ask your manager.";
      }

      setChatLogs(prev => [...prev, { id: coachMessageId, sender: 'coach', text: responseText }]);
      setSessionState('speaking');
      
      // Simulate speaking duration
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSessionState('listening');

    } catch (e) {
      setSessionState('paused');
      showAlert("STT Error", "Noise levels exceed VAD limits. Transitioning to fallback Text Mode.");
      setTextMode(true);
    }
  };

  const handleTextSubmit = () => {
    if (!textQuery.trim()) return;
    const query = textQuery;
    setTextQuery('');
    triggerVoiceMentor(query);
  };

  const handleWakeWordPress = () => {
    setSessionState('listening');
    setChatLogs(prev => [...prev, { id: String(Date.now()), sender: 'coach', text: "Hey! KFC Coach 'Zinger' is active and listening. Go ahead." }]);
  };

  const handlePausePress = () => {
    setSessionState('paused');
    setChatLogs(prev => [...prev, { id: String(Date.now()), sender: 'coach', text: "Shift paused. Redis keeps session active." }]);
  };

  const handleExitPress = () => {
    setSessionState('paused');
    showAlert(
      "Session Completed",
      "Goodbye Coach! Your session has been closed and successfully saved to Supabase.",
      [{ text: "OK", onPress: () => navigation.navigate("Login") }]
    );
  };

  return (
    <OrangeLayout 
      title="Trainee Workstation" 
      subtitle="KFC Earpiece Coach 'Zinger' is active"
      showHeader={true}
      scrollable={false}
      onLogout={() => navigation.navigate("Login")}
    >
      <View style={styles.workspace}>
        {/* Left Side: ChatGPT Session History Sidebar (Web Desktop View) */}
        {isWeb && (
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Recent Shifts</Text>
            {sessions.map((sess) => (
              <TouchableOpacity 
                key={sess.id} 
                style={[
                  styles.sidebarItem, 
                  sess.id === activeSessionId && styles.sidebarItemActive
                ]}
                onPress={() => setActiveSessionId(sess.id)}
              >
                <View style={styles.sidebarItemHeader}>
                  <Text style={[
                    styles.sidebarItemTitle, 
                    sess.id === activeSessionId ? styles.activeText : styles.inactiveText
                  ]}>
                    {sess.title}
                  </Text>
                  {sess.paused && (
                    <View style={styles.pausedBadge}>
                      <Text style={styles.pausedBadgeText}>PAUSED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sidebarItemTime}>{sess.timestamp}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Center/Right Main Conversation Area */}
        <View style={styles.mainFeed}>
          {/* Active step display banner */}
          <View style={styles.activeStepCard}>
            <Text style={styles.stepHeader}>Active Instruction Step:</Text>
            <Text style={styles.stepBodyText}>{currentStepText}</Text>
          </View>

          {/* Micro-Animation Wave Widget */}
          <View style={styles.waveWrapper}>
            <WaveVisualizer state={sessionState} />
          </View>

          {/* Scrolling Conversation Log */}
          <FlatList
            ref={flatListRef}
            data={chatLogs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatScroll}
            renderItem={({ item }) => (
              <View style={[
                styles.messageBubble, 
                item.sender === 'coach' ? styles.coachBubble : styles.traineeBubble
              ]}>
                <Text style={styles.bubbleSender}>
                  {item.sender === 'coach' ? '🤖 KFC Coach (Zinger)' : '🧑‍🍳 You'}
                </Text>
                <Text style={[
                  styles.bubbleText,
                  item.sender === 'coach' ? styles.coachText : styles.traineeText
                ]}>
                  {item.text}
                </Text>
              </View>
            )}
          />

          {/* Input Panel: Speaks vs Fallback Texts */}
          <View style={styles.inputPanel}>
            {textMode ? (
              /* Fallback chat bar */
              <View style={styles.textInputWrapper}>
                <TextInput
                  style={styles.chatInput}
                  value={textQuery}
                  onChangeText={setTextQuery}
                  placeholder="Type your question or say 'done'..."
                  placeholderTextColor="#C4A895"
                  onSubmitEditing={handleTextSubmit}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleTextSubmit}>
                  <Text style={styles.sendBtnText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.voiceToggle} onPress={() => setTextMode(false)}>
                  <Text style={styles.voiceToggleText}>🎙️ Mic Mode</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Interactive Mic buttons for prototype simulation */
              <View style={styles.micButtonsWrapper}>
                <TouchableOpacity style={styles.actionButton} onPress={handleWakeWordPress}>
                  <Text style={styles.actionButtonText}>🎙️ Say "Hey Zinger"</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={() => triggerVoiceMentor("I finished toasted the buns")}>
                  <Text style={styles.actionButtonText}>✓ Say "Done"</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => triggerVoiceMentor("How do I make a chicken sandwich?")}>
                  <Text style={styles.actionButtonText}>❓ Ask "How do I build?"</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handlePausePress}>
                  <Text style={styles.actionButtonText}>⏸️ Say "Coach stop"</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.exitBtn]} onPress={handleExitPress}>
                  <Text style={styles.exitBtnText}>🛑 "Goodbye Coach"</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.fallbackToggle} onPress={() => setTextMode(true)}>
                  <Text style={styles.fallbackToggleText}>⌨️ Switch to Text Mode</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </OrangeLayout>
  );
}

const styles = StyleSheet.create({
  workspace: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#FFFBF9',
    borderRightWidth: 1.5,
    borderRightColor: '#FFD3B8',
    padding: 16,
  },
  sidebarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A6851',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  sidebarItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: '#FFEFE5',
    borderColor: '#FFD3B8',
  },
  sidebarItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sidebarItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  activeText: {
    color: '#FF6D00',
  },
  inactiveText: {
    color: '#3B1800',
  },
  pausedBadge: {
    backgroundColor: '#FFF1E8',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFD3B8',
  },
  pausedBadgeText: {
    color: '#C45200',
    fontSize: 8,
    fontWeight: '800',
  },
  sidebarItemTime: {
    fontSize: 11,
    color: '#8A6851',
  },
  mainFeed: {
    flex: 1,
    backgroundColor: '#FFEFE5',
    padding: 16,
  },
  activeStepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  stepHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6D00',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stepBodyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B1800',
    lineHeight: 20,
  },
  waveWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFEFE5',
    marginBottom: 16,
    justifyContent: 'center',
  },
  chatScroll: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  coachBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#FFD3B8',
  },
  traineeBubble: {
    backgroundColor: '#FF6D00',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleSender: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A6851',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  coachText: {
    color: '#3B1800',
  },
  traineeText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FFD3B8',
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#3B1800',
  },
  sendBtn: {
    backgroundColor: '#FF6D00',
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  voiceToggle: {
    backgroundColor: '#FFEFE5',
    borderWidth: 1,
    borderColor: '#FFD3B8',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceToggleText: {
    color: '#FF6D00',
    fontSize: 12,
    fontWeight: '700',
  },
  micButtonsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: '#FFF8F4',
    borderWidth: 1.2,
    borderColor: '#FFD3B8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#FF6D00',
    fontSize: 12,
    fontWeight: '700',
  },
  exitBtn: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FFB8B8',
  },
  exitBtnText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '700',
  },
  fallbackToggle: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  fallbackToggleText: {
    color: '#8A6851',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
