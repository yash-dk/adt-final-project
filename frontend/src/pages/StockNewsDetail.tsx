import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Chip,
    Stack,
    Link,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { stocksAPI } from '../services/api';

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

export const StockNewsDetail: React.FC = () => {
    const { symbol } = useParams<{ symbol: string }>();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const theme = useTheme();

    useEffect(() => {
        const fetchNews = async () => {
            if (!symbol) return;
            
            try {
                const response = await stocksAPI.getNews(symbol);
                setNews(response.data);
                setError('');
            } catch (error) {
                console.error('Failed to fetch news:', error);
                setError('Failed to load news articles');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [symbol]);

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

    const calculateAverageSentiment = () => {
        if (news.length === 0) return null;

        const total = news.reduce((acc, article) => acc + article.sentiment_score, 0);
        return total / news.length;
    };

    const averageSentiment = calculateAverageSentiment();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Typography color="error" align="center">
                {error}
            </Typography>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {symbol} - News & Sentiment Analysis
            </Typography>

            {averageSentiment !== null && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper }}>
                    <Typography variant="h6" gutterBottom>
                        Overall Sentiment Analysis
                    </Typography>
                    <Typography variant="h4" color={
                        averageSentiment > 0.6 ? 'success.main' :
                        averageSentiment < 0.4 ? 'error.main' :
                        'text.secondary'
                    }>
                        {(averageSentiment * 100).toFixed(1)}% Positive
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Based on {news.length} articles
                    </Typography>
                </Paper>
            )}

            <Grid container spacing={3}>
                {news.map((article) => (
                    <Grid item xs={12} key={article.id}>
                        <Paper 
                            sx={{ 
                                p: 3,
                                bgcolor: theme.palette.background.paper,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3,
                                },
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                    <Link
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="inherit"
                                        underline="hover"
                                        sx={{ display: 'inline-block', mb: 1 }}
                                    >
                                        <Typography variant="h6">
                                            {article.title}
                                        </Typography>
                                    </Link>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {article.publisher} • {new Date(article.published_date).toLocaleDateString()}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`${(article.sentiment_score * 100).toFixed(1)}% ${article.sentiment_label}`}
                                    sx={{
                                        ml: 2,
                                        color: 'white',
                                        bgcolor: getSentimentColor(article.sentiment_label),
                                    }}
                                />
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};