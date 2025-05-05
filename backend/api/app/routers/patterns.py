from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import talib
from typing import List
from datetime import datetime, timedelta

from ..dependencies import get_db
from ..schemas import PatternRequest, PatternMatch, PatternList
from ..crud import get_stock_ohlc_data

router = APIRouter(
    prefix="/patterns",
    tags=["patterns"]
)

SUPPORTED_PATTERNS = {
    "cdl_doji": talib.CDLDOJI,
    "cdl_hammer": talib.CDLHAMMER,
    "cdl_engulfing": talib.CDLENGULFING,
    "cdl_morning_star": talib.CDLMORNINGSTAR,
    "cdl_evening_star": talib.CDLEVENINGSTAR,
    "cdl_shooting_star": talib.CDLSHOOTINGSTAR,
    "cdl_harami": talib.CDLHARAMI,
    "cdl_dark_cloud_cover": talib.CDLDARKCLOUDCOVER,
    "cdl_piercing": talib.CDLPIERCING,
    "cdl_three_white_soldiers": talib.CDL3WHITESOLDIERS,
    "cdl_three_black_crows": talib.CDL3BLACKCROWS,
    "rsi": talib.RSI,
    "macd": talib.MACD,
    "stochastic": talib.STOCH,
    "sma": talib.SMA,
    "ema": talib.EMA,
    "adx": talib.ADX,
    "bollinger_bands": talib.BBANDS,
    "atr": talib.ATR,
    "obv": talib.OBV,
}

@router.get("/supported", response_model=PatternList)
def list_supported_patterns():
    """List all supported technical analysis patterns."""
    return {"patterns": list(SUPPORTED_PATTERNS.keys())}

@router.post("/analyze", response_model=List[PatternMatch])
def analyze_pattern(request: PatternRequest, db: Session = Depends(get_db)):
    """Analyze a specific pattern for a given stock symbol."""
    if request.pattern_name not in SUPPORTED_PATTERNS:
        raise HTTPException(status_code=400, detail="Pattern not supported")
    
    ohlc_data = get_stock_ohlc_data(db, request.symbol, 
                                   datetime.now() - timedelta(days=request.lookback_period))
    
    if not ohlc_data:
        raise HTTPException(status_code=404, detail="No data found for symbol")
    
    df = pd.DataFrame([{
        'datetime': d.trade_date,
        'open': float(d.open),
        'high': float(d.high),
        'low': float(d.low),
        'close': float(d.close),
        'volume': int(d.volume)
    } for d in ohlc_data])
    
    pattern_func = SUPPORTED_PATTERNS[request.pattern_name]
    try:
        open_arr = df['open'].values
        high_arr = df['high'].values
        low_arr = df['low'].values
        close_arr = df['close'].values
        volume_arr = df['volume'].values
        
        if request.pattern_name.startswith('cdl_'):
            result = pattern_func(open_arr, high_arr, low_arr, close_arr)
        elif request.pattern_name in ['rsi', 'sma', 'ema', 'adx']:
            result = pattern_func(close_arr, timeperiod=request.lookback_period or 14)
        elif request.pattern_name == 'macd':
            macd, signal, hist = pattern_func(close_arr, 
                                            fastperiod=12, 
                                            slowperiod=26, 
                                            signalperiod=9)
            result = macd
        elif request.pattern_name == 'stochastic':
            slowk, slowd = pattern_func(high_arr, low_arr, close_arr,
                                      fastk_period=request.lookback_period or 14)
            result = slowk
        elif request.pattern_name == 'bollinger_bands':
            upper, middle, lower = pattern_func(close_arr, 
                                              timeperiod=request.lookback_period or 20)
            result = upper - lower
        elif request.pattern_name == 'atr':
            result = pattern_func(high_arr, low_arr, close_arr,
                                timeperiod=request.lookback_period or 14)
        elif request.pattern_name == 'obv':
            result = pattern_func(close_arr, volume_arr)
            
        matches = []
        for idx, value in enumerate(result):
            if pd.notna(value) and value != 0:
                matches.append(PatternMatch(
                    pattern_name=request.pattern_name,
                    timestamp=df['datetime'].iloc[idx],
                    signal_value=float(value)
                ))
        
        return matches
        
    except Exception as e:
        raise HTTPException(status_code=500, 
                          detail=f"Error calculating pattern: {str(e)}")