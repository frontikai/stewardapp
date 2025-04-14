import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  useTheme, 
  Divider,
  Button,
  SegmentedButtons
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { AppContext } from '../context/AppContext';
import ProgressBar from '../components/ProgressBar';
import ChartGivingOverTime from '../components/ChartGivingOverTime';
import ChartGivingByRecipient from '../components/ChartGivingByRecipient';
import { 
  getDonations, 
  getDonationTotal,
  getRecipients
} from '../database/Database';
import { formatDate } from '../utils/dateUtils';
import { exportToCSV } from '../utils/exportData';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const theme = useTheme();
  const { settings } = useContext(AppContext);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [donationData, setDonationData] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [donationTotal, setDonationTotal] = useState(0);
  const [donationGoal, setDonationGoal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [yearlyGoal, setYearlyGoal] = useState(0);
  
  // Set some sample goals - in real app these would be saved in settings
  const monthlyGoal = 500;
  const annualGoal = 6000;
  
  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Get date ranges based on timeRange
      const today = new Date();
      let startDate;
      let periodStartDate; // For the previous period
      
      if (timeRange === 'month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        setDonationGoal(monthlyGoal);
        
        // Previous month
        periodStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      } else if (timeRange === 'quarter') {
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        setDonationGoal(monthlyGoal * 3);
        
        // Previous quarter
        periodStartDate = new Date(today.getFullYear(), quarter * 3 - 3, 1);
      } else if (timeRange === 'year') {
        startDate = new Date(today.getFullYear(), 0, 1);
        setDonationGoal(annualGoal);
        
        // Previous year
        periodStartDate = new Date(today.getFullYear() - 1, 0, 1);
      }
      
      // Get donations for the selected period
      const donations = await getDonations(
        formatDate(startDate),
        formatDate(today)
      );
      setDonationData(donations);
      
      // Get total for the selected period
      const total = await getDonationTotal(
        formatDate(startDate),
        formatDate(today)
      );
      setDonationTotal(total);
      
      // Get yearly totals for overall progress
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearlyTotalValue = await getDonationTotal(
        formatDate(yearStart),
        formatDate(today)
      );
      setYearlyTotal(yearlyTotalValue);
      setYearlyGoal(annualGoal);
      
      // Get recipients for charts
      const recipientsData = await getRecipients();
      setRecipients(recipientsData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [timeRange])
  );
  
  const onRefresh = () => {
    loadData();
  };
  
  const handleExport = async () => {
    try {
      // Export the donations data to CSV
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const donations = await getDonations(
        formatDate(startOfYear),
        formatDate(today)
      );
      
      await exportToCSV(donations, `donations_${today.getFullYear()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>Time Period</Title>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: 'month', label: 'Month' },
              { value: 'quarter', label: 'Quarter' },
              { value: 'year', label: 'Year' }
            ]}
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Your Giving Goals</Title>
          <View style={styles.goalContainer}>
            <View style={styles.goalTextContainer}>
              <Paragraph>
                {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}ly Goal
              </Paragraph>
              <Text style={styles.goalAmount}>
                {settings.currency} {donationGoal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={donationTotal / donationGoal} 
                color={theme.colors.primary}
              />
              <Text style={styles.progressText}>
                {settings.currency} {donationTotal.toFixed(2)} / {settings.currency} {donationGoal.toFixed(2)}
                {' '}({Math.round((donationTotal / donationGoal) * 100)}%)
              </Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.goalContainer}>
            <View style={styles.goalTextContainer}>
              <Paragraph>Annual Goal</Paragraph>
              <Text style={styles.goalAmount}>
                {settings.currency} {yearlyGoal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={yearlyTotal / yearlyGoal} 
                color={theme.colors.secondary}
              />
              <Text style={styles.progressText}>
                {settings.currency} {yearlyTotal.toFixed(2)} / {settings.currency} {yearlyGoal.toFixed(2)}
                {' '}({Math.round((yearlyTotal / yearlyGoal) * 100)}%)
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Giving Over Time</Title>
          <View style={styles.chartContainer}>
            {donationData.length > 0 ? (
              <ChartGivingOverTime 
                data={donationData} 
                timeRange={timeRange} 
                currency={settings.currency}
              />
            ) : (
              <View style={styles.emptyChartContainer}>
                <Feather name="bar-chart-2" size={40} color={theme.colors.placeholder} />
                <Text style={styles.emptyChartText}>
                  No donation data available for this period.
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Giving by Recipient</Title>
          <View style={styles.chartContainer}>
            {donationData.length > 0 ? (
              <ChartGivingByRecipient 
                data={donationData} 
                recipients={recipients} 
                currency={settings.currency}
              />
            ) : (
              <View style={styles.emptyChartContainer}>
                <Feather name="pie-chart" size={40} color={theme.colors.placeholder} />
                <Text style={styles.emptyChartText}>
                  No donation data available for this period.
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <Button 
        mode="outlined" 
        icon="download" 
        onPress={handleExport}
        style={styles.exportButton}
        disabled={donationData.length === 0}
      >
        Export to CSV
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  goalContainer: {
    marginVertical: 8,
  },
  goalTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  divider: {
    marginVertical: 16,
  },
  chartContainer: {
    height: 300,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  emptyChartText: {
    marginTop: 16,
    color: 'rgba(0, 0, 0, 0.54)',
    textAlign: 'center',
  },
  exportButton: {
    marginTop: 8,
  },
});

export default ReportsScreen;
