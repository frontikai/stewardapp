import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { 
  Text, 
  FAB, 
  useTheme, 
  List, 
  IconButton,
  Divider,
  Portal,
  Dialog,
  Surface,
  Searchbar
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import RecipientForm from '../components/RecipientForm';
import { getRecipients, addRecipient, updateRecipient } from '../database/Database';

const RecipientsScreen = () => {
  const theme = useTheme();
  const [recipients, setRecipients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [showEditRecipient, setShowEditRecipient] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  
  const loadRecipients = async () => {
    try {
      setRefreshing(true);
      const result = await getRecipients();
      setRecipients(result);
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      loadRecipients();
    }, [])
  );
  
  const handleAddRecipient = async (recipient) => {
    try {
      await addRecipient(recipient);
      setShowAddRecipient(false);
      loadRecipients();
    } catch (error) {
      console.error('Error adding recipient:', error);
    }
  };
  
  const handleEditRecipient = async (recipient) => {
    try {
      await updateRecipient(recipient);
      setShowEditRecipient(false);
      setSelectedRecipient(null);
      loadRecipients();
    } catch (error) {
      console.error('Error updating recipient:', error);
    }
  };
  
  const onRefresh = () => {
    loadRecipients();
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const filteredRecipients = recipients.filter(recipient => {
    return recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           recipient.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           recipient.type.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const renderItem = ({ item }) => (
    <Surface style={styles.recipientItem}>
      <List.Item
        title={item.name}
        description={`${item.type}${item.notes ? `\n${item.notes}` : ''}`}
        left={props => <List.Icon {...props} icon="home" />}
        right={props => (
          <IconButton
            {...props}
            icon="pencil"
            onPress={() => {
              setSelectedRecipient(item);
              setShowEditRecipient(true);
            }}
          />
        )}
      />
    </Surface>
  );
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search recipients"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {filteredRecipients.length > 0 ? (
        <FlatList
          data={filteredRecipients}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={64} color={theme.colors.placeholder} />
          <Text style={styles.emptyText}>
            {searchQuery 
              ? 'No recipients match your search.' 
              : 'You haven\'t added any recipients yet.'}
          </Text>
        </View>
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => setShowAddRecipient(true)}
      />
      
      <Portal>
        <Dialog
          visible={showAddRecipient}
          onDismiss={() => setShowAddRecipient(false)}
        >
          <Dialog.Title>Add Recipient</Dialog.Title>
          <Dialog.Content>
            <RecipientForm 
              onSubmit={handleAddRecipient}
              onCancel={() => setShowAddRecipient(false)}
            />
          </Dialog.Content>
        </Dialog>
        
        <Dialog
          visible={showEditRecipient}
          onDismiss={() => {
            setShowEditRecipient(false);
            setSelectedRecipient(null);
          }}
        >
          <Dialog.Title>Edit Recipient</Dialog.Title>
          <Dialog.Content>
            {selectedRecipient && (
              <RecipientForm 
                recipient={selectedRecipient}
                onSubmit={handleEditRecipient}
                onCancel={() => {
                  setShowEditRecipient(false);
                  setSelectedRecipient(null);
                }}
              />
            )}
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
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  recipientItem: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  separator: {
    height: 8,
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
});

export default RecipientsScreen;
