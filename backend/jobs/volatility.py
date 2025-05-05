import numpy as np
import pandas as pd
from datetime import datetime, date
from sqlalchemy.orm import sessionmaker
from config import engine
from models import Stock, StockOHLC, VolatilityMetrics

Session = sessionmaker(bind=engine)

def calculate_returns(prices):
    """Calculate log returns from price series"""
    return np.log(prices / prices.shift(1))

def calculate_volatility_metrics(stock_id, session, benchmark_symbol="^GSPC"):
    """
    Calculate volatility metrics for a given stock
    Args:
        stock_id: ID of the stock to analyze
        session: SQLAlchemy session
        benchmark_symbol: Symbol of benchmark index (default: S&P 500)
    """
    # Get stock price data
    stock_data = pd.read_sql(
        session.query(StockOHLC)
        .filter(StockOHLC.stock_id == stock_id)
        .statement,
        session.bind
    )
    
    if stock_data.empty:
        return None

    # Get benchmark data
    benchmark_stock = session.query(Stock).filter(Stock.symbol == benchmark_symbol).first()
    if not benchmark_stock:
        return None
        
    benchmark_data = pd.read_sql(
        session.query(StockOHLC)
        .filter(StockOHLC.stock_id == benchmark_stock.id)
        .statement,
        session.bind
    )

    # Calculate daily returns
    stock_returns = calculate_returns(stock_data.close)
    benchmark_returns = calculate_returns(benchmark_data.close)

    # Align the return series
    combined_returns = pd.concat([stock_returns, benchmark_returns], axis=1).dropna()
    if len(combined_returns) < 30:  # Need at least 30 days of data
        return None

    # Calculate volatility metrics
    daily_vol = np.std(combined_returns.iloc[:, 0])
    annualized_vol = daily_vol * np.sqrt(252)  # Annualize using trading days
    
    # Calculate relative volatility (ratio to benchmark volatility)
    benchmark_vol = np.std(combined_returns.iloc[:, 1])
    relative_vol = daily_vol / benchmark_vol if benchmark_vol != 0 else None

    # Calculate beta and R-squared
    covariance = np.cov(combined_returns.iloc[:, 0], combined_returns.iloc[:, 1])[0, 1]
    variance = np.var(combined_returns.iloc[:, 1])
    beta = covariance / variance if variance != 0 else None
    
    # Calculate R-squared
    correlation = np.corrcoef(combined_returns.iloc[:, 0], combined_returns.iloc[:, 1])[0, 1]
    r_squared = correlation ** 2

    return VolatilityMetrics(
        stock_id=stock_id,
        calculation_date=date.today(),
        daily_volatility=float(daily_vol),
        annualized_volatility=float(annualized_vol),
        relative_volatility=float(relative_vol) if relative_vol else None,
        beta=float(beta) if beta else None,
        r_squared=float(r_squared)
    )

def run_volatility_analysis():
    """Run volatility analysis for all stocks"""
    session = Session()
    try:
        stocks = session.query(Stock).all()
        for stock in stocks:
            print(f"Calculating volatility metrics for {stock.symbol}...")
            metrics = calculate_volatility_metrics(stock.id, session)
            if metrics:
                session.merge(metrics)
        session.commit()
    except Exception as e:
        print(f"Error during volatility analysis: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    run_volatility_analysis()