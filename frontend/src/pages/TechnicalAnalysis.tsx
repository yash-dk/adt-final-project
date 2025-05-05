import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { StockChart, IndicatorConfig, IndicatorType } from '../components/StockChart';
import { stocksAPI } from '../services/api';
import { OHLCData } from '../types/api';

const allTypes: IndicatorType[] = [
  'sma','ema','rsi','macd','bollinger','atr','obv','adx','stoch','cci','williamsR','parabolicSAR','vwap'
];

export const TechnicalAnalysis: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [ohlc, setOhlc] = useState<OHLCData[]>([]);
  const [configs, setConfigs] = useState<IndicatorConfig[]>([]);
  const theme = useTheme();

  useEffect(() => {
    if (!symbol) return;
    stocksAPI.getOHLC(symbol).then(resp => setOhlc(resp.data));
  }, [symbol]);

  const addIndicator = () => {
    setConfigs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'sma',
        period: 14,
        color: '#'+Math.floor(Math.random()*0xffffff).toString(16),
      },
    ]);
  };

  const updateConfig = (id: string, key: keyof IndicatorConfig, value: any) => {
    setConfigs(prev =>
      prev.map(c => (c.id === id ? { ...c, [key]: value } : c))
    );
  };

  const removeConfig = (id: string) => {
    setConfigs(prev => prev.filter(c => c.id !== id));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {symbol} - Technical Analysis
      </Typography>

      <Button 
        variant="contained" 
        onClick={addIndicator} 
        sx={{ mb: 2 }}
      >
        + Add Indicator
      </Button>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {configs.map(cfg => (
          <Grid item xs={12} md={6} lg={4} key={cfg.id}>
            <Paper 
              sx={{ 
                p: 2, 
                position: 'relative',
                bgcolor: theme.palette.background.paper,
              }}
            >
              <IconButton
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 4, 
                  right: 4,
                  color: theme.palette.text.secondary,
                }}
                onClick={() => removeConfig(cfg.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>

              <TextField
                select
                label="Type"
                value={cfg.type}
                onChange={e => updateConfig(cfg.id, 'type', e.target.value)}
                fullWidth
                margin="dense"
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                  },
                }}
              >
                {allTypes.map(t => (
                  <MenuItem key={t} value={t}>
                    {t.toUpperCase()}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="number"
                label="Period"
                value={cfg.period}
                onChange={e => updateConfig(cfg.id, 'period', Number(e.target.value))}
                fullWidth
                margin="dense"
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                  },
                }}
              />

              <TextField
                type="color"
                label="Color"
                value={cfg.color}
                onChange={e => updateConfig(cfg.id, 'color', e.target.value)}
                fullWidth
                margin="dense"
                sx={{ 
                  height: 56,
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                  },
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper 
        sx={{ 
          p: 2, 
          minHeight: '600px',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <StockChart data={ohlc} indicators={configs} height={550} />
      </Paper>
    </Box>
  );
};
