import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';

const { width } = Dimensions.get('window');

const ChartGivingOverTime = ({ data, timeRange, currency = 'USD' }) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState([]);
  const maxBarHeight = 150; // Maximum bar height in pixels
  
  useEffect(() => {
    prepareChartData();
  }, [data, timeRange]);
  
  const prepareChartData = () => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Group data based on timeRange
    const today = new Date();
    let groupedData = {};
    
    if (timeRange === 'month') {
      // Group by day of month
      data.forEach(donation => {
        const date = new Date(donation.date);
        const day = date.getDate();
        if (!groupedData[day]) {
          groupedData[day] = 0;
        }
        groupedData[day] += donation.amount;
      });
      
      // Fill in empty days
      for (let i = 1; i <= today.getDate(); i++) {
        if (!groupedData[i]) {
          groupedData[i] = 0;
        }
      }
    } else if (timeRange === 'quarter') {
      // Group by week
      data.forEach(donation => {
        const date = new Date(donation.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        
        if (!groupedData[weekKey]) {
          groupedData[weekKey] = 0;
        }
        groupedData[weekKey] += donation.amount;
      });
    } else if (timeRange === 'year') {
      // Group by month
      data.forEach(donation => {
        const date = new Date(donation.date);
        const month = date.getMonth();
        if (!groupedData[month]) {
          groupedData[month] = 0;
        }
        groupedData[month] += donation.amount;
      });
      
      // Fill in empty months
      for (let i = 0; i <= today.getMonth(); i++) {
        if (!groupedData[i]) {
          groupedData[i] = 0;
        }
      }
    }
    
    // Convert to array format for our chart
    const formattedData = Object.keys(groupedData).map(key => {
      let label = key;
      
      if (timeRange === 'year') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        label = monthNames[parseInt(key)];
      }
      
      return {
        x: label,
        y: groupedData[key],
        label: `${currency} ${groupedData[key].toFixed(2)}`
      };
    });
    
    // Sort the data
    let sortedData;
    if (timeRange === 'year') {
      // Sort months chronologically
      sortedData = formattedData.sort((a, b) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames.indexOf(a.x) - monthNames.indexOf(b.x);
      });
    } else if (timeRange === 'month') {
      // Sort days numerically
      sortedData = formattedData.sort((a, b) => parseInt(a.x) - parseInt(b.x));
    } else {
      // Keep the order for weeks
      sortedData = formattedData;
    }
    
    setChartData(sortedData);
  };
  
  // Calculate the maximum value for scaling
  const maxValue = chartData.length > 0 
    ? Math.max(...chartData.map(item => item.y)) 
    : 0;
  
  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No data available for the selected time period.</Text>
      </View>
    );
  }
  
  return (
    <Card style={styles.container}>
      <Card.Title title="Giving Over Time" />
      <Card.Content>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartContainer}>
            {chartData.map((item, index) => {
              // Calculate height as a percentage of maxValue
              const barHeight = item.y > 0 
                ? (item.y / maxValue) * maxBarHeight 
                : 2; // Minimum visible height
              
              return (
                <View key={index} style={styles.barContainer}>
                  <Text style={styles.barValue}>{item.label}</Text>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight,
                        backgroundColor: theme.colors.primary 
                      }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{item.x}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 20,
    height: 220,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 40,
  },
  bar: {
    width: 30,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  barValue: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 5,
    height: 30,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChartGivingOverTime;
