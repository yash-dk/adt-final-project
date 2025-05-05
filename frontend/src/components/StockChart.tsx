import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  CandlestickSeriesOptions,
  LineSeriesOptions,
} from 'lightweight-charts';
import { Dialog, useTheme } from '@mui/material';
import { OHLCData } from '../types/api';

export type IndicatorType =
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'macd'
  | 'bollinger'
  | 'atr'
  | 'obv'
  | 'adx'
  | 'stoch'
  | 'cci'
  | 'williamsR'
  | 'parabolicSAR'
  | 'vwap';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  period?: number;
  color: string;
}

export interface StockChartProps {
  data: OHLCData[];
  width?: number;
  height?: number;
  indicators?: IndicatorConfig[];
  markers?: Array<{
    time: number;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
    text?: string;
  }>;
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  width = 1100,
  height = 300,
  indicators = [],
  markers = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi>();
  const candleRef = useRef<ISeriesApi<'Candlestick'>>();
  const indicatorRefs = useRef<Record<string, ISeriesApi<'Line'>>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();

  // Initialize chart & candlestick once
  useEffect(() => {
    const initializeChart = () => {
      if (!containerRef.current) return;
      
      // Clean up any existing chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = undefined;
        candleRef.current = undefined;
        indicatorRefs.current = {};
      }

      const chartWidth = isFullscreen ? window.innerWidth - 32 : width;
      const chartHeight = isFullscreen ? window.innerHeight - 64 : height;
      
      chartRef.current = createChart(containerRef.current, {
        width: chartWidth,
        height: chartHeight,
        layout: {
          background: { color: theme.palette.background.paper },
          textColor: theme.palette.text.primary,
        },
        grid: {
          vertLines: { color: theme.palette.divider },
          horzLines: { color: theme.palette.divider },
        },
        timeScale: { timeVisible: true },
      });

      candleRef.current = chartRef.current.addSeries(
        CandlestickSeries,
        {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        } as CandlestickSeriesOptions
      );
    };

    initializeChart();

    const handleResize = () => {
      if (isFullscreen) {
        initializeChart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = undefined;
        candleRef.current = undefined;
        indicatorRefs.current = {};
      }
    };
  }, [width, height, isFullscreen, theme.palette]);

  // Extract arrays
  const closes: number[] = data.map(d => d.close);
  const highs: number[] = data.map(d => d.high);
  const lows: number[] = data.map(d => d.low);
  const volumes: number[] = (data as any).map((d: any) => d.volume ?? 0);
  const times: UTCTimestamp[] = data.map(d => (new Date(d.trade_date).getTime() / 1000) as UTCTimestamp);

  // Helpers
  const calcSMA = useCallback((period: number): Array<number | null> =>
    closes.map((_, i) =>
      i < period - 1
        ? null
        : closes.slice(i - period + 1, i + 1).reduce((sum, v) => sum + v, 0) / period
    ), [closes]);

  const calcEMA = useCallback((period: number): Array<number | null> => {
    const k = 2 / (period + 1);
    let prev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    return closes.map((v, i) => {
      if (i < period - 1) return null;
      if (i === period - 1) return prev;
      prev = v * k + prev * (1 - k);
      return prev;
    });
  }, [closes]);

  const calcRSI = useCallback((period: number): Array<number | null> => {
    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }
    let avgG = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgL = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    return gains.map((g, i) => {
      if (i < period) return null;
      if (i > period) {
        avgG = (avgG * (period - 1) + gains[i]) / period;
        avgL = (avgL * (period - 1) + losses[i]) / period;
      }
      const rs = avgL === 0 ? Number.POSITIVE_INFINITY : avgG / avgL;
      return 100 - 100 / (1 + rs);
    }).map((v, i) => (i + 1 < closes.length ? v : null));
  }, [closes]);

  const calcMACD = useCallback(() => {
    const ema12 = calcEMA(12);
    const ema26 = calcEMA(26);
    const macdLine: Array<number | null> = ema12.map((v, i) =>
      v !== null && ema26[i] !== null ? v - ema26[i]! : null
    );
    const slice9 = macdLine.slice(0, 9).map(v => v ?? 0);
    let prev = slice9.reduce((a, b) => a + b, 0) / slice9.length;
    const signal = macdLine.map((v, i) => {
      if (i < 8) return null;
      if (i === 8) return prev;
      const cur = v ?? 0;
      prev = (cur - prev) * (2 / (9 + 1)) + prev;
      return prev;
    });
    return macdLine.map((m, i) =>
      m !== null && signal[i] !== null
        ? { macd: m, signal: signal[i]!, hist: m - signal[i]! }
        : null
    );
  }, [calcEMA]);

  const calcBollinger = useCallback((period: number, mult = 2): Array<{ upper: number; middle: number; lower: number } | null> => {
    const sma = calcSMA(period);
    return sma.map((m, i) => {
      if (m === null) return null;
      const slice = closes.slice(i - period + 1, i + 1);
      const sd = Math.sqrt(slice.reduce((a, v) => a + (v - m) ** 2, 0) / period);
      return { upper: m + mult * sd, middle: m, lower: m - mult * sd };
    });
  }, [calcSMA, closes]);

  const calcATR = useCallback((period: number): Array<number | null> => {
    const trs: number[] = highs.map((h, i) =>
      i === 0
        ? highs[0] - lows[0]
        : Math.max(
            h - lows[i],
            Math.abs(h - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
          )
    );
    let prev = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    return trs.map((t, i) => {
      if (i < period) return null;
      prev = (prev * (period - 1) + t) / period;
      return prev;
    });
  }, [highs, lows, closes]);

  const calcOBV = useCallback((): number[] => {
    return volumes.reduce<number[]>((acc, v, i) => {
      if (i === 0) {
        acc.push(v);
      } else {
        acc.push(acc[i - 1] + (closes[i] > closes[i - 1] ? v : closes[i] < closes[i - 1] ? -v : 0));
      }
      return acc;
    }, []);
  }, [volumes, closes]);

  // Update series on data or config changes
  useEffect(() => {
    if (!chartRef.current || !candleRef.current) return;

    const candleData = data.map((d, i) => {
      const matchingMarker = markers.find(m => {
        const markerDate = new Date(m.time * 1000).toISOString().split('T')[0];
        const candleDate = new Date(d.trade_date).toISOString().split('T')[0];
        return markerDate === candleDate;
      });

      return {
        time: times[i],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        ...(matchingMarker && { marker: matchingMarker })
      };
    });
    
    candleRef.current.setData(candleData);

    // Clear previous indicators
    Object.values(indicatorRefs.current).forEach(s => chartRef.current?.removeSeries(s));
    indicatorRefs.current = {};

    // Draw each indicator
    indicators.forEach(cfg => {
      let pts: Array<{ time: UTCTimestamp; value: number }> = [];

      switch (cfg.type) {
        case 'sma':
          pts = calcSMA(cfg.period!).map((v, i) =>
            v !== null ? { time: times[i], value: v } : null
          ).filter((x): x is { time: UTCTimestamp; value: number } => !!x);
          break;

        case 'ema':
          pts = calcEMA(cfg.period!).map((v, i) =>
            v !== null ? { time: times[i], value: v } : null
          ).filter((x): x is { time: UTCTimestamp; value: number } => !!x);
          break;

        case 'rsi':
          pts = calcRSI(cfg.period!).map((v, i) =>
            v !== null ? { time: times[i], value: v } : null
          ).filter((x): x is { time: UTCTimestamp; value: number } => !!x);
          break;

        case 'macd':
          pts = calcMACD().map((m, i) =>
            m !== null ? { time: times[i], value: m.macd } : null
          ).filter((x): x is { time: UTCTimestamp; value: number } => !!x);
          break;

        case 'bollinger':
          pts = calcBollinger(cfg.period!).map((b, i) =>
            b !== null ? { time: times[i], value: b.upper } : null
          ).filter((x): x is { time: UTCTimestamp; value: number } => !!x);
          break;

        case 'atr':
          pts = calcATR(cfg.period!).map((v, i) =>
            v !== null ? { time: times[i], value: v } : null
          ).filter((x): x is { time: UTCTimestamp; value: number } => !!x);
          break;

        case 'obv':
          pts = calcOBV().map((v, i) => ({ time: times[i], value: v }));
          break;
      }

      const s = chartRef.current!.addSeries(
        LineSeries,
        { lineWidth: 2, color: cfg.color } as LineSeriesOptions
      );
      s.setData(pts);
      indicatorRefs.current[cfg.id] = s;
    });

    chartRef.current.timeScale().fitContent();
  }, [data, indicators, markers, times, calcSMA, calcEMA, calcRSI, calcMACD, calcBollinger, calcATR, calcOBV]);

  const chartContent = (
    <div style={{ position: 'relative', width: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: isFullscreen ? '100vh' : height }} />
    </div>
  );

  return (
    <>
      {!isFullscreen && chartContent}
      <Dialog
        fullScreen
        open={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      >
        {chartContent}
      </Dialog>
    </>
  );
};
