import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { SCHEMA } from './schema';

// Get the database instance
const getDatabase = () => {
  if (Platform.OS === 'web') {
    // Web doesn't support SQLite, so we'll use a mock implementation
    return {
      transaction: callback => {
        const tx = {
          executeSql: (query, params, successCallback) => {
            // For web, we'll return empty results
            successCallback(tx, { rows: { _array: [] } });
            return [];
          },
        };
        callback(tx);
      },
    };
  }
  
  return SQLite.openDatabase('stewardship_keeper.db');
};

// Database instance
const db = getDatabase();

/**
 * Initialize the database tables and default settings
 */
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Create tables based on schema
      Object.keys(SCHEMA).forEach(tableName => {
        const tableDef = SCHEMA[tableName];
        const columns = Object.keys(tableDef)
          .map(columnName => `${columnName} ${tableDef[columnName]}`)
          .join(', ');
        
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`,
          [],
          (_, result) => {
            console.log(`Table ${tableName} created or already exists`);
          },
          (_, error) => {
            console.error(`Error creating table ${tableName}:`, error);
            reject(error);
            return false;
          }
        );
      });
      
      // Insert default settings if they don't exist
      const defaultSettings = [
        { key: 'currency', value: 'USD' },
        { key: 'tithePercentage', value: '10' },
        { key: 'incomeTrackingEnabled', value: 'true' },
        { key: 'notificationsEnabled', value: 'true' },
        { key: 'themeSetting', value: 'auto' },
      ];
      
      defaultSettings.forEach(setting => {
        tx.executeSql(
          `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
          [setting.key, setting.value],
          (_, result) => {
            console.log(`Default setting ${setting.key} inserted or already exists`);
          },
          (_, error) => {
            console.error(`Error inserting default setting ${setting.key}:`, error);
            reject(error);
            return false;
          }
        );
      });
    }, error => {
      console.error('Transaction error during database initialization:', error);
      reject(error);
    }, () => {
      console.log('Database initialized successfully');
      resolve();
    });
  });
};

/**
 * Add a new donation to the database
 * @param {Object} donation Donation object to add
 * @returns {Promise<number>} ID of the new donation
 */
export const addDonation = (donation) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO donations (recipientId, amount, date, type, notes, category) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          donation.recipientId,
          donation.amount,
          donation.date,
          donation.type,
          donation.notes || '',
          donation.category || 'General',
        ],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding donation:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get donations within a date range
 * @param {string} startDate Start date (YYYY-MM-DD)
 * @param {string} endDate End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of donation objects
 */
export const getDonations = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT d.*, r.name as recipientName 
         FROM donations d 
         LEFT JOIN recipients r ON d.recipientId = r.id
         WHERE d.date BETWEEN ? AND ? 
         ORDER BY d.date DESC`,
        [startDate, endDate],
        (_, result) => {
          resolve(result.rows._array);
        },
        (_, error) => {
          console.error('Error getting donations:', error);
          reject(error);
          return false;
        }
      );
    });
  });
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
export const getDonationTotal = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT SUM(amount) as total FROM donations WHERE date BETWEEN ? AND ?`,
        [startDate, endDate],
        (_, result) => {
          if (result.rows._array.length > 0) {
            resolve(result.rows._array[0].total || 0);
          } else {
            resolve(0);
          }
        },
        (_, error) => {
          console.error('Error getting donation total:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Add income record
 * @param {Object} income Income object to add
 * @returns {Promise<number>} ID of the new income record
 */
export const addIncome = (income) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO income (amount, date, source, notes, processed) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          income.amount,
          income.date,
          income.source,
          income.notes || '',
          income.processed ? 1 : 0,
        ],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding income:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get income records within a date range
 * @param {string} startDate Start date (YYYY-MM-DD)
 * @param {string} endDate End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of income objects
 */
export const getIncome = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM income WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
        [startDate, endDate],
        (_, result) => {
          // Convert processed from 0/1 to false/true
          const incomeRecords = result.rows._array.map(record => ({
            ...record,
            processed: record.processed === 1,
          }));
          resolve(incomeRecords);
        },
        (_, error) => {
          console.error('Error getting income records:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Mark an income record as processed
 * @param {number} incomeId Income record ID
 * @returns {Promise<void>}
 */
export const markIncomeAsProcessed = (incomeId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE income SET processed = 1 WHERE id = ?`,
        [incomeId],
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error('Error marking income as processed:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get the total tithe amount that hasn't been processed yet
 * @returns {Promise<number>} Total pending tithe amount
 */
export const getPendingTitheTotal = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Get the tithe percentage
      tx.executeSql(
        `SELECT value FROM settings WHERE key = 'tithePercentage'`,
        [],
        (_, settingResult) => {
          const tithePercentage = parseFloat(settingResult.rows._array[0]?.value || 10) / 100;
          
          // Get sum of unprocessed income
          tx.executeSql(
            `SELECT SUM(amount) as total FROM income WHERE processed = 0`,
            [],
            (_, incomeResult) => {
              const total = incomeResult.rows._array[0]?.total || 0;
              const titheAmount = total * tithePercentage;
              resolve(titheAmount);
            },
            (_, error) => {
              console.error('Error getting pending tithe total:', error);
              reject(error);
              return false;
            }
          );
        },
        (_, error) => {
          console.error('Error getting tithe percentage:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Add a new recipient
 * @param {Object} recipient Recipient object to add
 * @returns {Promise<number>} ID of the new recipient
 */
export const addRecipient = (recipient) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO recipients (name, category, notes, isDefault) 
         VALUES (?, ?, ?, ?)`,
        [
          recipient.name,
          recipient.category,
          recipient.notes || '',
          recipient.isDefault ? 1 : 0,
        ],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding recipient:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get all recipients
 * @returns {Promise<Array>} Array of recipient objects
 */
export const getRecipients = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM recipients ORDER BY name`,
        [],
        (_, result) => {
          // Convert isDefault from 0/1 to false/true
          const recipients = result.rows._array.map(recipient => ({
            ...recipient,
            isDefault: recipient.isDefault === 1,
          }));
          resolve(recipients);
        },
        (_, error) => {
          console.error('Error getting recipients:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Update a recipient
 * @param {Object} recipient Recipient object to update
 * @returns {Promise<void>}
 */
export const updateRecipient = (recipient) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE recipients 
         SET name = ?, category = ?, notes = ?, isDefault = ? 
         WHERE id = ?`,
        [
          recipient.name,
          recipient.category,
          recipient.notes || '',
          recipient.isDefault ? 1 : 0,
          recipient.id,
        ],
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error('Error updating recipient:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get a setting value by key
 * @param {string} key Setting key
 * @returns {Promise<string>} Setting value
 */
export const getSetting = (key) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT value FROM settings WHERE key = ?`,
        [key],
        (_, result) => {
          if (result.rows._array.length > 0) {
            resolve(result.rows._array[0].value);
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          console.error(`Error getting setting ${key}:`, error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get all settings
 * @returns {Promise<Array>} Array of setting objects
 */
export const getAllSettings = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM settings`,
        [],
        (_, result) => {
          resolve(result.rows._array);
        },
        (_, error) => {
          console.error('Error getting all settings:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Update a setting
 * @param {string} key Setting key
 * @param {string} value Setting value
 * @returns {Promise<void>}
 */
export const updateSetting = (key, value) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        [key, value],
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error(`Error updating setting ${key}:`, error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Add a reminder
 * @param {Object} reminder Reminder object to add
 * @returns {Promise<number>} ID of the new reminder
 */
export const addReminder = (reminder) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO reminders (title, message, type, frequency, day, hour, minute, enabled, notificationId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reminder.title,
          reminder.message,
          reminder.type,
          reminder.frequency,
          reminder.day,
          reminder.hour,
          reminder.minute,
          reminder.enabled ? 1 : 0,
          reminder.notificationId || '',
        ],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding reminder:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get all reminders
 * @returns {Promise<Array>} Array of reminder objects
 */
export const getReminders = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM reminders ORDER BY hour, minute`,
        [],
        (_, result) => {
          // Convert enabled from 0/1 to false/true
          const reminders = result.rows._array.map(reminder => ({
            ...reminder,
            enabled: reminder.enabled === 1,
          }));
          resolve(reminders);
        },
        (_, error) => {
          console.error('Error getting reminders:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Update a reminder
 * @param {Object} reminder Reminder object to update
 * @returns {Promise<void>}
 */
export const updateReminder = (reminder) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE reminders 
         SET title = ?, message = ?, type = ?, frequency = ?, 
             day = ?, hour = ?, minute = ?, enabled = ?, notificationId = ? 
         WHERE id = ?`,
        [
          reminder.title,
          reminder.message,
          reminder.type,
          reminder.frequency,
          reminder.day,
          reminder.hour,
          reminder.minute,
          reminder.enabled ? 1 : 0,
          reminder.notificationId || '',
          reminder.id,
        ],
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error('Error updating reminder:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Delete a reminder
 * @param {number} id Reminder ID to delete
 * @returns {Promise<void>}
 */
export const deleteReminder = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM reminders WHERE id = ?`,
        [id],
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error('Error deleting reminder:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};