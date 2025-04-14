import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

const SummaryCard = ({ title, amount, icon, currency = 'USD', onPress }) => {
  const theme = useTheme();
  
  return (
    <Card 
      style={styles.card} 
      onPress={onPress}
    >
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name={icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.amount, { color: theme.colors.primary }]}>
            {currency} {parseFloat(amount).toFixed(2)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    opacity: 0.8,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SummaryCard;
