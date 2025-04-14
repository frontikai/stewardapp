import React, { useState, useContext } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { 
  Text, 
  FAB, 
  Chip, 
  useTheme, 
  List, 
  Divider, 
  Portal, 
  Dialog,
  Button,
  IconButton
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { AppContext } from '../context/AppContext';
import IncomeForm from '../components/IncomeForm';
import PendingTitheCard from '../components/PendingTitheCard';
import { 
  getIncome, 
  addIncome, 
  markIncomeAsProcessed,
  getPendingTitheTotal
} from '../database/Database';
import { formatDate } from '../utils/dateUtils';

const IncomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { settings } = useContext(AppContext);
  const [income, setIncome] = useState([]);
  const [pendingTithe, setPendingTithe] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'processed'
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  
  const filters = ['all', 'pending', 'processed'];
  
  const loadIncome = async () => {
    try {
      setRefreshing(true);
      // Get income for last 12 months
      const today = new Date();
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(today.getMonth() - 12);
      
      const result = await getIncome(
        formatDate(twelveMonthsAgo),
        formatDate(today)
      );
      setIncome(result);
      
      // Get pending tithe total
      const titheAmount = await getPendingTitheTotal();
      setPendingTithe(titheAmount);
    } catch (error) {
      console.error('Error loading income:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      if (settings.incomeTrackingEnabled === 'true') {
        loadIncome();
      }
      
      // Check if navigated with the showAddIncome param
      if (route.params?.showAddIncome) {
        setShowAddIncome(true);
        navigation.setParams({ showAddIncome: undefined });
      }
    }, [route.params, settings.incomeTrackingEnabled])
  );
  
  const handleAddIncome = async (income) => {
    try {
      await addIncome(income);
      setShowAddIncome(false);
      loadIncome();
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };
  
  const handleProcessIncome = async () => {
    if (!selectedIncome) return;
    
    try {
      await markIncomeAsProcessed(selectedIncome.id);
      setShowProcessDialog(false);
      setSelectedIncome(null);
      loadIncome();
    } catch (error) {
      console.error('Error processing income:', error);
    }
  };
  
  const onRefresh = () => {
    loadIncome();
  };
  
  const filteredIncome = income.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.processed === 0;
    if (filter === 'processed') return item.processed === 1;
    return true;
  });
  
  // Group income by month for display
  const groupedIncome = filteredIncome.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        title: monthYear,
        data: []
      };
    }
    
    acc[monthYear].data.push(item);
    return acc;
  }, {});
  
  const sections = Object.values(groupedIncome).sort((a, b) => {
    // Extract month and year from the title
    const [aMonth, aYear] = a.title.split(' ');
    const [bMonth, bYear] = b.title.split(' ');
    
    // Compare year first, then month
    if (aYear !== bYear) {
      return bYear - aYear; // Sort years in descending order
    }
    
    // Convert month names to numbers for comparison
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    return months.indexOf(bMonth) - months.indexOf(aMonth); // Sort months in descending order
  });
  
  const renderItem = ({ item }) => (
    <View>
      <List.Subheader>{item.title}</List.Subheader>
      {item.data.map((incomeItem, index) => (
        <React.Fragment key={incomeItem.id}>
          <List.Item
            title={incomeItem.source || "Income"}
            description={`${incomeItem.date}${incomeItem.notes ? `\n${incomeItem.notes}` : ''}`}
            left={props => (
              <List.Icon {...props} icon={incomeItem.processed === 1 ? "check-circle" : "circle"} />
            )}
            right={props => (
              <View style={styles.rightContent}>
                <Text style={styles.amountText}>
                  {settings.currency} {incomeItem.amount.toFixed(2)}
                </Text>
                {incomeItem.processed === 0 && (
                  <IconButton
                    icon="cash"
                    size={20}
                    onPress={() => {
                      setSelectedIncome(incomeItem);
                      setShowProcessDialog(true);
                    }}
                    color={theme.colors.primary}
                  />
                )}
              </View>
            )}
          />
          {index < item.data.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </View>
  );
  
  if (settings.incomeTrackingEnabled !== 'true') {
    return (
      <View style={styles.centeredContainer}>
        <Feather name="dollar-sign" size={64} color={theme.colors.placeholder} />
        <Text style={styles.emptyText}>
          Income tracking is currently disabled.
        </Text>
        <Text style={styles.subText}>
          You can enable it in the settings.
        </Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Settings')}
          style={{marginTop: 16}}
        >
          Go to Settings
        </Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.pendingTitheContainer}>
        <PendingTitheCard
          amount={pendingTithe}
          percentage={settings.tithePercentage}
          currency={settings.currency}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {filters.map((item) => (
            <Chip
              key={item}
              selected={filter === item}
              onPress={() => setFilter(item)}
              style={styles.chip}
              selectedColor={theme.colors.primary}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>
      
      {filteredIncome.length > 0 ? (
        <FlatList
          data={sections}
          renderItem={renderItem}
          keyExtractor={(item) => item.title}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="dollar-sign" size={64} color={theme.colors.placeholder} />
          <Text style={styles.emptyText}>
            {filter !== 'all' 
              ? `No ${filter} income entries found.` 
              : 'You haven\'t recorded any income yet.'}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => setShowAddIncome(true)}
            style={{marginTop: 16}}
          >
            Add Your First Income
          </Button>
        </View>
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => setShowAddIncome(true)}
      />
      
      <Portal>
        <Dialog
          visible={showAddIncome}
          onDismiss={() => setShowAddIncome(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Add Income</Dialog.Title>
          <Dialog.Content>
            <IncomeForm 
              onSubmit={handleAddIncome}
              onCancel={() => setShowAddIncome(false)}
              tithePercentage={Number(settings.tithePercentage)}
            />
          </Dialog.Content>
        </Dialog>
        
        <Dialog
          visible={showProcessDialog}
          onDismiss={() => setShowProcessDialog(false)}
        >
          <Dialog.Title>Process Income</Dialog.Title>
          <Dialog.Content>
            <Text>
              Mark this income as tithed? This will remove it from your pending tithes.
            </Text>
            {selectedIncome && (
              <View style={styles.dialogIncomeDetails}>
                <Text style={styles.dialogIncomeSource}>{selectedIncome.source || "Income"}</Text>
                <Text>Amount: {settings.currency} {selectedIncome.amount.toFixed(2)}</Text>
                <Text>Suggested Tithe: {settings.currency} {(selectedIncome.amount * (Number(settings.tithePercentage) / 100)).toFixed(2)}</Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowProcessDialog(false)}>Cancel</Button>
            <Button onPress={handleProcessIncome} mode="contained">Mark as Tithed</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pendingTitheContainer: {
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  chipContainer: {
    paddingVertical: 8,
  },
  chip: {
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.54)',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.54)',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogIncomeDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  dialogIncomeSource: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default IncomeScreen;
