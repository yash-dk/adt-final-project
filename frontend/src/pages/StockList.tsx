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
import { StockDailyChange } from '../types/api';

export const StockList: React.FC = () => {
    const [stocks, setStocks] = useState<StockDailyChange[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const response = await stocksAPI.getDailyChanges();
                setStocks(response.data);
            } catch (error) {
                console.error('Failed to fetch stocks:', error);
            }
        };

        fetchStocks();
    }, []);

    const filteredStocks = stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Stock List
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
                            <Typography variant="h5" gutterBottom>
                                ${stock.latest_price.toFixed(2)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {stock.price_change >= 0 ? (
                                    <TrendingUpIcon sx={{ color: 'success.main' }} />
                                ) : (
                                    <TrendingDownIcon sx={{ color: 'error.main' }} />
                                )}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: stock.price_change >= 0 ? 'success.main' : 'error.main',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {stock.price_change >= 0 ? '+' : ''}
                                    {stock.price_change.toFixed(2)} ({stock.percent_change.toFixed(2)}%)
                                </Typography>
                            </Box>
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                Last updated: {new Date(stock.latest_date).toLocaleDateString()}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};