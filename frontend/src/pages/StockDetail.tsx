import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Grid,
    Paper,
    Typography,
    Tabs,
    Tab,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Button,
    useTheme,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { stocksAPI } from '../services/api';
import { StockChart } from '../components/StockChart';
import { OHLCData, FinancialStatement, EarningsData, VolatilityMetrics } from '../types/api';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index} role="tabpanel">
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
);

// Company info field groups
const companyInfoGroups = {
    general: ['name', 'description', 'sector', 'industry', 'employees'],
    trading: ['exchange', 'currency', 'marketCap', 'sharesOutstanding'],
    contact: ['address', 'phone', 'website'],
    dates: ['ipoDate', 'fiscalYearEnd']
};

export const StockDetail: React.FC = () => {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const [ohlcData, setOHLCData] = useState<OHLCData[]>([]);
    const [info, setInfo] = useState<any>(null);
    const [income, setIncome] = useState<FinancialStatement[]>([]);
    const [balance, setBalance] = useState<FinancialStatement[]>([]);
    const [cashflow, setCashflow] = useState<FinancialStatement[]>([]);
    const [earnings, setEarnings] = useState<EarningsData[]>([]);
    const [volatility, setVolatility] = useState<VolatilityMetrics | null>(null);
    const [mainTab, setMainTab] = useState(0);
    const [infoSubTab, setInfoSubTab] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const theme = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            if (!symbol) return;

            try {
                const [
                    ohlcResponse,
                    infoResponse,
                    incomeResponse,
                    balanceResponse,
                    cashflowResponse,
                    earningsResponse,
                    volatilityResponse
                ] = await Promise.all([
                    stocksAPI.getOHLC(symbol),
                    stocksAPI.getInfo(symbol),
                    stocksAPI.getIncome(symbol),
                    stocksAPI.getBalance(symbol),
                    stocksAPI.getCashflow(symbol),
                    stocksAPI.getEarnings(symbol),
                    stocksAPI.getVolatility(symbol)
                ]);

                setOHLCData(ohlcResponse.data);
                setInfo(infoResponse.data.data);
                setIncome(incomeResponse.data);
                setBalance(balanceResponse.data);
                setCashflow(cashflowResponse.data);
                setEarnings(earningsResponse.data);
                setVolatility(volatilityResponse.data);
            } catch (error) {
                console.error('Failed to fetch stock data:', error);
            }
        };

        fetchData();
    }, [symbol]);

    const handleMainTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setMainTab(newValue);
    };

    const handleInfoSubTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setInfoSubTab(newValue);
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const formatValue = (value: any) => {
        if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
        return String(value);
    };

    const renderCompanyInfoGroup = (groupName: string, fields: string[]) => {
        if (!info) return null;
        
        const fieldsWithValues = fields.filter(field => 
            info[field] !== undefined && 
            info[field] !== null && 
            info[field] !== ''
        );

        if (fieldsWithValues.length === 0) return null;

        return (
            <TableContainer>
                <Table>
                    <TableBody>
                        {fieldsWithValues.map(field => (
                            <TableRow key={field}>
                                <TableCell component="th" scope="row">
                                    {field.replace(/([A-Z])/g, ' $1').trim()}
                                </TableCell>
                                <TableCell>{formatValue(info[field])}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderFinancialTable = (data: FinancialStatement[]) => {
        if (!data.length || !data[0]?.data) return null;

        const nonEmptyFields = Object.entries(data[0].data)
            .filter(([_, value]) => value !== null && value !== undefined && value !== '');

        if (nonEmptyFields.length === 0) return null;

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        {nonEmptyFields.map(([key, value]) => (
                            <TableRow key={key}>
                                <TableCell component="th" scope="row">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </TableCell>
                                <TableCell align="right">
                                    {formatValue(value)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderVolatilityMetrics = () => {
        if (!volatility) return null;

        const metrics = [
            {
                title: 'Daily Volatility',
                value: `${(volatility.daily_volatility * 100).toFixed(2)}%`,
                tooltip: 'Measures the daily price variation'
            },
            {
                title: 'Annualized Volatility',
                value: `${(volatility.annualized_volatility * 100).toFixed(2)}%`,
                tooltip: 'Daily volatility projected to annual basis'
            },
            {
                title: 'Relative Volatility',
                value: volatility.relative_volatility ? `${volatility.relative_volatility.toFixed(2)}x` : 'N/A',
                tooltip: 'Stock volatility compared to S&P 500'
            },
            {
                title: 'Beta',
                value: volatility.beta ? volatility.beta.toFixed(2) : 'N/A',
                tooltip: 'Measure of systematic risk relative to the market'
            },
            {
                title: 'R-squared',
                value: volatility.r_squared ? `${(volatility.r_squared * 100).toFixed(2)}%` : 'N/A',
                tooltip: 'Goodness of fit of beta calculation'
            },
            {
                title: 'Last Updated',
                value: new Date(volatility.calculation_date).toLocaleDateString(),
                tooltip: 'Date when metrics were last calculated'
            }
        ];

        return (
            <Grid container spacing={2}>
                {metrics.map((metric) => (
                    <Grid item xs={12} sm={6} md={4} key={metric.title}>
                        <Paper
                            sx={{
                                p: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                bgcolor: theme.palette.background.paper,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4,
                                }
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                color="text.secondary"
                                gutterBottom
                                title={metric.tooltip}
                                sx={{ cursor: 'help' }}
                            >
                                {metric.title}
                            </Typography>
                            <Typography variant="h4" component="div">
                                {metric.value}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Box>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} md="auto">
                    <Typography variant="h4">
                        {symbol} - {info?.name}
                    </Typography>
                </Grid>
                <Grid item xs={12} md="auto">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ShowChartIcon />}
                        onClick={() => navigate(`/stocks/${symbol}/technical`)}
                        sx={{ mr: 1 }}
                    >
                        Technical Analysis
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<ShowChartIcon />}
                        onClick={() => navigate(`/stocks/${symbol}/patterns`)}
                    >
                        Pattern Analysis
                    </Button>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, width: '100%', minHeight: '600px' }}>
                        <StockChart data={ohlcData} height={550} />
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ width: '100%' }}>
                        <Tabs 
                            value={mainTab} 
                            onChange={handleMainTabChange} 
                            centered
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                bgcolor: theme.palette.background.paper,
                            }}
                        >
                            <Tab label="Company Info" />
                            <Tab label="Financials" />
                            <Tab label="Earnings" />
                            <Tab label="Risk Metrics" />
                        </Tabs>

                        <TabPanel value={mainTab} index={0}>
                            <Box sx={{ 
                                borderBottom: 1, 
                                borderColor: 'divider',
                                bgcolor: theme.palette.background.paper 
                            }}>
                                <Tabs value={infoSubTab} onChange={handleInfoSubTabChange}>
                                    <Tab label="General" />
                                    <Tab label="Trading" />
                                    <Tab label="Contact" />
                                </Tabs>
                            </Box>
                            <TabPanel value={infoSubTab} index={0}>
                                {renderCompanyInfoGroup('general', companyInfoGroups.general)}
                            </TabPanel>
                            <TabPanel value={infoSubTab} index={1}>
                                {renderCompanyInfoGroup('trading', companyInfoGroups.trading)}
                            </TabPanel>
                            <TabPanel value={infoSubTab} index={2}>
                                {renderCompanyInfoGroup('contact', companyInfoGroups.contact)}
                            </TabPanel>
                            <TabPanel value={infoSubTab} index={3}>
                                {renderCompanyInfoGroup('dates', companyInfoGroups.dates)}
                            </TabPanel>
                        </TabPanel>

                        <TabPanel value={mainTab} index={1}>
                            <Box sx={{ 
                                borderBottom: 1, 
                                borderColor: 'divider',
                                bgcolor: theme.palette.background.paper 
                            }}>
                                <Tabs value={tabValue} onChange={handleTabChange}>
                                    <Tab label="Income Statement" />
                                    <Tab label="Balance Sheet" />
                                </Tabs>
                            </Box>
                            <TabPanel value={tabValue} index={0}>
                                {renderFinancialTable(income)}
                            </TabPanel>
                            <TabPanel value={tabValue} index={1}>
                                {renderFinancialTable(balance)}
                            </TabPanel>
                            <TabPanel value={tabValue} index={2}>
                                {renderFinancialTable(cashflow)}
                            </TabPanel>
                        </TabPanel>

                        <TabPanel value={mainTab} index={2}>
                            {earnings.length > 0 && (
                                <TableContainer>
                                    <Table>
                                        <TableBody>
                                            {earnings.map((earning, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{earning.period}</TableCell>
                                                    <TableCell>
                                                        EPS: ${earning.eps.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        Revenue: ${(earning.revenue / 1e6).toFixed(2)}M
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </TabPanel>

                        <TabPanel value={mainTab} index={3}>
                            <Typography variant="h6" gutterBottom>
                                Volatility Analysis
                            </Typography>
                            {renderVolatilityMetrics()}
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};