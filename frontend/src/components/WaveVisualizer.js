import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export default function WaveVisualizer({ state }) {
  // Animators
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveHeights = [
    useRef(new Animated.Value(20)).current,
    useRef(new Animated.Value(40)).current,
    useRef(new Animated.Value(60)).current,
    useRef(new Animated.Value(40)).current,
    useRef(new Animated.Value(20)).current,
  ];

  useEffect(() => {
    // -------------------------------------------------------------
    // LISTENING ANIMS: Breathing Pulse
    // -------------------------------------------------------------
    if (state === 'listening') {
      const pulseSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseSequence.start();
      return () => pulseSequence.stop();
    }

    // -------------------------------------------------------------
    // THINKING ANIMS: Rotating Orbit Ring
    // -------------------------------------------------------------
    if (state === 'thinking') {
      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();
      return () => {
        rotateLoop.stop();
        rotateAnim.setValue(0);
      };
    }

    // -------------------------------------------------------------
    // SPEAKING ANIMS: Oscillating Frequency Waves
    // -------------------------------------------------------------
    if (state === 'speaking') {
      const waveAnimations = waveHeights.map((val, idx) => {
        const minVal = 15;
        const maxVal = 70 - (idx % 2) * 20;
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: maxVal,
              duration: 250 + idx * 80,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false, // Layout heights cannot use native driver
            }),
            Animated.timing(val, {
              toValue: minVal,
              duration: 250 + idx * 80,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
          ])
        );
      });
      
      waveAnimations.forEach(anim => anim.start());
      return () => waveAnimations.forEach(anim => anim.stop());
    }
  }, [state]);

  // -------------------------------------------------------------
  // RENDER SELECTION BY STATE
  // -------------------------------------------------------------

  if (state === 'listening') {
    return (
      <View style={styles.centerContainer}>
        <Animated.View style={[styles.listenRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.innerDot} />
        </Animated.View>
        <Text style={styles.listeningText}>Coach is Listening...</Text>
      </View>
    );
  }

  if (state === 'thinking') {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });

    return (
      <View style={styles.centerContainer}>
        <View style={styles.thinkingWrapper}>
          <Animated.View style={[styles.thinkingRing, { transform: [{ rotate: spin }] }]}>
            <View style={styles.thinkingDot} />
          </Animated.View>
        </View>
        <Text style={styles.thinkingText}>Coach is Thinking...</Text>
      </View>
    );
  }

  if (state === 'speaking') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.waveContainer}>
          {waveHeights.map((heightVal, idx) => (
            <Animated.View 
              key={idx} 
              style={[
                styles.waveBar, 
                { height: heightVal },
                idx % 2 === 0 ? styles.primaryBar : styles.secondaryBar
              ]} 
            />
          ))}
        </View>
        <Text style={styles.speakingText}>Coach is Speaking...</Text>
      </View>
    );
  }

  // Fallback (Paused or Idle State)
  return (
    <View style={styles.centerContainer}>
      <View style={styles.pausedCircle}>
        <View style={styles.pausedIndicator} />
      </View>
      <Text style={styles.pausedText}>Coach Paused. Say Wake Word to Resume.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listenRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 109, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 109, 0, 0.25)',
  },
  innerDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6D00',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  listeningText: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6D00',
    letterSpacing: 0.5,
  },
  thinkingWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thinkingRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD3B8',
    borderTopColor: '#FF6D00',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  thinkingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6D00',
    marginTop: -3,
  },
  thinkingText: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '700',
    color: '#8A6851',
    letterSpacing: 0.5,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 80,
  },
  waveBar: {
    width: 8,
    borderRadius: 4,
  },
  primaryBar: {
    backgroundColor: '#FF6D00',
  },
  secondaryBar: {
    backgroundColor: '#FFCB9E',
  },
  speakingText: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '700',
    color: '#3B1800',
    letterSpacing: 0.5,
  },
  pausedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBF9',
    borderWidth: 2.5,
    borderColor: '#E6DDD7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedIndicator: {
    width: 20,
    height: 20,
    backgroundColor: '#8A6851',
    borderRadius: 4,
  },
  pausedText: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: '600',
    color: '#8A6851',
    textAlign: 'center',
  },
});

