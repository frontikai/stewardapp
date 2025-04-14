import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  HelperText, 
  useTheme,
  Switch,
  Divider
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AppContext } from '../context/AppContext';
import { formatDate } from '../utils/dateUtils';

const IncomeForm = ({ onSubmit, onCancel, initialValues = {}, tithePercentage = 10 }) => {
  const theme = useTheme();
  const { settings } = useContext(AppContext);
  
  const [amount, setAmount] = useState(initialValues.amount?.toString() || '');
  const [date, setDate] = useState(initialValues.date ? new Date(initialValues.date) : new Date());
  const [source, setSource] = useState(initialValues.source || '');
  const [notes, setNotes] = useState(initialValues.notes || '');
  const [processed, setProcessed] = useState(initialValues.processed === 1);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        amount: parseFloat(amount),
        date: formatDate(date),
        source,
        notes,
        processed: processed ? 1 : 0
      });
    }
  };
  
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // Calculate the tithe
  const calculateTithe = () => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    return parseFloat(amount) * (tithePercentage / 100);
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
      
      {amount && !isNaN(parseFloat(amount)) && (
        <View style={styles.tithePreview}>
          <Text>Suggested Tithe ({tithePercentage}%):</Text>
          <Text style={styles.titheAmount}>
            {settings.currency} {calculateTithe().toFixed(2)}
          </Text>
        </View>
      )}
      
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
      
      <TextInput
        label="Source (Optional)"
        value={source}
        onChangeText={setSource}
        style={styles.input}
      />
      
      <TextInput
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <Divider style={styles.divider} />
      
      <View style={styles.switchContainer}>
        <Text>Mark as Already Tithed</Text>
        <Switch
          value={processed}
          onValueChange={setProcessed}
          color={theme.colors.primary}
        />
      </View>
      
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
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tithePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  titheAmount: {
    fontWeight: 'bold',
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

export default IncomeForm;
