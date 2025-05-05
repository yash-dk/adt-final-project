import axios from 'axios';
import { AuthResponse, Stock, OHLCData, Dividend, Split, FinancialStatement, EarningsData, Filing, VolatilityMetrics, StockDailyChange } from '../types/api';

const BASE_URL = 'http://localhost:8000'; // Replace with your actual API URL
axios.defaults.baseURL = BASE_URL;

export const authAPI = {
    register: (username: string, password: string) => 
        axios.post('/auth/register', { username, password }),
    
    login: (username: string, password: string) =>
        axios.post<AuthResponse>('/auth/token', 
            new URLSearchParams({ username, password }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
        ),
};

export const stocksAPI = {
    list: (skip: number = 0, limit: number = 30) =>
        axios.get<Stock[]>('/stocks/', { params: { skip, limit }}),

    getDailyChanges: () =>
        axios.get<StockDailyChange[]>('/stocks/daily-changes'),

    getStock: (symbol: string) =>
        axios.get<Stock>(`/stocks/${symbol}`),

    getOHLC: (symbol: string) =>
        axios.get<OHLCData[]>(`/stocks/${symbol}/ohlc`),

    getDividends: (symbol: string) =>
        axios.get<Dividend[]>(`/stocks/${symbol}/dividends`),

    getSplits: (symbol: string) =>
        axios.get<Split[]>(`/stocks/${symbol}/splits`),

    getInfo: (symbol: string) =>
        axios.get(`/stocks/${symbol}/info`),

    getFastInfo: (symbol: string) =>
        axios.get(`/stocks/${symbol}/fast_info`),

    getIncome: (symbol: string) =>
        axios.get<FinancialStatement[]>(`/stocks/${symbol}/income`),

    getBalance: (symbol: string) =>
        axios.get<FinancialStatement[]>(`/stocks/${symbol}/balance`),

    getCashflow: (symbol: string) =>
        axios.get<FinancialStatement[]>(`/stocks/${symbol}/cashflow`),

    getEarnings: (symbol: string) =>
        axios.get<EarningsData[]>(`/stocks/${symbol}/earnings`),

    getEarningsCalendar: (symbol: string) =>
        axios.get(`/stocks/${symbol}/earnings_calendar`),

    getFilings: (symbol: string) =>
        axios.get<Filing[]>(`/stocks/${symbol}/filings`),

    getVolatility: (symbol: string) =>
        axios.get<VolatilityMetrics>(`/stocks/${symbol}/volatility`),

    getSustainability: (symbol: string) =>
        axios.get(`/stocks/${symbol}/sustainability`),

    getNews: (symbol: string, maxAgeDays?: number) =>
        axios.get(`/stocks/${symbol}/news`, { params: { max_age_days: maxAgeDays }}),
        
    getPatterns: () =>
        axios.get<{ patterns: string[] }>('/patterns/supported'),
        
    analyzePattern: (symbol: string, pattern: string, lookbackPeriod: number = 100) =>
        axios.post<{ pattern_name: string; timestamp: string; signal_value: number }[]>(
            `/patterns/analyze`,
            {
                symbol,
                pattern_name: pattern,
                lookback_period: lookbackPeriod
            }
        ),
};