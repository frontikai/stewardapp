import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { getRandomScripture } from '../utils/scriptures';

const ScriptureCard = () => {
  const theme = useTheme();
  const [scripture, setScripture] = useState({ verse: '', reference: '' });

  // Load a random scripture when component mounts
  useEffect(() => {
    refreshScripture();
  }, []);

  // Get a new random scripture
  const refreshScripture = () => {
    const randomScripture = getRandomScripture();
    setScripture(randomScripture);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Scripture of the Day</Text>
          <IconButton
            icon="refresh"
            size={20}
            onPress={refreshScripture}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.verse}>{scripture.verse}</Text>
        <Text style={styles.reference}>{scripture.reference}</Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verse: {
    fontSize: 16,
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  reference: {
    fontSize: 14,
    textAlign: 'right',
    opacity: 0.7,
  },
});

export default ScriptureCard;