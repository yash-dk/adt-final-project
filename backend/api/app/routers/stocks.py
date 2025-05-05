from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from transformers import pipeline
import yfinance as yf
from datetime import datetime, timedelta
from typing import List

from ..core.config import get_db
from ..core.security import get_current_user
from .. import schemas, crud, models

sentiment_analyzer = pipeline("sentiment-analysis")

router = APIRouter(
    prefix="/stocks",
    tags=["stocks"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/volatility-metrics", response_model=list[schemas.StockVolatilityMetrics])
def read_all_volatility_metrics(db: Session = Depends(get_db)):
    """Get volatility metrics for all stocks"""
    return crud.get_all_volatility_metrics(db)

@router.get("/daily-changes", response_model=list[schemas.DailyChange])
def read_daily_changes(db: Session = Depends(get_db)):
    """Get daily price changes for all stocks"""
    return crud.get_daily_changes(db)

@router.get("/", response_model=list[schemas.Stock])
def read_stocks(skip: int = 0, limit: int = 30, db: Session = Depends(get_db)):
    return crud.get_stocks(db, skip, limit)

@router.get("/{symbol}", response_model=schemas.Stock)
def read_stock(symbol: str, db: Session = Depends(get_db)):
    db_stock = crud.get_stock(db, symbol.upper())
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock

@router.get("/{symbol}/ohlc", response_model=list[schemas.OHLC])
def read_ohlc(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return crud.get_ohlc(db, stock.id)

@router.get("/{symbol}/dividends", response_model=list[schemas.Dividend])
def read_dividends(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return crud.get_dividends(db, stock.id)

@router.get("/{symbol}/splits", response_model=list[schemas.Split])
def read_splits(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return crud.get_splits(db, stock.id)

@router.get("/{symbol}/info", response_model=schemas.JSONData)
def read_info(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    result = crud.get_info(db, stock.id)
    if not result:
        raise HTTPException(status_code=404, detail="Info not found")
    return result

@router.get("/{symbol}/fast_info", response_model=schemas.JSONData)
def read_fast_info(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    result = crud.get_fast_info(db, stock.id)
    if not result:
        raise HTTPException(status_code=404, detail="Fast info not found")
    return result

@router.get("/{symbol}/income", response_model=list[schemas.Statement])
def read_income(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    return crud.get_financials(db, models.IncomeStatement, stock.id)

@router.get("/{symbol}/balance", response_model=list[schemas.Statement])
def read_balance(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    return crud.get_financials(db, models.BalanceSheet, stock.id)

@router.get("/{symbol}/cashflow", response_model=list[schemas.Statement])
def read_cashflow(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    return crud.get_financials(db, models.Cashflow, stock.id)

@router.get("/{symbol}/earnings", response_model=list[schemas.EarningsRec])
def read_earnings(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    return crud.get_earnings(db, stock.id)

@router.get("/{symbol}/earnings_calendar", response_model=list[schemas.EarningsCal])
def read_calendar(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    return crud.get_calendar(db, stock.id)

@router.get("/{symbol}/filings", response_model=list[schemas.SecFilingSchema])
def read_filings(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    return crud.get_filings(db, stock.id)

@router.get("/{symbol}/sustainability", response_model=schemas.JSONData)
def read_sustainability(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    return crud.get_sustainability(db, stock.id)

@router.get("/{symbol}/volatility", response_model=schemas.VolatilityMetrics)
def read_volatility(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock(db, symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    metrics = crud.get_volatility(db, stock.id)
    if not metrics:
        raise HTTPException(status_code=404, detail="Volatility metrics not found")
    return metrics

@router.get("/{symbol}/news", response_model=List[schemas.NewsArticle])
def get_stock_news(
    symbol: str,
    db: Session = Depends(get_db),
    max_age_days: int = 1
):
    stock = crud.get_stock(db, symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    cached_news = crud.get_news_by_stock(db, stock.id, max_age_days)
    if cached_news:
        return cached_news

    ticker = yf.Ticker(symbol)
    news_items = ticker.news

    crud.delete_old_news(db, stock.id)

    processed_news = []
    for article in news_items:
        try:
            sentiment = sentiment_analyzer(article['content']['title'])[0]
            
            news_data = schemas.NewsArticleCreate(
                stock_id=stock.id,
                title=article['content']['title'],
                publisher=article['content']['provider']['displayName'],
                link=article['content']['provider']['url'],
                published_date=datetime.fromisoformat(article['content']['pubDate'].split('T')[0]),
                summary=article['content']['summary'],
                sentiment_score=float(sentiment["score"]),
                sentiment_label=sentiment["label"]
            )
            
            db_news = crud.create_news_article(db, news_data)
            processed_news.append(db_news)
        except KeyError as e:
            print(f"Skipping article due to missing data: {e}")
            continue
        except Exception as e:
            print(f"Error processing article: {e}")
            continue

    return processed_news
