import os
import json
from datetime import datetime
import yfinance as yf
from sqlalchemy.orm import sessionmaker
from config import engine
from models import (
    create_all_tables,
    Stock,
    StockOHLC,
    StockDividend,
    StockSplit,
    StockInfo,
    StockFastInfo,
    IncomeStatement,
    BalanceSheet,
    Cashflow,
    EarningsHistory,
    EarningsCalendar,
    SecFiling,
    AnalystRecommendation,
    SustainabilityMetric,
    MajorHolder,
    InstitutionalHolder,
    MutualFundHolder,
    InsiderTransaction,
)


SYMBOLS = [
    "^GSPC",  
    "MSFT",
    "AAPL",
    "NVDA",
    "AMZN",
    "GOOG",
    "META",
    "BRK-B",
    "AVGO",
    "TSLA",
    "WMT",
    "LLY",
    "JPM",
    "V",
    "MA",
    "NFLX",
    "XOM",
    "COST",
    "ORCL",
    "PG",
    "JNJ",
    "UNH",
    "HD",
    "ABBV",
    "BAC",
    "KO",
    "PLTR",
    "TMUS",
    "PM",
    "CRM",
    "CVX",
]



Session = sessionmaker(bind=engine)

import math

def clean_json(obj):
    """
    Recursively replace any NaN/inf in obj with None, so it's valid JSON.
    Works on dicts, lists/tuples, and numeric scalars.
    """
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [clean_json(v) for v in obj]
    elif isinstance(obj, float):
        
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    else:
        return obj


def get_or_create_stock(session, symbol):
    stock = session.query(Stock).filter_by(symbol=symbol).first()
    if not stock:
        stock = Stock(symbol=symbol)
        session.add(stock)
        session.commit()
    return stock


def upsert_dataframe(session, stock_id, df, Model, date_field, **col_map):
    """
    Generic upsert: df.index (dates) + columns → Model instance
    date_field = attribute name on Model for the date key
    col_map = mapping from df.columns to Model field names
    """
    for idx, row in df.iterrows():
        if hasattr(idx, "date"):
            date_value = idx.date()  
        else:
            date_value = idx

        data = {"stock_id": stock_id, date_field: date_value}
        for df_col, model_col in col_map.items():
            data[model_col] = row[df_col]
        obj = Model(**data)
        session.merge(obj)
    session.commit()


def fetch_and_load(symbol):
    session = Session()
    stock = get_or_create_stock(session, symbol)
    ticker = yf.Ticker(symbol)

    try:
        print(f"[{symbol}] 1) Fetching OHLC…")
        hist = ticker.history(period="3y", auto_adjust=False)
        upsert_dataframe(
            session,
            stock.id,
            hist,
            StockOHLC,
            "trade_date",
            Open="open",
            High="high",
            Low="low",
            Close="close",
            Volume="volume",
        )
    except Exception as e:
        print(f"[{symbol}] OHLC fetch error:", e)

    try:
        print(f"[{symbol}] 2) Fetching Dividends and Splits…")
        divs = ticker.dividends
        upsert_dataframe(
            session,
            stock.id,
            divs.to_frame("dividend"),
            StockDividend,
            "ex_date",
            dividend="dividend",
        )
        splits = ticker.splits
        upsert_dataframe(
            session,
            stock.id,
            splits.to_frame("ratio"),
            StockSplit,
            "split_date",
            ratio="ratio",
        )
    except Exception as e:
        print(f"[{symbol}] Dividends/Splits error:", e)

    try:
        print(f"[{symbol}] 3) Fetching Info and Fast Info…")
        session.merge(StockInfo(stock_id=stock.id, data=ticker.info))
        fi = ticker.fast_info
        json_str = fi.toJSON()
        try:
            fast_info_dict = json.loads(json_str)
        except ValueError:
            fast_info_dict = json_str if isinstance(json_str, dict) else fi._asdict()
        session.merge(StockFastInfo(stock_id=stock.id, data=fast_info_dict))
        session.commit()
    except Exception as e:
        print(f"[{symbol}] Info/FastInfo error:", e)

    try:
        print(f"[{symbol}] 4) Fetching Financials…")
        for df, Model in [
            (ticker.financials, IncomeStatement),
            (ticker.balance_sheet, BalanceSheet),
            (ticker.cashflow, Cashflow),
        ]:
            if df is not None:
                for period in df.columns:
                    raw_dict = df[period].to_dict()
                    cleaned_dict = clean_json(raw_dict)
                    rec = Model(stock_id=stock.id, period=str(period), data=cleaned_dict)
                    session.merge(rec)
                session.commit()
    except Exception as e:
        print(f"[{symbol}] Financials error:", e)

    try:
        print(f"[{symbol}] 5) Fetching Earnings and Filings…")
        earnings = ticker.earnings
        if earnings is not None:
            for _, row in earnings.iterrows():
                obj = EarningsHistory(
                    stock_id=stock.id,
                    period=f"{row.name}",
                    eps=row["Earnings"],
                    revenue=row["Revenue"],
                )
                session.merge(obj)
            session.commit()

        cal = ticker.calendar
        if cal is not None:
            for date in cal["Earnings Date"]:
                obj = EarningsCalendar(stock_id=stock.id, announcement_date=date)
                session.merge(obj)
            session.commit()

        filings = ticker.sec_filings
        if filings is not None:
            for row in filings:
                obj = SecFiling(
                    stock_id=stock.id,
                    filing_date=row["date"],
                    filing_type=row["type"],
                    url=row["edgarUrl"],
                )
                session.merge(obj)
            session.commit()
    except Exception as e:
        print(f"[{symbol}] Earnings/Filings error:", e)

    try:
        print(f"[{symbol}] 6) Fetching ESG data…")
        sust = ticker.sustainability
        if sust is not None and not sust.empty:
            data = sust.to_dict()
        else:
            data = {}
        session.merge(SustainabilityMetric(stock_id=stock.id, data=data))
        session.commit()
    except Exception as e:
        print(f"[{symbol}] Sustainability error:", e)

    try:
        print(f"[{symbol}] 7) Fetching Holders and Insider Transactions…")
        
        
        
        
        
        
        
        
        
        
        
        
        
        

        
        
        
        
        
        
        
        
        
        
    except Exception as e:
        print(f"[{symbol}] Holders/Insiders error:", e)

    session.close()


from volatility import run_volatility_analysis

if __name__ == "__main__":
    
    create_all_tables()

    
    for sym in SYMBOLS:
        print(f"Fetching & loading data for {sym}…")
        fetch_and_load(sym)
    
    
    print("Running volatility analysis...")
    run_volatility_analysis()
    
    print("All done!")
