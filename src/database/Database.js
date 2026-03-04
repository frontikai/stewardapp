import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { SCHEMA } from './schema';
import logger from '../utils/logger';

// Get the database instance using the new expo-sqlite API
let db = null;

const getDatabase = () => {
  if (db) return db;

  if (Platform.OS === 'web') {
    // Web doesn't support SQLite, return a mock
    db = {
      execAsync: async () => {},
      runAsync: async () => ({ lastInsertRowId: 0, changes: 0 }),
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
    };
    return db;
  }

  db = SQLite.openDatabaseSync('stewardship_keeper.db');
  return db;
};

/**
 * Initialize the database tables and default settings
 */
export const initDatabase = async () => {
  const database = getDatabase();

  try {
    // Create tables based on schema
    for (const tableName of Object.keys(SCHEMA)) {
      const tableDef = SCHEMA[tableName];
      const columns = Object.keys(tableDef)
        .map(columnName => `${columnName} ${tableDef[columnName]}`)
        .join(', ');

      await database.execAsync(
        `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`
      );
      logger.log(`Table ${tableName} created or already exists`);
    }

    // Insert default settings if they don't exist
    const defaultSettings = [
      { key: 'currency', value: 'USD' },
      { key: 'tithePercentage', value: '10' },
      { key: 'incomeTrackingEnabled', value: 'true' },
      { key: 'notificationsEnabled', value: 'true' },
      { key: 'themeSetting', value: 'auto' },
    ];

    for (const setting of defaultSettings) {
      await database.runAsync(
        `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
        setting.key, setting.value
      );
      logger.log(`Default setting ${setting.key} inserted or already exists`);
    }

    // Create indexes for frequently queried columns
    await database.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(date)`
    );
    await database.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_income_date ON income(date)`
    );
    await database.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_donations_recipientId ON donations(recipientId)`
    );
    await database.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_income_processed ON income(processed)`
    );

    logger.log('Database initialized successfully');
  } catch (error) {
    logger.error('Error during database initialization:', error);
    throw error;
  }
};

/**
 * Add a new donation to the database
 * @param {Object} donation Donation object to add
 * @returns {Promise<number>} ID of the new donation
 */
export const addDonation = async (donation) => {
  const database = getDatabase();
  try {
    const result = await database.runAsync(
      `INSERT INTO donations (recipientId, amount, date, type, notes, category) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      donation.recipientId,
      donation.amount,
      donation.date,
      donation.type,
      donation.notes || '',
      donation.category || 'General'
    );
    return result.lastInsertRowId;
  } catch (error) {
    logger.error('Error adding donation:', error);
    throw error;
  }
};

/**
 * Get donations within a date range
 * @param {string} startDate Start date (YYYY-MM-DD)
 * @param {string} endDate End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of donation objects
 */
export const getDonations = async (startDate, endDate) => {
  const database = getDatabase();
  try {
    const rows = await database.getAllAsync(
      `SELECT d.*, r.name as recipientName 
       FROM donations d 
       LEFT JOIN recipients r ON d.recipientId = r.id
       WHERE d.date BETWEEN ? AND ? 
       ORDER BY d.date DESC`,
      startDate, endDate
    );
    return rows;
  } catch (error) {
    logger.error('Error getting donations:', error);
    throw error;
  }
};

/**
 * Get donations for a specific month
 * @param {number} year Year
 * @param {number} month Month (1-12)
 * @returns {Promise<Array>} Array of donation objects
 */
export const getDonationsByMonth = (year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  
  return getDonations(startDate, endDate);
};

/**
 * Get the total donation amount within a date range
 * @param {string} startDate Start date (YYYY-MM-DD)
 * @param {string} endDate End date (YYYY-MM-DD)
 * @returns {Promise<number>} Total donation amount
 */
export const getDonationTotal = async (startDate, endDate) => {
  const database = getDatabase();
  try {
    const row = await database.getFirstAsync(
      `SELECT SUM(amount) as total FROM donations WHERE date BETWEEN ? AND ?`,
      startDate, endDate
    );
    return row?.total || 0;
  } catch (error) {
    logger.error('Error getting donation total:', error);
    throw error;
  }
};

/**
 * Update an existing donation
 * @param {Object} donation Donation object with id
 * @returns {Promise<void>}
 */
export const updateDonation = async (donation) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `UPDATE donations 
       SET recipientId = ?, amount = ?, date = ?, type = ?, notes = ?, category = ?
       WHERE id = ?`,
      donation.recipientId,
      donation.amount,
      donation.date,
      donation.type,
      donation.notes || '',
      donation.category || 'General',
      donation.id
    );
  } catch (error) {
    logger.error('Error updating donation:', error);
    throw error;
  }
};

/**
 * Delete a donation
 * @param {number} id Donation ID to delete
 * @returns {Promise<void>}
 */
export const deleteDonation = async (id) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `DELETE FROM donations WHERE id = ?`,
      id
    );
  } catch (error) {
    logger.error('Error deleting donation:', error);
    throw error;
  }
};

/**
 * Add income record
 * @param {Object} income Income object to add
 * @returns {Promise<number>} ID of the new income record
 */
export const addIncome = async (income) => {
  const database = getDatabase();
  try {
    const result = await database.runAsync(
      `INSERT INTO income (amount, date, source, notes, processed) 
       VALUES (?, ?, ?, ?, ?)`,
      income.amount,
      income.date,
      income.source,
      income.notes || '',
      income.processed ? 1 : 0
    );
    return result.lastInsertRowId;
  } catch (error) {
    logger.error('Error adding income:', error);
    throw error;
  }
};

/**
 * Get income records within a date range
 * @param {string} startDate Start date (YYYY-MM-DD)
 * @param {string} endDate End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of income objects
 */
export const getIncome = async (startDate, endDate) => {
  const database = getDatabase();
  try {
    const rows = await database.getAllAsync(
      `SELECT * FROM income WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
      startDate, endDate
    );
    // Convert processed from 0/1 to false/true
    return rows.map(record => ({
      ...record,
      processed: record.processed === 1,
    }));
  } catch (error) {
    logger.error('Error getting income records:', error);
    throw error;
  }
};

/**
 * Mark an income record as processed
 * @param {number} incomeId Income record ID
 * @returns {Promise<void>}
 */
export const markIncomeAsProcessed = async (incomeId) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `UPDATE income SET processed = 1 WHERE id = ?`,
      incomeId
    );
  } catch (error) {
    logger.error('Error marking income as processed:', error);
    throw error;
  }
};

/**
 * Update an existing income record
 * @param {Object} income Income object with id
 * @returns {Promise<void>}
 */
export const updateIncome = async (income) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `UPDATE income 
       SET amount = ?, date = ?, source = ?, notes = ?, processed = ?
       WHERE id = ?`,
      income.amount,
      income.date,
      income.source,
      income.notes || '',
      income.processed ? 1 : 0,
      income.id
    );
  } catch (error) {
    logger.error('Error updating income:', error);
    throw error;
  }
};

/**
 * Delete an income record
 * @param {number} id Income ID to delete
 * @returns {Promise<void>}
 */
export const deleteIncome = async (id) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `DELETE FROM income WHERE id = ?`,
      id
    );
  } catch (error) {
    logger.error('Error deleting income:', error);
    throw error;
  }
};

/**
 * Get the total tithe amount that hasn't been processed yet
 * @returns {Promise<number>} Total pending tithe amount
 */
export const getPendingTitheTotal = async () => {
  const database = getDatabase();
  try {
    // Get the tithe percentage
    const settingRow = await database.getFirstAsync(
      `SELECT value FROM settings WHERE key = 'tithePercentage'`
    );
    const tithePercentage = parseFloat(settingRow?.value || 10) / 100;

    // Get sum of unprocessed income
    const incomeRow = await database.getFirstAsync(
      `SELECT SUM(amount) as total FROM income WHERE processed = 0`
    );
    const total = incomeRow?.total || 0;
    return total * tithePercentage;
  } catch (error) {
    logger.error('Error getting pending tithe total:', error);
    throw error;
  }
};

/**
 * Add a new recipient
 * @param {Object} recipient Recipient object to add
 * @returns {Promise<number>} ID of the new recipient
 */
export const addRecipient = async (recipient) => {
  const database = getDatabase();
  try {
    const result = await database.runAsync(
      `INSERT INTO recipients (name, type, notes, isDefault) 
       VALUES (?, ?, ?, ?)`,
      recipient.name,
      recipient.type,
      recipient.notes || '',
      recipient.isDefault ? 1 : 0
    );
    return result.lastInsertRowId;
  } catch (error) {
    logger.error('Error adding recipient:', error);
    throw error;
  }
};

/**
 * Get all recipients
 * @returns {Promise<Array>} Array of recipient objects
 */
export const getRecipients = async () => {
  const database = getDatabase();
  try {
    const rows = await database.getAllAsync(
      `SELECT * FROM recipients ORDER BY name`
    );
    // Convert isDefault from 0/1 to false/true
    return rows.map(recipient => ({
      ...recipient,
      isDefault: recipient.isDefault === 1,
    }));
  } catch (error) {
    logger.error('Error getting recipients:', error);
    throw error;
  }
};

/**
 * Update a recipient
 * @param {Object} recipient Recipient object to update
 * @returns {Promise<void>}
 */
export const updateRecipient = async (recipient) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `UPDATE recipients 
       SET name = ?, type = ?, notes = ?, isDefault = ? 
       WHERE id = ?`,
      recipient.name,
      recipient.type,
      recipient.notes || '',
      recipient.isDefault ? 1 : 0,
      recipient.id
    );
  } catch (error) {
    logger.error('Error updating recipient:', error);
    throw error;
  }
};

/**
 * Get a setting value by key
 * @param {string} key Setting key
 * @returns {Promise<string>} Setting value
 */
export const getSetting = async (key) => {
  const database = getDatabase();
  try {
    const row = await database.getFirstAsync(
      `SELECT value FROM settings WHERE key = ?`,
      key
    );
    return row?.value || null;
  } catch (error) {
    logger.error(`Error getting setting ${key}:`, error);
    throw error;
  }
};

/**
 * Get all settings
 * @returns {Promise<Array>} Array of setting objects
 */
export const getAllSettings = async () => {
  const database = getDatabase();
  try {
    const rows = await database.getAllAsync(
      `SELECT * FROM settings`
    );
    return rows;
  } catch (error) {
    logger.error('Error getting all settings:', error);
    throw error;
  }
};

/**
 * Update a setting
 * @param {string} key Setting key
 * @param {string} value Setting value
 * @returns {Promise<void>}
 */
export const updateSetting = async (key, value) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      key, value
    );
  } catch (error) {
    logger.error(`Error updating setting ${key}:`, error);
    throw error;
  }
};

/**
 * Add a reminder
 * @param {Object} reminder Reminder object to add
 * @returns {Promise<number>} ID of the new reminder
 */
export const addReminder = async (reminder) => {
  const database = getDatabase();
  try {
    const result = await database.runAsync(
      `INSERT INTO reminders (title, message, type, frequency, day, hour, minute, enabled, notificationId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      reminder.title,
      reminder.message,
      reminder.type,
      reminder.frequency,
      reminder.day,
      reminder.hour,
      reminder.minute,
      reminder.enabled ? 1 : 0,
      reminder.notificationId || ''
    );
    return result.lastInsertRowId;
  } catch (error) {
    logger.error('Error adding reminder:', error);
    throw error;
  }
};

/**
 * Get all reminders
 * @returns {Promise<Array>} Array of reminder objects
 */
export const getReminders = async () => {
  const database = getDatabase();
  try {
    const rows = await database.getAllAsync(
      `SELECT * FROM reminders ORDER BY hour, minute`
    );
    // Convert enabled from 0/1 to false/true
    return rows.map(reminder => ({
      ...reminder,
      enabled: reminder.enabled === 1,
    }));
  } catch (error) {
    logger.error('Error getting reminders:', error);
    throw error;
  }
};

/**
 * Update a reminder
 * @param {Object} reminder Reminder object to update
 * @returns {Promise<void>}
 */
export const updateReminder = async (reminder) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `UPDATE reminders 
       SET title = ?, message = ?, type = ?, frequency = ?, 
           day = ?, hour = ?, minute = ?, enabled = ?, notificationId = ? 
       WHERE id = ?`,
      reminder.title,
      reminder.message,
      reminder.type,
      reminder.frequency,
      reminder.day,
      reminder.hour,
      reminder.minute,
      reminder.enabled ? 1 : 0,
      reminder.notificationId || '',
      reminder.id
    );
  } catch (error) {
    logger.error('Error updating reminder:', error);
    throw error;
  }
};

/**
 * Delete a reminder
 * @param {number} id Reminder ID to delete
 * @returns {Promise<void>}
 */
export const deleteReminder = async (id) => {
  const database = getDatabase();
  try {
    await database.runAsync(
      `DELETE FROM reminders WHERE id = ?`,
      id
    );
  } catch (error) {
    logger.error('Error deleting reminder:', error);
    throw error;
  }
};
