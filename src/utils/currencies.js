export const currencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$'
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€'
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£'
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$'
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$'
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥'
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹'
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥'
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$'
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R'
  },
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦'
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh'
  },
  {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: '₵'
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: 'Mex$'
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱'
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$'
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$'
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$'
  }
];

export const getCurrencySymbol = (code) => {
  const currency = currencies.find(c => c.code === code);
  return currency ? currency.symbol : code;
};

export const formatCurrency = (amount, currencyCode = 'USD', options = {}) => {
  try {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      ...options
    }).format(amount);
    
    return formattedAmount;
  } catch (error) {
    // Fallback formatting if Intl isn't available
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  }
};
