import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

const ProgressBar = ({ progress, height = 8, color, backgroundColor }) => {
  const theme = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          height, 
          backgroundColor: backgroundColor || theme.colors.background
        }
      ]}
    >
      <View 
        style={[
          styles.progress, 
          { 
            width: `${clampedProgress * 100}%`,
            backgroundColor: color || theme.colors.primary 
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progress: {
    height: '100%',
  },
});

export default ProgressBar;
