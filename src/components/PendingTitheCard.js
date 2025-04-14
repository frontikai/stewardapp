import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Button } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

const PendingTitheCard = ({ amount, percentage = 10, currency = 'USD', onPress }) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <Feather name="alert-circle" size={24} color={theme.colors.secondary} />
          </View>
          <Text style={styles.headerText}>Pending Tithe</Text>
        </View>
        
        <Text style={[styles.amount, { color: theme.colors.secondary }]}>
          {currency} {parseFloat(amount).toFixed(2)}
        </Text>
        
        <Text style={styles.subText}>
          Based on your {percentage}% tithe rate
        </Text>
        
        {onPress && (
          <Button 
            mode="text" 
            onPress={onPress}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            View Income
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  subText: {
    fontSize: 12,
    opacity: 0.6,
  },
  button: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row-reverse',
  },
});

export default PendingTitheCard;
