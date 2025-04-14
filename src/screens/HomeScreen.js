import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';

import { getGreeting } from '../utils/dateUtils';
import ScriptureCard from '../components/ScriptureCard';

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.greeting, { color: theme.colors.primary }]}>
          {greeting}
        </Text>
        
        <Card style={styles.welcomeCard}>
          <Card.Title title="Welcome to Stewardship Keeper" />
          <Card.Content>
            <Text style={styles.welcomeText}>
              Track your tithes and offerings, monitor your giving progress, and organize your 
              charitable donations all in one place.
            </Text>
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                style={styles.button}
                onPress={() => navigation.navigate('Giving')}
              >
                Start Tracking
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <ScriptureCard />
        
        <Card style={styles.featuresCard}>
          <Card.Title title="Features" />
          <Card.Content>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>• Donation Tracking</Text>
              <Text>Record and categorize all your charitable giving</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>• Income & Tithe Planning</Text>
              <Text>Calculate tithes based on your income</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>• Recipient Management</Text>
              <Text>Organize your giving by recipient and category</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>• Reporting & Analytics</Text>
              <Text>Visualize your giving patterns and impact</Text>
            </View>
          </Card.Content>
        </Card>
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
  welcomeCard: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    width: '80%',
    marginVertical: 10,
  },
  featuresCard: {
    marginTop: 16,
  },
  featureItem: {
    marginBottom: 16,
  },
  featureTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
});

export default HomeScreen;
