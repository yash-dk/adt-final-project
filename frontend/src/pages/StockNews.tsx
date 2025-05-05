import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    Chip,
    Stack,
    useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { stocksAPI } from '../services/api';
import { StockDailyChange } from '../types/api';

interface NewsArticle {
    id: number;
    stock_id: number;
    title: string;
    publisher: string;
    link: string;
    published_date: string;
    sentiment_score: number;
    sentiment_label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    cached_at: string;
}

export const StockNews: React.FC = () => {
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

    const getSentimentColor = (sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL') => {
        switch (sentiment) {
            case 'POSITIVE':
                return theme.palette.success.main;
            case 'NEGATIVE':
                return theme.palette.error.main;
            default:
                return theme.palette.text.secondary;
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Stock News
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
                    <Grid item xs={12} sm={6} md={4} lg={3} key={stock.symbol}>
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
                            onClick={() => navigate(`/stocks/${stock.symbol}/news`)}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="h6">
                                    {stock.symbol}
                                </Typography>
                                <Typography variant="h6">
                                    ${stock.latest_price.toFixed(2)}
                                </Typography>
                            </Stack>

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
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}