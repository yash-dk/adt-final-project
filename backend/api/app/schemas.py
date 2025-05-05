from typing import List, Dict, Any, Optional
from datetime import date
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str

class UserCreate(BaseModel):
    username: str
    password: str



class StockBase(BaseModel):
    symbol: str
    name: Optional[str]

class Stock(StockBase):
    id: int
    class Config:
        orm_mode = True

class DailyChange(BaseModel):
    symbol: str
    latest_date: date
    latest_price: float
    previous_price: float
    price_change: float
    percent_change: float
    class Config:
        orm_mode = True

class StockVolatilityMetrics(BaseModel):
    symbol: str
    calculation_date: date
    daily_volatility: float
    annualized_volatility: float
    relative_volatility: float | None
    beta: float | None
    r_squared: float | None
    class Config:
        orm_mode = True

class OHLC(BaseModel):
    trade_date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    class Config:
        orm_mode = True

class Dividend(BaseModel):
    ex_date: date
    dividend: float
    class Config:
        orm_mode = True

class Split(BaseModel):
    split_date: date
    ratio: float
    class Config:
        orm_mode = True

class JSONData(BaseModel):
    data: Dict[str, Any]
    class Config:
        orm_mode = True

class Statement(BaseModel):
    period: str
    data: Dict[str, Any]
    class Config:
        orm_mode = True

class EarningsRec(BaseModel):
    period: str
    eps: Optional[float]
    revenue: Optional[float]
    class Config:
        orm_mode = True

class EarningsCal(BaseModel):
    announcement_date: date
    class Config:
        orm_mode = True

class SecFilingSchema(BaseModel):
    filing_date: date
    filing_type: str
    url: str
    class Config:
        orm_mode = True

class VolatilityMetrics(BaseModel):
    calculation_date: date
    daily_volatility: float
    annualized_volatility: float
    relative_volatility: float | None
    beta: float | None
    r_squared: float | None
    class Config:
        orm_mode = True


class PatternRequest(BaseModel):
    symbol: str
    pattern_name: str
    lookback_period: Optional[int] = 100

class PatternMatch(BaseModel):
    pattern_name: str
    timestamp: date
    signal_value: float
    class Config:
        orm_mode = True

class PatternList(BaseModel):
    patterns: List[str]
    class Config:
        orm_mode = True

# ---- NewsArticle schemas ----

class NewsArticleBase(BaseModel):
    title: str
    publisher: str
    link: str
    published_date: date
    summary: str
    sentiment_score: float
    sentiment_label: str

class NewsArticleCreate(NewsArticleBase):
    stock_id: int

class NewsArticle(NewsArticleBase):
    id: int
    stock_id: int
    cached_at: date

    class Config:
        orm_mode = True
