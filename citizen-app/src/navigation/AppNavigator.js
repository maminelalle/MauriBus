import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Platform } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

import SplashScreen from '../screens/SplashScreen';
import ChoiceScreen from '../screens/ChoiceScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LinesScreen from '../screens/LinesScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LineDetailScreen from '../screens/LineDetailScreen';
import LiveMapScreen from '../screens/LiveMapScreen';
import PaymentScreen from '../screens/PaymentScreen';
import HistoryScreen from '../screens/HistoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SupportScreen from '../screens/SupportScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ActiveTripScreen from '../screens/ActiveTripScreen';
import TicketScreen from '../screens/TicketScreen';
import RatingScreen from '../screens/RatingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Accueil: ['home', 'home-outline'],
  Lignes: ['list', 'list-outline'],
  Wallet: ['wallet', 'wallet-outline'],
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
      <Tab.Screen name="Accueil" component={DashboardScreen}
        options={{ title: 'Accueil', headerTitle: 'MauriBus' }} />
      <Tab.Screen name="Lignes" component={LinesScreen}
        options={{ title: 'Lignes', headerTitle: 'Lignes de Bus' }} />
      <Tab.Screen name="Wallet" component={WalletScreen}
        options={{ title: 'Wallet', headerTitle: 'Mon Wallet' }} />
      <Tab.Screen name="Profil" component={ProfileScreen}
        options={{ title: 'Profil', headerTitle: 'Mon Profil' }} />
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
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Choice" component={ChoiceScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="LineDetail" component={LineDetailScreen}
              options={{ headerShown: true, headerTitle: 'Détail Ligne',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }} />
            <Stack.Screen name="LiveMap" component={LiveMapScreen}
              options={{ headerShown: true, headerTitle: 'Bus en Temps Réel',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }} />
            <Stack.Screen name="Payment" component={PaymentScreen}
              options={{ headerShown: true, headerTitle: 'Paiement',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }} />
            <Stack.Screen name="History" component={HistoryScreen}
              options={{ headerShown: true, headerTitle: 'Historique',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen}
              options={{ headerShown: true, headerTitle: 'Notifications',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }} />
            <Stack.Screen name="Support" component={SupportScreen}
              options={{ headerShown: true, headerTitle: 'Support',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }} />
            <Stack.Screen name="Settings" component={SettingsScreen}
              options={{ headerShown: true, headerTitle: 'Paramètres',
                headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }} />
            <Stack.Screen name="ActiveTrip" component={ActiveTripScreen}
              options={{ headerShown: false }} />
            <Stack.Screen name="Ticket" component={TicketScreen}
              options={{ headerShown: false }} />
            <Stack.Screen name="Rating" component={RatingScreen}
              options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
