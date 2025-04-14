import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { 
  Text, 
  FAB, 
  Searchbar, 
  Chip, 
  useTheme, 
  Divider, 
  List, 
  IconButton,
  Dialog,
  Portal,
  Button 
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { AppContext } from '../context/AppContext';
import DonationForm from '../components/DonationForm';
import { getDonations, addDonation } from '../database/Database';
import { formatDate } from '../utils/dateUtils';

const GivingScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { settings } = useContext(AppContext);
  const [donations, setDonations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddDonation, setShowAddDonation] = useState(false);
  
  const filters = ['all', 'tithe', 'offering', 'charity'];
  
  const loadDonations = async () => {
    try {
      setRefreshing(true);
      // Get donations for last 6 months
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      
      const result = await getDonations(
        formatDate(sixMonthsAgo),
        formatDate(today)
      );
      setDonations(result);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      loadDonations();
      // Check if navigated with the showAddDonation param
      if (route.params?.showAddDonation) {
        setShowAddDonation(true);
        navigation.setParams({ showAddDonation: undefined });
      }
    }, [route.params])
  );
  
  const handleAddDonation = async (donation) => {
    try {
      await addDonation(donation);
      setShowAddDonation(false);
      loadDonations();
    } catch (error) {
      console.error('Error adding donation:', error);
    }
  };
  
  const onRefresh = () => {
    loadDonations();
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const filteredDonations = donations.filter(donation => {
    // Apply search filter
    const matchesSearch = 
      donation.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply type filter
    const matchesFilter = filter === 'all' || donation.type.toLowerCase() === filter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });
  
  // Group donations by month for display
  const groupedDonations = filteredDonations.reduce((acc, donation) => {
    const date = new Date(donation.date);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        title: monthYear,
        data: []
      };
    }
    
    acc[monthYear].data.push(donation);
    return acc;
  }, {});
  
  const sections = Object.values(groupedDonations).sort((a, b) => {
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
      {item.data.map((donation, index) => (
        <React.Fragment key={donation.id}>
          <List.Item
            title={donation.recipientName || "Unknown Recipient"}
            description={`${donation.date} - ${donation.type}${donation.notes ? `\n${donation.notes}` : ''}`}
            left={props => <List.Icon {...props} icon="gift-outline" />}
            right={props => (
              <Text {...props} style={{alignSelf: 'center', fontWeight: 'bold'}}>
                {settings.currency} {donation.amount.toFixed(2)}
              </Text>
            )}
          />
          {index < item.data.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search donations"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
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
      
      {filteredDonations.length > 0 ? (
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
          <Feather name="inbox" size={64} color={theme.colors.placeholder} />
          <Text style={styles.emptyText}>
            {searchQuery || filter !== 'all' 
              ? 'No donations match your search or filter.' 
              : 'You haven\'t recorded any donations yet.'}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => setShowAddDonation(true)}
            style={{marginTop: 16}}
          >
            Add Your First Donation
          </Button>
        </View>
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => setShowAddDonation(true)}
      />
      
      <Portal>
        <Dialog
          visible={showAddDonation}
          onDismiss={() => setShowAddDonation(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Add Donation</Dialog.Title>
          <Dialog.Content>
            <DonationForm 
              onSubmit={handleAddDonation}
              onCancel={() => setShowAddDonation(false)}
            />
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    maxHeight: '80%',
  },
});

export default GivingScreen;
