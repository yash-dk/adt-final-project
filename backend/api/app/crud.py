from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models, schemas

def get_stock(db: Session, symbol: str):
    return db.query(models.Stock).filter(models.Stock.symbol == symbol).first()

def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Stock).offset(skip).limit(limit).all()

def get_daily_changes(db: Session):
    """Get the daily price changes for all stocks"""
    changes = []
    stocks = db.query(models.Stock).all()
    
    for stock in stocks:
        latest_prices = (
            db.query(models.StockOHLC)
            .filter(models.StockOHLC.stock_id == stock.id)
            .order_by(models.StockOHLC.trade_date.desc())
            .limit(2)
            .all()
        )
        
        if len(latest_prices) >= 2:
            latest = latest_prices[0]
            previous = latest_prices[1]
            
            price_change = float(latest.close) - float(previous.close)
            percent_change = (price_change / float(previous.close)) * 100
            
            changes.append({
                "symbol": stock.symbol,
                "latest_date": latest.trade_date,
                "latest_price": float(latest.close),
                "previous_price": float(previous.close),
                "price_change": price_change,
                "percent_change": percent_change
            })
    
    return changes

def get_ohlc(db: Session, stock_id: int):
    return (
        db.query(models.StockOHLC)
          .filter(models.StockOHLC.stock_id == stock_id)
          .order_by(models.StockOHLC.trade_date)
          .all()
    )

def get_dividends(db: Session, stock_id: int):
    return (
        db.query(models.StockDividend)
          .filter(models.StockDividend.stock_id == stock_id)
          .order_by(models.StockDividend.ex_date)
          .all()
    )

def get_splits(db: Session, stock_id: int):
    return (
        db.query(models.StockSplit)
          .filter(models.StockSplit.stock_id == stock_id)
          .order_by(models.StockSplit.split_date)
          .all()
    )

def get_info(db: Session, stock_id: int):
    return (
        db.query(models.StockInfo)
          .filter(models.StockInfo.stock_id == stock_id)
          .first()
    )

def get_fast_info(db: Session, stock_id: int):
    return (
        db.query(models.StockFastInfo)
          .filter(models.StockFastInfo.stock_id == stock_id)
          .first()
    )

def get_financials(db: Session, model, stock_id: int):
    return db.query(model).filter(model.stock_id == stock_id).all()

def get_earnings(db: Session, stock_id: int):
    return db.query(models.EarningsHistory).filter(models.EarningsHistory.stock_id == stock_id).all()

def get_calendar(db: Session, stock_id: int):
    return db.query(models.EarningsCalendar).filter(models.EarningsCalendar.stock_id == stock_id).all()

def get_filings(db: Session, stock_id: int):
    return db.query(models.SecFiling).filter(models.SecFiling.stock_id == stock_id).all()

def get_sustainability(db: Session, stock_id: int):
    return (
        db.query(models.SustainabilityMetric)
          .filter(models.SustainabilityMetric.stock_id == stock_id)
          .first()
    )

def get_volatility(db: Session, stock_id: int):
    return (
        db.query(models.VolatilityMetrics)
          .filter(models.VolatilityMetrics.stock_id == stock_id)
          .order_by(models.VolatilityMetrics.calculation_date.desc())
          .first()
    )

def get_all_volatility_metrics(db: Session):
    """Get the latest volatility metrics for all stocks"""
    stocks = db.query(models.Stock).all()
    results = []
    
    for stock in stocks:
        metrics = (
            db.query(models.VolatilityMetrics)
            .filter(models.VolatilityMetrics.stock_id == stock.id)
            .order_by(models.VolatilityMetrics.calculation_date.desc())
            .first()
        )
        
        if metrics:
            results.append({
                "symbol": stock.symbol,
                "calculation_date": metrics.calculation_date,
                "daily_volatility": float(metrics.daily_volatility),
                "annualized_volatility": float(metrics.annualized_volatility),
                "relative_volatility": float(metrics.relative_volatility) if metrics.relative_volatility else None,
                "beta": float(metrics.beta) if metrics.beta else None,
                "r_squared": float(metrics.r_squared) if metrics.r_squared else None
            })
    
    return results

def get_stock_ohlc_data(db: Session, symbol: str, start_date: datetime):
    stock = get_stock(db, symbol)
    if not stock:
        return None
    
    return (
        db.query(models.StockOHLC)
          .filter(
              models.StockOHLC.stock_id == stock.id,
              models.StockOHLC.trade_date >= start_date
          )
          .order_by(models.StockOHLC.trade_date)
          .all()
    )

def get_news_by_stock(db: Session, stock_id: int, max_age_days: int = 1):
    cutoff_date = datetime.now().date() - timedelta(days=max_age_days)
    return db.query(models.NewsArticle).filter(
        models.NewsArticle.stock_id == stock_id,
        models.NewsArticle.cached_at >= cutoff_date
    ).all()

def create_news_article(db: Session, news: schemas.NewsArticleCreate):
    db_news = models.NewsArticle(**news.dict(), cached_at=datetime.now().date())
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news

def delete_old_news(db: Session, stock_id: int, max_age_days: int = 1):
    cutoff_date = datetime.now().date() - timedelta(days=max_age_days)
    db.query(models.NewsArticle).filter(
        models.NewsArticle.stock_id == stock_id,
        models.NewsArticle.cached_at < cutoff_date
    ).delete()
    db.commit()
