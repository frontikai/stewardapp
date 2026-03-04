import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { AppContext } from '../context/AppContext';
import { getGreeting } from '../utils/dateUtils';
import { getCurrentMonthStartEnd } from '../utils/dateUtils';
import ScriptureCard from '../components/ScriptureCard';
import SummaryCard from '../components/SummaryCard';
import PendingTitheCard from '../components/PendingTitheCard';
import { getDonationTotal, getPendingTitheTotal } from '../database/Database';

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { settings } = useContext(AppContext);
  const greeting = getGreeting();

  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [pendingTithe, setPendingTithe] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadDashboardData = async () => {
        try {
          setIsLoading(true);
          
          // Get this month's giving total
          const { start, end } = getCurrentMonthStartEnd();
          const total = await getDonationTotal(start, end);
          setMonthlyTotal(total);

          // Get pending tithe if income tracking is enabled
          if (settings.incomeTrackingEnabled === 'true') {
            const tithe = await getPendingTitheTotal();
            setPendingTithe(tithe);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error loading dashboard data:', error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadDashboardData();
    }, [settings.incomeTrackingEnabled])
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.greeting, { color: theme.colors.primary }]}>
          {greeting}
        </Text>

        <SummaryCard
          title="This Month's Giving"
          amount={monthlyTotal}
          icon="heart"
          currency={settings.currency}
          onPress={() => navigation.navigate('Giving')}
        />

        {settings.incomeTrackingEnabled === 'true' && (
          <PendingTitheCard
            amount={pendingTithe}
            percentage={settings.tithePercentage}
            currency={settings.currency}
            onPress={() => navigation.navigate('Income')}
          />
        )}

        <View style={styles.quickActions}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => navigation.navigate('Giving', { showAddDonation: true })}
            style={styles.actionButton}
          >
            Log Donation
          </Button>
          {settings.incomeTrackingEnabled === 'true' && (
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => navigation.navigate('Income', { showAddIncome: true })}
              style={styles.actionButton}
            >
              Log Income
            </Button>
          )}
        </View>
        
        <ScriptureCard />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default HomeScreen;
