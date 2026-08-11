/**
 * src/navigation/AppNavigator.tsx
 * --------------------------------
 * Root navigator for Dspire VR Zone.
 * Bottom tab at root: Games (stack) | Suggest a Game (feedback form).
 *
 * Games stack flow:
 *   GameTypeSelection
 *     ├── VR path:  GameLibrary → GameDetail → TimeSelection → SessionSummary
 *     └── Nex path: NexPlaygroundLibrary → NexPlaygroundDetail
 *                   → NexPlaygroundTimeSelection → NexPlaygroundSessionSummary
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../theme/colors';
import type { GamesStackParamList, RootTabParamList } from './types';

// Shared screens
import GameTypeSelectionScreen from '../screens/GameTypeSelectionScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

// VR flow screens
import GameLibraryScreen from '../screens/GameLibraryScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import SessionContactScreen from '../screens/SessionContactScreen';
import TimeSelectionScreen from '../screens/TimeSelectionScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';

// Nex Playground flow screens
import NexPlaygroundLibraryScreen from '../screens/NexPlaygroundLibraryScreen';
import NexPlaygroundDetailScreen from '../screens/NexPlaygroundDetailScreen';
import NexSessionContactScreen from '../screens/NexSessionContactScreen';
import NexPlaygroundTimeSelectionScreen from '../screens/NexPlaygroundTimeSelectionScreen';
import NexPlaygroundSessionSummaryScreen from '../screens/NexPlaygroundSessionSummaryScreen';

const GamesStack = createNativeStackNavigator<GamesStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.background },
  animation: 'slide_from_right' as const,
};

function GamesNavigator() {
  return (
    <GamesStack.Navigator screenOptions={stackScreenOptions}>
      {/* ── Top-level selection ─────────────────────────────────────────── */}
      <GamesStack.Screen
        name="GameTypeSelection"
        component={GameTypeSelectionScreen}
        options={{ title: '🎮 Dspire VR Zone' }}
      />

      {/* ── VR flow ─────────────────────────────────────────────────────── */}
      <GamesStack.Screen
        name="GameLibrary"
        component={GameLibraryScreen}
        options={{ title: '🥽 VR Games' }}
      />
      <GamesStack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={{ title: 'Game Details' }}
      />
      <GamesStack.Screen
        name="SessionContact"
        component={SessionContactScreen}
        options={{ title: 'Your Details' }}
      />
      <GamesStack.Screen
        name="TimeSelection"
        component={TimeSelectionScreen}
        options={{ title: 'Select Duration' }}
      />
      <GamesStack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{ title: 'Session Confirmed', headerBackVisible: false }}
      />

      {/* ── Nex Playground flow ─────────────────────────────────────────── */}
      <GamesStack.Screen
        name="NexPlaygroundLibrary"
        component={NexPlaygroundLibraryScreen}
        options={{ title: '🕹️ Nex Playground' }}
      />
      <GamesStack.Screen
        name="NexPlaygroundDetail"
        component={NexPlaygroundDetailScreen}
        options={{ title: 'Game Details' }}
      />
      <GamesStack.Screen
        name="NexSessionContact"
        component={NexSessionContactScreen}
        options={{ title: 'Your Details' }}
      />
      <GamesStack.Screen
        name="NexPlaygroundTimeSelection"
        component={NexPlaygroundTimeSelectionScreen}
        options={{ title: 'Select Duration' }}
      />
      <GamesStack.Screen
        name="NexPlaygroundSessionSummary"
        component={NexPlaygroundSessionSummaryScreen}
        options={{ title: 'Session Confirmed', headerBackVisible: false }}
      />
    </GamesStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              GamesStack: 'game-controller',
              Feedback: 'bulb',
            };
            return <Ionicons name={icons[route.name] ?? 'ellipse'} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="GamesStack"
          component={GamesNavigator}
          options={{ title: 'Games' }}
        />
        <Tab.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{
            title: 'Suggest a Game',
            headerShown: true,
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '700', fontSize: 18 },
            headerShadowVisible: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
