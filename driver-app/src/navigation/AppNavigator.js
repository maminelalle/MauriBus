import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Platform } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TripScreen from '../screens/TripScreen';
import ReportScreen from '../screens/ReportScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ScanTicketScreen from '../screens/ScanTicketScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Accueil: ['home', 'home-outline'],
  Trajets: ['bus', 'bus-outline'],
  Revenus: ['cash', 'cash-outline'],
  Profil: ['person-circle', 'person-circle-outline'],
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.lightGray,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 82 : 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const pair = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? pair[0] : pair[1]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={DashboardScreen}
        options={{ title: 'Accueil', headerTitle: 'MauriBus Chauffeur' }}
      />
      <Tab.Screen
        name="Trajets"
        component={HistoryScreen}
        options={{ title: 'Trajets', headerTitle: 'Mes Trajets' }}
      />
      <Tab.Screen
        name="Revenus"
        component={EarningsScreen}
        options={{ title: 'Revenus', headerTitle: 'Mes Revenus' }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ title: 'Profil', headerTitle: 'Mon Profil' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Trip"
              component={TripScreen}
              options={{
                headerShown: true,
                headerTitle: 'Trajet en cours',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Report"
              component={ReportScreen}
              options={{
                headerShown: true,
                headerTitle: 'Signaler un incident',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Messages Admin',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
            <Stack.Screen
              name="ScanTicket"
              component={ScanTicketScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
