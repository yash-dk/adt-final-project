from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import (
    Column, Integer, String, Date, Numeric, BigInteger, Text,
    JSON, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from config import engine

Base = declarative_base()

class Stock(Base):
    __tablename__ = "stocks"
    id     = Column(Integer, primary_key=True)
    symbol = Column(String(10), unique=True, nullable=False)
    name   = Column(Text)

    ohlc               = relationship("StockOHLC", back_populates="stock")
    dividends          = relationship("StockDividend", back_populates="stock")
    splits             = relationship("StockSplit", back_populates="stock")
    info               = relationship("StockInfo", uselist=False, back_populates="stock")
    fast_info          = relationship("StockFastInfo", uselist=False, back_populates="stock")
    income_statements  = relationship("IncomeStatement", back_populates="stock")
    balance_sheets     = relationship("BalanceSheet", back_populates="stock")
    cashflows          = relationship("Cashflow", back_populates="stock")
    earnings_history   = relationship("EarningsHistory", back_populates="stock")
    earnings_calendar  = relationship("EarningsCalendar", back_populates="stock")
    sec_filings        = relationship("SecFiling", back_populates="stock")
    recommendations    = relationship("AnalystRecommendation", back_populates="stock")
    sustainability     = relationship("SustainabilityMetric", uselist=False, back_populates="stock")
    major_holders      = relationship("MajorHolder", back_populates="stock")
    institutional_holders = relationship("InstitutionalHolder", back_populates="stock")
    mutualfund_holders   = relationship("MutualFundHolder", back_populates="stock")
    insider_transactions = relationship("InsiderTransaction", back_populates="stock")
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
    stock    = relationship("Stock", back_populates="income_statements")

class BalanceSheet(Base):
    __tablename__ = "balance_sheets"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    period   = Column(String, primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="balance_sheets")

class Cashflow(Base):
    __tablename__ = "cashflows"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    period   = Column(String, primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="cashflows")

class EarningsHistory(Base):
    __tablename__ = "earnings_history"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    period   = Column(String, primary_key=True)
    eps      = Column(Numeric)
    revenue  = Column(Numeric)
    stock    = relationship("Stock", back_populates="earnings_history")

class EarningsCalendar(Base):
    __tablename__ = "earnings_calendar"
    stock_id          = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    announcement_date = Column(Date, primary_key=True)
    stock             = relationship("Stock", back_populates="earnings_calendar")

class SecFiling(Base):
    __tablename__ = "sec_filings"
    stock_id    = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    filing_date = Column(Date, primary_key=True)
    filing_type = Column(String, primary_key=True)
    url         = Column(String)
    stock       = relationship("Stock", back_populates="sec_filings")

class AnalystRecommendation(Base):
    __tablename__ = "analyst_recommendations"
    stock_id    = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    rec_date    = Column(Date, primary_key=True)
    strong_buy  = Column(Integer)
    buy         = Column(Integer)
    hold        = Column(Integer)
    sell        = Column(Integer)
    strong_sell = Column(Integer)
    stock       = relationship("Stock", back_populates="recommendations")

class SustainabilityMetric(Base):
    __tablename__ = "sustainability_metrics"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    data     = Column(JSON)
    stock    = relationship("Stock", back_populates="sustainability")

class MajorHolder(Base):
    __tablename__ = "major_holders"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    date     = Column(Date, primary_key=True)
    holders  = Column(JSON)
    stock    = relationship("Stock", back_populates="major_holders")

class InstitutionalHolder(Base):
    __tablename__ = "institutional_holders"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    date     = Column(Date, primary_key=True)
    holders  = Column(JSON)
    stock    = relationship("Stock", back_populates="institutional_holders")

class MutualFundHolder(Base):
    __tablename__ = "mutualfund_holders"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    date     = Column(Date, primary_key=True)
    holders  = Column(JSON)
    stock    = relationship("Stock", back_populates="mutualfund_holders")

class InsiderTransaction(Base):
    __tablename__ = "insider_transactions"
    stock_id         = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    transaction_type = Column(String)
    owners           = Column(JSON)
    stock            = relationship("Stock", back_populates="insider_transactions")

class VolatilityMetrics(Base):
    __tablename__ = "volatility_metrics"
    stock_id = Column(Integer, ForeignKey("stocks.id"), primary_key=True)
    calculation_date = Column(Date, primary_key=True)
    daily_volatility = Column(Numeric)
    annualized_volatility = Column(Numeric)
    relative_volatility = Column(Numeric)  # Compared to benchmark
    beta = Column(Numeric)  # Market beta
    r_squared = Column(Numeric)  # R-squared of beta calculation
    stock = relationship("Stock", back_populates="volatility_metrics")

def create_all_tables():
    Base.metadata.create_all(engine)

if __name__ == "__main__":
    create_all_tables()
