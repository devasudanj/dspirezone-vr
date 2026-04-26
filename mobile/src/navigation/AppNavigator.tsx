/**
 * src/navigation/AppNavigator.tsx
 * --------------------------------
 * Root stack navigator for Dspire VR Zone.
 * Stack order mirrors the user's session booking flow.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Colors from '../theme/colors';
import type { RootStackParamList } from './types';

import GameLibraryScreen from '../screens/GameLibraryScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import HeadsetSelectionScreen from '../screens/HeadsetSelectionScreen';
import TimeSelectionScreen from '../screens/TimeSelectionScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="GameLibrary"
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="GameLibrary"
          component={GameLibraryScreen}
          options={{ title: '🎮 Dspire VR Zone', headerShown: true }}
        />
        <Stack.Screen
          name="GameDetail"
          component={GameDetailScreen}
          options={{ title: 'Game Details' }}
        />
        <Stack.Screen
          name="HeadsetSelection"
          component={HeadsetSelectionScreen}
          options={{ title: 'Select Headset' }}
        />
        <Stack.Screen
          name="TimeSelection"
          component={TimeSelectionScreen}
          options={{ title: 'Select Duration' }}
        />
        <Stack.Screen
          name="SessionSummary"
          component={SessionSummaryScreen}
          options={{ title: 'Session Confirmed', headerBackVisible: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
