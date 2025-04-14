/**
 * Database schema definition for the Stewardship Keeper app
 * 
 * This defines the structure of the SQLite database tables
 */
export const SCHEMA = {
  // Donations table
  donations: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    recipientId: 'INTEGER',
    amount: 'REAL NOT NULL',
    date: 'TEXT NOT NULL',
    type: 'TEXT NOT NULL',
    notes: 'TEXT',
    category: 'TEXT',
    createdAt: 'TEXT DEFAULT CURRENT_TIMESTAMP',
  },
  
  // Recipients table
  recipients: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    category: 'TEXT NOT NULL',
    notes: 'TEXT',
    isDefault: 'INTEGER DEFAULT 0',
    createdAt: 'TEXT DEFAULT CURRENT_TIMESTAMP',
  },
  
  // Income tracking table
  income: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    amount: 'REAL NOT NULL',
    date: 'TEXT NOT NULL',
    source: 'TEXT NOT NULL',
    notes: 'TEXT',
    processed: 'INTEGER DEFAULT 0',
    createdAt: 'TEXT DEFAULT CURRENT_TIMESTAMP',
  },
  
  // Settings table
  settings: {
    key: 'TEXT PRIMARY KEY',
    value: 'TEXT',
    updatedAt: 'TEXT DEFAULT CURRENT_TIMESTAMP',
  },
  
  // Reminders table
  reminders: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    title: 'TEXT NOT NULL',
    message: 'TEXT',
    type: 'TEXT NOT NULL',  // 'tithe', 'giving', 'custom'
    frequency: 'TEXT NOT NULL', // 'weekly', 'monthly', 'once'
    day: 'INTEGER',  // day of week (0-6) or day of month (1-31)
    hour: 'INTEGER NOT NULL',
    minute: 'INTEGER NOT NULL',
    enabled: 'INTEGER DEFAULT 1',
    notificationId: 'TEXT',
    createdAt: 'TEXT DEFAULT CURRENT_TIMESTAMP',
  },
  
  // Categories for donations and recipients
  categories: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL UNIQUE',
    color: 'TEXT',
    isSystem: 'INTEGER DEFAULT 0',
    createdAt: 'TEXT DEFAULT CURRENT_TIMESTAMP',
  },
};