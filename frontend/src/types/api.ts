export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface Stock {
    id: number;
    symbol: string;
    name: string;
}

export interface OHLCData {
    trade_date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Dividend {
    ex_date: string;
    dividend: number;
}

export interface Split {
    split_date: string;
    ratio: number;
}

export interface FinancialStatement {
    period: string;
    data: Record<string, any>;
}

export interface EarningsData {
    period: string;
    eps: number;
    revenue: number;
}

export interface Filing {
    filing_date: string;
    filing_type: string;
    url: string;
}

export interface EarningsCalendar {
    announcement_date: string;
}

export interface VolatilityMetrics {
    calculation_date: string;
    daily_volatility: number;
    annualized_volatility: number;
    relative_volatility: number | null;
    beta: number | null;
    r_squared: number | null;
}

export interface StockDailyChange {
    symbol: string;
    latest_date: string;
    latest_price: number;
    previous_price: number;
    price_change: number;
    percent_change: number;
}

export interface NewsArticle {
    id: number;
    stock_id: number;
    title: string;
    publisher: string;
    link: string;
    published_date: string;
    sentiment_score: number;
    sentiment_label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    cached_at: string;
}