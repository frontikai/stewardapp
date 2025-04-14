/**
 * Format a date object into YYYY-MM-DD string
 * @param {Date} date The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a date string into a more readable format (MM/DD/YYYY)
 * @param {string} dateString The date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export const formatDateReadable = (dateString) => {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
};

/**
 * Get the start and end date of the current month
 * @returns {Object} Object with start and end dates
 */
export const getCurrentMonthStartEnd = () => {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

/**
 * Get the start and end date of a specific month
 * @param {number} year The year
 * @param {number} month The month (1-12)
 * @returns {Object} Object with start and end dates
 */
export const getMonthStartEnd = (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

/**
 * Get the start and end date of the current year
 * @returns {Object} Object with start and end dates
 */
export const getCurrentYearStartEnd = () => {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1);
  const endDate = new Date(today.getFullYear(), 11, 31);
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

/**
 * Get the start and end date of the week containing the specified date
 * @param {Date} date The date in the week
 * @returns {Object} Object with start and end dates
 */
export const getWeekStartEnd = (date) => {
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 6 for Saturday
  
  // Calculate the date of Sunday (start of week)
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - dayOfWeek);
  
  // Calculate the date of Saturday (end of week)
  const endDate = new Date(currentDate);
  endDate.setDate(currentDate.getDate() + (6 - dayOfWeek));
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

/**
 * Get the current quarter (1-4)
 * @returns {number} The current quarter
 */
export const getCurrentQuarter = () => {
  const today = new Date();
  const month = today.getMonth();
  
  if (month < 3) return 1;
  if (month < 6) return 2;
  if (month < 9) return 3;
  return 4;
};

/**
 * Get the start and end date of the current quarter
 * @returns {Object} Object with start and end dates
 */
export const getCurrentQuarterStartEnd = () => {
  const today = new Date();
  const quarter = getCurrentQuarter();
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  
  const startDate = new Date(today.getFullYear(), startMonth, 1);
  const endDate = new Date(today.getFullYear(), endMonth + 1, 0);
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

/**
 * Calculate the number of days between two dates
 * @param {string} startDate Start date string in YYYY-MM-DD format
 * @param {string} endDate End date string in YYYY-MM-DD format
 * @returns {number} Number of days
 */
export const daysBetweenDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get a greeting based on the time of day
 * @returns {string} Appropriate greeting
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good Morning';
  } else if (hour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

/**
 * Get the day of week (0-6, where 0 is Sunday)
 * @param {Date} date The date
 * @returns {number} Day of week
 */
export const getDayOfWeek = (date) => {
  return date.getDay();
};

/**
 * Get the name of the day for a date
 * @param {Date} date The date
 * @param {Object} options Formatting options
 * @returns {string} Day name
 */
export const getDayName = (date, options = { weekday: 'long' }) => {
  return date.toLocaleDateString('en-US', options);
};

/**
 * Check if a date is today
 * @param {Date} date The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};