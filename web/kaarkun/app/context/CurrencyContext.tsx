'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateFromPkr: number;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'PKR', symbol: '₨',  name: 'Pakistani Rupee',  rateFromPkr: 1.0 },
  { code: 'USD', symbol: '$',   name: 'US Dollar',        rateFromPkr: 278.0 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',       rateFromPkr: 75.7 },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal',      rateFromPkr: 74.0 },
  { code: 'EUR', symbol: '€',   name: 'Euro',             rateFromPkr: 300.0 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',    rateFromPkr: 352.0 },
];

interface CurrencyContextType {
  selectedCurrency: string;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: string) => void;
  format: (amountInPkr: number | string | null | undefined) => string;
  convertToPkr: (amount: number | string) => number;
  convertFromPkr: (amount: number | string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState('PKR');

  useEffect(() => {
    const stored = localStorage.getItem('selected_currency');
    if (stored && SUPPORTED_CURRENCIES.some(c => c.code === stored)) {
      setSelectedCurrency(stored);
    }
  }, []);

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES.some(c => c.code === code)) {
      setSelectedCurrency(code);
      localStorage.setItem('selected_currency', code);
    }
  };

  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  const format = (amountInPkr: number | string | null | undefined) => {
    if (amountInPkr === null || amountInPkr === undefined || amountInPkr === '') {
      return `${currencyInfo.symbol}0`;
    }
    const pkrVal = typeof amountInPkr === 'number' ? amountInPkr : parseFloat(amountInPkr.toString()) || 0;
    
    if (currencyInfo.code === 'PKR') {
      return `${currencyInfo.symbol} ${Math.round(pkrVal).toLocaleString()}`;
    } else {
      const converted = pkrVal / currencyInfo.rateFromPkr;
      return `${currencyInfo.code} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const convertToPkr = (amount: number | string) => {
    const val = typeof amount === 'number' ? amount : parseFloat(amount.toString()) || 0;
    return val * currencyInfo.rateFromPkr;
  };

  const convertFromPkr = (amount: number | string) => {
    const val = typeof amount === 'number' ? amount : parseFloat(amount.toString()) || 0;
    return val / currencyInfo.rateFromPkr;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      currencyInfo,
      setCurrency,
      format,
      convertToPkr,
      convertFromPkr
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
