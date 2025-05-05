import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  CssBaseline, 
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  ThemeProvider,
  createTheme,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import TimelineIcon from '@mui/icons-material/Timeline';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StockList } from './pages/StockList';
import { StockDetail } from './pages/StockDetail';
import { TechnicalAnalysis } from './pages/TechnicalAnalysis';
import { CandlestickPatternAnalysis } from './pages/CandlestickPatternAnalysis';
import { Volatility } from './pages/Volatility';
import { StockNews } from './pages/StockNews';
import { StockNewsDetail } from './pages/StockNewsDetail';

const drawerWidth = 240;

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const NavigationDrawer: React.FC<{ open: boolean, onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem button onClick={() => handleNavigation('/stocks')}>
            <ListItemIcon>
              <ShowChartIcon />
            </ListItemIcon>
            <ListItemText primary="Stocks" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/news')}>
            <ListItemIcon>
              <NewspaperIcon />
            </ListItemIcon>
            <ListItemText primary="News" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/volatility')}>
            <ListItemIcon>
              <TimelineIcon />
            </ListItemIcon>
            <ListItemText primary="Volatility" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

const NavigationBar: React.FC<{
  onDrawerToggle: () => void,
  onThemeToggle: () => void,
  isDarkMode: boolean
}> = ({ onDrawerToggle, onThemeToggle, isDarkMode }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isAuthenticated && isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ADT Final Project: Financial Market Platform
        </Typography>
        <IconButton color="inherit" onClick={onThemeToggle}>
          {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        {isAuthenticated ? (
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const { isAuthenticated } = useAuth();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
        },
      }),
    [darkMode]
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <NavigationBar 
            onDrawerToggle={handleDrawerToggle}
            onThemeToggle={handleThemeToggle}
            isDarkMode={darkMode}
          />
          {isAuthenticated && (
            <NavigationDrawer 
              open={mobileOpen} 
              onClose={() => setMobileOpen(false)} 
            />
          )}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: isAuthenticated ? `calc(100% - ${drawerWidth}px)` : '100%' },
              ml: { sm: isAuthenticated ? `${drawerWidth}px` : 0 },
              mt: '64px'
            }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/stocks"
                element={
                  <PrivateRoute>
                    <StockList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/news"
                element={
                  <PrivateRoute>
                    <StockNews />
                  </PrivateRoute>
                }
              />
              <Route
                path="/stocks/:symbol/news"
                element={
                  <PrivateRoute>
                    <StockNewsDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/volatility"
                element={
                  <PrivateRoute>
                    <Volatility />
                  </PrivateRoute>
                }
              />
              <Route
                path="/stocks/:symbol"
                element={
                  <PrivateRoute>
                    <StockDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/stocks/:symbol/technical"
                element={
                  <PrivateRoute>
                    <TechnicalAnalysis />
                  </PrivateRoute>
                }
              />
              <Route
                path="/stocks/:symbol/patterns"
                element={
                  <PrivateRoute>
                    <CandlestickPatternAnalysis />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/stocks" replace />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
