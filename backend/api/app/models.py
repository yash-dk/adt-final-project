from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import (
    Column, Integer, String, Date, Numeric, BigInteger, Text, JSON, ForeignKey
)
from sqlalchemy.orm import relationship, sessionmaker
from .core.config import engine

Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Stock(Base):
    __tablename__ = "stocks"
    id     = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, nullable=False, index=True)
    name   = Column(Text, nullable=True)

    ohlc           = relationship("StockOHLC", back_populates="stock")
    dividends      = relationship("StockDividend", back_populates="stock")
    splits         = relationship("StockSplit", back_populates="stock")
    info           = relationship("StockInfo", uselist=False, back_populates="stock")
    fast_info      = relationship("StockFastInfo", uselist=False, back_populates="stock")
    income         = relationship("IncomeStatement", back_populates="stock")
    balance        = relationship("BalanceSheet", back_populates="stock")
    cashflow       = relationship("Cashflow", back_populates="stock")
    earnings       = relationship("EarningsHistory", back_populates="stock")
    calendar       = relationship("EarningsCalendar", back_populates="stock")
    filings        = relationship("SecFiling", back_populates="stock")
    sustainability = relationship("SustainabilityMetric", uselist=False, back_populates="stock")
    volatility_metrics = relationship("VolatilityMetrics", back_populates="stock")

class StockOHLC(Base):
    __tablename__ = "stock_ohlc"
    stock_id   = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    trade_date = Column(Date, primary_key=True)
    open       = Column(Numeric)
    high       = Column(Numeric)
    low        = Column(Numeric)
    close      = Column(Numeric)
    volume     = Column(BigInteger)
    stock      = relationship("Stock", back_populates="ohlc")

class StockDividend(Base):
    __tablename__ = "stock_dividends"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    ex_date  = Column(Date, primary_key=True)
    dividend = Column(Numeric)
    stock    = relationship("Stock", back_populates="dividends")

class StockSplit(Base):
    __tablename__ = "stock_splits"
    stock_id   = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    split_date = Column(Date, primary_key=True)
    ratio      = Column(Numeric)
    stock      = relationship("Stock", back_populates="splits")

class StockInfo(Base):
    __tablename__ = "stock_info"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="info")

class StockFastInfo(Base):
    __tablename__ = "stock_fast_info"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="fast_info")

class IncomeStatement(Base):
    __tablename__ = "income_statements"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    period   = Column(String, primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="income")

class BalanceSheet(Base):
    __tablename__ = "balance_sheets"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    period   = Column(String, primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="balance")

class Cashflow(Base):
    __tablename__ = "cashflows"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    period   = Column(String, primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="cashflow")

class EarningsHistory(Base):
    __tablename__ = "earnings_history"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    period   = Column(String, primary_key=True)
    eps      = Column(Numeric)
    revenue  = Column(Numeric)
    stock    = relationship("Stock", back_populates="earnings")

class EarningsCalendar(Base):
    __tablename__ = "earnings_calendar"
    stock_id          = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    announcement_date = Column(Date, primary_key=True)
    stock             = relationship("Stock", back_populates="calendar")

class SecFiling(Base):
    __tablename__ = "sec_filings"
    stock_id    = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    filing_date = Column(Date, primary_key=True)
    filing_type = Column(String, primary_key=True)
    url         = Column(String)
    stock       = relationship("Stock", back_populates="filings")

class SustainabilityMetric(Base):
    __tablename__ = "sustainability_metrics"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="sustainability")

class VolatilityMetrics(Base):
    __tablename__ = "volatility_metrics"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    calculation_date = Column(Date, primary_key=True)
    daily_volatility = Column(Numeric)
    annualized_volatility = Column(Numeric)
    relative_volatility = Column(Numeric)
    beta = Column(Numeric)
    r_squared = Column(Numeric)
    stock = relationship("Stock", back_populates="volatility_metrics")

class NewsArticle(Base):
    __tablename__ = "news_articles"
    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    title = Column(String)
    publisher = Column(String)
    link = Column(String)
    published_date = Column(Date)
    summary = Column(Text)  # Adding summary field
    sentiment_score = Column(Numeric)
    sentiment_label = Column(String)  # positive, negative, neutral
    cached_at = Column(Date)
    stock = relationship("Stock", backref="news")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

def init_db():
    Base.metadata.create_all(bind=engine)
