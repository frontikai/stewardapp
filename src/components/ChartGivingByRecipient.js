import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';

const { width } = Dimensions.get('window');

const ChartGivingByRecipient = ({ data, recipients, currency = 'USD' }) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState([]);
  
  // Colors for the pie chart - Material Design palette
  const colorScale = [
    theme.colors.primary,
    theme.colors.secondary,
    '#4CAF50', // green
    '#FF9800', // orange
    '#9C27B0', // purple
    '#03A9F4', // light blue
    '#F44336', // red
    '#FFEB3B', // yellow
    '#607D8B', // blue grey
    '#795548', // brown
  ];
  
  useEffect(() => {
    prepareChartData();
  }, [data, recipients]);
  
  const prepareChartData = () => {
    if (!data || data.length === 0 || !recipients || recipients.length === 0) {
      setChartData([]);
      return;
    }
    
    // Create a map of recipient IDs to names
    const recipientMap = {};
    recipients.forEach(recipient => {
      recipientMap[recipient.id] = recipient.name;
    });
    
    // Group donations by recipient
    const groupedData = {};
    data.forEach(donation => {
      const recipientId = donation.recipientId;
      const recipientName = recipientMap[recipientId] || 'Unknown';
      
      if (!groupedData[recipientName]) {
        groupedData[recipientName] = 0;
      }
      groupedData[recipientName] += donation.amount;
    });
    
    // Convert to array format for our chart
    const formattedData = Object.keys(groupedData).map((name, index) => {
      return {
        name: name,
        value: groupedData[name],
        label: `${name}: ${currency} ${groupedData[name].toFixed(2)}`,
        color: colorScale[index % colorScale.length],
        percentage: 0 // Will be calculated after we have the total
      };
    });
    
    // Sort by amount (descending)
    const sortedData = formattedData.sort((a, b) => b.value - a.value);
    
    // Calculate the total amount for percentage calculations
    const totalAmount = sortedData.reduce((total, item) => total + item.value, 0);
    
    // Add percentage information to each item
    sortedData.forEach(item => {
      item.percentage = (item.value / totalAmount) * 100;
    });
    
    setChartData(sortedData);
  };
  
  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No data available for recipients.</Text>
      </View>
    );
  }
  
  return (
    <Card style={styles.container}>
      <Card.Title title="Giving By Recipient" />
      <Card.Content>
        <View style={styles.chartContainer}>
          {/* Simple bar representation instead of pie chart */}
          {chartData.map((item, index) => (
            <View key={index} style={styles.recipientRow}>
              <View style={styles.legendItem}>
                <View 
                  style={[
                    styles.colorIndicator, 
                    { backgroundColor: item.color }
                  ]} 
                />
                <Text style={styles.recipientName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color 
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.amountText}>
                {currency} {item.value.toFixed(2)}
              </Text>
              
              <Text style={styles.percentText}>
                {item.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    elevation: 2,
  },
  chartContainer: {
    width: '100%',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
    marginRight: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  recipientName: {
    fontSize: 12,
    flex: 1,
  },
  barContainer: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 4,
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  amountText: {
    fontSize: 12,
    width: 70,
    textAlign: 'right',
    marginLeft: 4,
  },
  percentText: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChartGivingByRecipient;
