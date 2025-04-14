import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  HelperText, 
  useTheme,
  Menu,
  List
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

import { AppContext } from '../context/AppContext';
import { getRecipients } from '../database/Database';
import { formatDate } from '../utils/dateUtils';

const DonationForm = ({ onSubmit, onCancel, initialValues = {} }) => {
  const theme = useTheme();
  const { settings } = useContext(AppContext);
  
  const [amount, setAmount] = useState(initialValues.amount?.toString() || '');
  const [date, setDate] = useState(initialValues.date ? new Date(initialValues.date) : new Date());
  const [type, setType] = useState(initialValues.type || 'Tithe');
  const [recipientId, setRecipientId] = useState(initialValues.recipientId || null);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState(initialValues.notes || '');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showRecipientMenu, setShowRecipientMenu] = useState(false);
  const [recipients, setRecipients] = useState([]);
  
  const [errors, setErrors] = useState({});
  
  const donationTypes = ['Tithe', 'Offering', 'Charity', 'Missions', 'Special'];
  
  useEffect(() => {
    loadRecipients();
  }, []);
  
  useEffect(() => {
    if (recipientId) {
      const selectedRecipient = recipients.find(r => r.id === recipientId);
      if (selectedRecipient) {
        setRecipientName(selectedRecipient.name);
      }
    }
  }, [recipientId, recipients]);
  
  const loadRecipients = async () => {
    try {
      const result = await getRecipients();
      setRecipients(result);
      
      // Set default recipient if not set and we have recipients
      if (!recipientId && result.length > 0) {
        setRecipientId(result[0].id);
        setRecipientName(result[0].name);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!date) {
      newErrors.date = 'Date is required';
    }
    
    if (!type) {
      newErrors.type = 'Type is required';
    }
    
    if (!recipientId) {
      newErrors.recipient = 'Recipient is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        amount: parseFloat(amount),
        date: formatDate(date),
        type,
        recipientId,
        notes
      });
    }
  };
  
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        left={<TextInput.Affix text={settings.currency} />}
        error={!!errors.amount}
        style={styles.input}
      />
      {errors.amount && <HelperText type="error">{errors.amount}</HelperText>}
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date</Text>
        <Button 
          mode="outlined" 
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          icon="calendar"
        >
          {formatDate(date)}
        </Button>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        {errors.date && <HelperText type="error">{errors.date}</HelperText>}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.menuContainer}>
          <Button 
            mode="outlined" 
            onPress={() => setShowTypeMenu(true)}
            style={styles.menuButton}
            icon="chevron-down"
            contentStyle={styles.menuButtonContent}
          >
            {type}
          </Button>
          
          <Menu
            visible={showTypeMenu}
            onDismiss={() => setShowTypeMenu(false)}
            anchor={{ x: 0, y: 0 }}
            style={styles.menu}
          >
            {donationTypes.map((item) => (
              <Menu.Item
                key={item}
                onPress={() => {
                  setType(item);
                  setShowTypeMenu(false);
                }}
                title={item}
              />
            ))}
          </Menu>
        </View>
        {errors.type && <HelperText type="error">{errors.type}</HelperText>}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient</Text>
        <View style={styles.menuContainer}>
          <Button 
            mode="outlined" 
            onPress={() => setShowRecipientMenu(true)}
            style={styles.menuButton}
            icon="chevron-down"
            contentStyle={styles.menuButtonContent}
          >
            {recipientName || 'Select Recipient'}
          </Button>
          
          <Menu
            visible={showRecipientMenu}
            onDismiss={() => setShowRecipientMenu(false)}
            anchor={{ x: 0, y: 0 }}
            style={styles.menu}
          >
            {recipients.map((item) => (
              <Menu.Item
                key={item.id}
                onPress={() => {
                  setRecipientId(item.id);
                  setRecipientName(item.name);
                  setShowRecipientMenu(false);
                }}
                title={item.name}
              />
            ))}
          </Menu>
        </View>
        {errors.recipient && <HelperText type="error">{errors.recipient}</HelperText>}
      </View>
      
      <TextInput
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          onPress={onCancel}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={styles.button}
        >
          Save
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  input: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: 'rgba(0, 0, 0, 0.54)',
  },
  dateButton: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    position: 'relative',
    zIndex: 1,
  },
  menuButton: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  menuButtonContent: {
    justifyContent: 'space-between',
    flexDirection: 'row-reverse',
  },
  menu: {
    width: '80%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default DonationForm;
