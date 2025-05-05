import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { stocksAPI } from '../services/api';
import { StockDailyChange, VolatilityMetrics } from '../types/api';

interface StockVolatility extends StockDailyChange {
    volatility?: VolatilityMetrics;
}

export const Volatility: React.FC = () => {
    const [stocks, setStocks] = useState<StockVolatility[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();

    useEffect(() => {
        const fetchStocksWithVolatility = async () => {
            try {
                const stocksResponse = await stocksAPI.getDailyChanges();
                const stocksWithVolatility = await Promise.all(
                    stocksResponse.data.map(async (stock) => {
                        try {
                            const volatilityResponse = await stocksAPI.getVolatility(stock.symbol);
                            return {
                                ...stock,
                                volatility: volatilityResponse.data
                            };
                        } catch (error) {
                            return {
                                ...stock,
                                volatility: undefined
                            };
                        }
                    })
                );
                setStocks(stocksWithVolatility);
            } catch (error) {
                console.error('Failed to fetch stocks:', error);
            }
        };

        fetchStocksWithVolatility();
    }, []);

    const filteredStocks = stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Stock Volatility Analysis
            </Typography>

            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search stocks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Grid container spacing={2}>
                {filteredStocks.map((stock) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={stock.symbol}>
                        <Paper
                            sx={{
                                p: 2,
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4,
                                },
                                bgcolor: theme.palette.background.paper,
                                height: '100%',
                            }}
                            onClick={() => navigate(`/stocks/${stock.symbol}`)}
                        >
                            <Typography variant="h6" gutterBottom>
                                {stock.symbol}
                            </Typography>
                            
                            {stock.volatility ? (
                                <>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Daily Volatility
                                    </Typography>
                                    <Typography variant="h6" gutterBottom>
                                        {(stock.volatility.daily_volatility * 100).toFixed(2)}%
                                    </Typography>

                                    <Typography variant="subtitle2" color="text.secondary">
                                        Annualized Volatility
                                    </Typography>
                                    <Typography variant="h6" gutterBottom>
                                        {(stock.volatility.annualized_volatility * 100).toFixed(2)}%
                                    </Typography>

                                    {stock.volatility.beta !== null && (
                                        <>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Beta
                                            </Typography>
                                            <Typography variant="h6" gutterBottom>
                                                {stock.volatility.beta.toFixed(2)}
                                            </Typography>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Volatility data not available
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                {stock.price_change >= 0 ? (
                                    <TrendingUpIcon sx={{ color: 'success.main' }} />
                                ) : (
                                    <TrendingDownIcon sx={{ color: 'error.main' }} />
                                )}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: stock.price_change >= 0 ? 'success.main' : 'error.main',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {stock.price_change >= 0 ? '+' : ''}
                                    {stock.price_change.toFixed(2)} ({stock.percent_change.toFixed(2)}%)
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};