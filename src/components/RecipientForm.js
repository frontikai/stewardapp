import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  HelperText,
  Menu
} from 'react-native-paper';

const RecipientForm = ({ onSubmit, onCancel, recipient = {} }) => {
  const [name, setName] = useState(recipient.name || '');
  const [type, setType] = useState(recipient.type || 'Church');
  const [notes, setNotes] = useState(recipient.notes || '');
  
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [errors, setErrors] = useState({});
  
  const recipientTypes = ['Church', 'Charity', 'Missions', 'Individual', 'Organization', 'Other'];
  
  const validate = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!type) {
      newErrors.type = 'Type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        id: recipient.id,
        name: name.trim(),
        type,
        notes
      });
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        error={!!errors.name}
        style={styles.input}
      />
      {errors.name && <HelperText type="error">{errors.name}</HelperText>}
      
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
            {recipientTypes.map((item) => (
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
          {recipient.id ? 'Update' : 'Save'}
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

export default RecipientForm;
