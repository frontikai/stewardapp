import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, Alert } from 'react-native';
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
import { getDonations, addDonation, updateDonation, deleteDonation } from '../database/Database';
import { formatDate } from '../utils/dateUtils';

const GivingScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { settings } = useContext(AppContext);
  const [donations, setDonations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingDonation, setDeletingDonation] = useState(null);
  
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
        setEditingDonation(null);
        setShowDonationForm(true);
        navigation.setParams({ showAddDonation: undefined });
      }
    }, [route.params])
  );
  
  const handleAddDonation = async (donation) => {
    try {
      await addDonation(donation);
      setShowDonationForm(false);
      setEditingDonation(null);
      loadDonations();
    } catch (error) {
      console.error('Error adding donation:', error);
    }
  };

  const handleUpdateDonation = async (donation) => {
    try {
      await updateDonation({ ...donation, id: editingDonation.id });
      setShowDonationForm(false);
      setEditingDonation(null);
      loadDonations();
    } catch (error) {
      console.error('Error updating donation:', error);
    }
  };

  const handleDeleteDonation = async () => {
    if (!deletingDonation) return;
    try {
      await deleteDonation(deletingDonation.id);
      setShowDeleteDialog(false);
      setDeletingDonation(null);
      loadDonations();
    } catch (error) {
      console.error('Error deleting donation:', error);
    }
  };

  const openEditForm = (donation) => {
    setEditingDonation(donation);
    setShowDonationForm(true);
  };

  const openDeleteConfirmation = (donation) => {
    setDeletingDonation(donation);
    setShowDeleteDialog(true);
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
    const [aMonth, aYear] = a.title.split(' ');
    const [bMonth, bYear] = b.title.split(' ');
    
    if (aYear !== bYear) {
      return bYear - aYear;
    }
    
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    return months.indexOf(bMonth) - months.indexOf(aMonth);
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
              <View style={styles.itemRight}>
                <Text style={styles.amountText}>
                  {settings.currency} {donation.amount.toFixed(2)}
                </Text>
                <View style={styles.itemActions}>
                  <IconButton
                    icon="pencil"
                    size={18}
                    onPress={() => openEditForm(donation)}
                  />
                  <IconButton
                    icon="delete"
                    size={18}
                    onPress={() => openDeleteConfirmation(donation)}
                  />
                </View>
              </View>
            )}
            onPress={() => openEditForm(donation)}
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
            onPress={() => {
              setEditingDonation(null);
              setShowDonationForm(true);
            }}
            style={{marginTop: 16}}
          >
            Add Your First Donation
          </Button>
        </View>
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => {
          setEditingDonation(null);
          setShowDonationForm(true);
        }}
      />
      
      <Portal>
        <Dialog
          visible={showDonationForm}
          onDismiss={() => {
            setShowDonationForm(false);
            setEditingDonation(null);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>{editingDonation ? 'Edit Donation' : 'Add Donation'}</Dialog.Title>
          <Dialog.Content>
            <DonationForm 
              onSubmit={editingDonation ? handleUpdateDonation : handleAddDonation}
              onCancel={() => {
                setShowDonationForm(false);
                setEditingDonation(null);
              }}
              initialValues={editingDonation || {}}
            />
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => {
            setShowDeleteDialog(false);
            setDeletingDonation(null);
          }}
        >
          <Dialog.Title>Delete Donation</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this donation
              {deletingDonation ? ` of ${settings.currency} ${deletingDonation.amount.toFixed(2)}` : ''}?
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowDeleteDialog(false);
              setDeletingDonation(null);
            }}>
              Cancel
            </Button>
            <Button 
              onPress={handleDeleteDonation} 
              textColor={theme.colors.error}
            >
              Delete
            </Button>
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
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
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
