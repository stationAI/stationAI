import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import DomainPicker from './src/screens/DomainPicker';
import MenuScreen from './src/screens/MenuScreen';
import UploadScreen from './src/screens/UploadScreen';
import TraineeScreen from './src/screens/TraineeScreen';
import MetricsDashboard from './src/screens/MetricsDashboard';
import AdminScreen from './src/screens/AdminScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.id = 'web-scroll-override';
      style.textContent = `
        html, body, #root {
          height: auto !important;
          min-height: 100% !important;
          overflow: auto !important;
          overflow-y: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#FFEFE5' }
            }}
          >
            {/* Authentication Flow */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            
            {/* Core Dashboard / Navigation Grid */}
            <Stack.Screen name="DomainPicker" component={DomainPicker} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            
            {/* Operational screens */}
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="TraineeWorkspace" component={TraineeScreen} />
            <Stack.Screen name="MetricsDashboard" component={MetricsDashboard} />
            <Stack.Screen name="Admin" component={AdminScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
