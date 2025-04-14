import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Convert data to CSV format
const convertToCSV = (objArray) => {
  if (objArray.length === 0) {
    return '';
  }
  
  // Get the headers from the first object
  const headers = Object.keys(objArray[0]);
  
  // Create header row
  let csv = headers.join(',') + '\n';
  
  // Add rows
  objArray.forEach(obj => {
    const row = headers.map(header => {
      // Handle values that need escaping (e.g., values with commas)
      let value = obj[header];
      
      // Convert to string
      value = value === null || value === undefined ? '' : String(value);
      
      // Escape values with quotes, commas, or newlines
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        // Double up any quotes
        value = value.replace(/"/g, '""');
        // Wrap in quotes
        value = `"${value}"`;
      }
      
      return value;
    }).join(',');
    
    csv += row + '\n';
  });
  
  return csv;
};

// Export data to a CSV file
export const exportToCSV = async (data, filename) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }
    
    // Make sure sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      throw new Error('Sharing is not available on this device');
    }
    
    // Convert data to CSV format
    const csvContent = convertToCSV(data);
    
    // Create a temporary file
    const fileUri = `${FileSystem.cacheDirectory}${filename}.csv`;
    
    // Write the CSV content to the file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Data',
      UTI: 'public.comma-separated-values-text' // iOS only
    });
    
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Export data to a JSON file
export const exportToJSON = async (data, filename) => {
  try {
    if (!data) {
      throw new Error('No data to export');
    }
    
    // Make sure sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      throw new Error('Sharing is not available on this device');
    }
    
    // Convert data to JSON string
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Create a temporary file
    const fileUri = `${FileSystem.cacheDirectory}${filename}.json`;
    
    // Write the JSON content to the file
    await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Data',
      UTI: 'public.json' // iOS only
    });
    
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Format data for a PDF report (returns structured object for PDF generation)
export const formatDataForPDF = (data, title, subtitle) => {
  // Note: This is a placeholder. In a real app, we would use a library like
  // react-native-html-to-pdf to generate PDFs from this data structure.
  
  return {
    title,
    subtitle,
    date: new Date().toLocaleDateString(),
    data
  };
};
