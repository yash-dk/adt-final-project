import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  TextField,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { StockChart } from '../components/StockChart';
import { stocksAPI } from '../services/api';
import { OHLCData } from '../types/api';

export const CandlestickPatternAnalysis: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [ohlc, setOhlc] = useState<OHLCData[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [lookbackPeriod, setLookbackPeriod] = useState<number>(100);
  const [patternResults, setPatternResults] = useState<{ timestamp: string; signal_value: number }[]>([]);
  const [error, setError] = useState<string>('');
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ohlcResponse, patternsResponse] = await Promise.all([
          stocksAPI.getOHLC(symbol!),
          stocksAPI.getPatterns()
        ]);
        setOhlc(ohlcResponse.data);
        setPatterns(patternsResponse.data.patterns);
      } catch (err) {
        setError('Failed to fetch initial data');
      }
    };
    fetchData();
  }, [symbol]);

  useEffect(() => {
    const analyzePattern = async () => {
      if (!selectedPattern || !symbol) return;
      
      try {
        const response = await stocksAPI.analyzePattern(symbol, selectedPattern, lookbackPeriod);
        setPatternResults(response.data);
        setError('');
      } catch (err) {
        setError('Failed to analyze pattern');
        setPatternResults([]);
      }
    };

    analyzePattern();
  }, [selectedPattern, symbol, lookbackPeriod]);

  const getMarkers = () => {
    return patternResults.map(result => ({
      time: Math.floor(new Date(result.timestamp).getTime() / 1000) as number,
      position: 'aboveBar' as const,
      color: result.signal_value > 0 ? '#4CAF50' : '#f44336',
      shape: result.signal_value > 0 ? 'arrowUp' as const : 'arrowDown' as const,
      text: selectedPattern
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {symbol} - Pattern Analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 2,
              bgcolor: theme.palette.background.paper 
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel 
                    sx={{ 
                      color: theme.palette.text.secondary 
                    }}
                  >
                    Select Pattern
                  </InputLabel>
                  <Select
                    value={selectedPattern}
                    label="Select Pattern"
                    onChange={(e) => setSelectedPattern(e.target.value)}
                  >
                    {patterns.map((pattern) => (
                      <MenuItem key={pattern} value={pattern}>
                        {pattern.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Lookback Period"
                  value={lookbackPeriod}
                  onChange={(e) => setLookbackPeriod(Math.max(1, parseInt(e.target.value) || 100))}
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: theme.palette.text.secondary,
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <StockChart 
                data={ohlc}
                height={500}
                markers={getMarkers()}
              />
            </Box>
          </Paper>
        </Grid>

        {patternResults.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
              <Typography variant="h6" gutterBottom>
                Pattern Detection Results
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pattern</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Signal Strength</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patternResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {selectedPattern.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </TableCell>
                        <TableCell>
                          {new Date(result.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{
                          color: result.signal_value > 0 ? theme.palette.success.main : theme.palette.error.main
                        }}>
                          {result.signal_value.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};