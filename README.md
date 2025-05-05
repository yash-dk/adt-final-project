# Financial Market Insights and Analysis Platform

## Description
This is out ADT project that provides real-time stock data, technical analysis, candlestick pattern recognition, volatility tracking, and news integration. The system consists of a FastAPI backend and React TypeScript frontend.

## Features
- Real-time stock data tracking
- Technical analysis tools
- Candlestick pattern recognition
- Stock news aggregation with sentiment
- User authentication
- Volatility analysis
- Interactive stock charts

## Tech Stack
- **Backend**: Python FastAPI
- **Frontend**: React + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT

## Project Structure
```
├── backend/
│   ├── api/         # FastAPI application
│   └── jobs/        # Background data collection jobs
├── frontend/        # React TypeScript frontend
└── financedb-bkp-2.sql  # Database backup
```

## Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL

## Setup Instructions

### Database Setup
1. Create a PostgreSQL database:
```bash
createdb financedb
```

2. Import the database backup:
```bash
psql financedb < financedb-bkp-2.sql
```

### Backend Setup
1. Navigate to the backend API directory:
```bash
cd backend/api
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create .env file in backend/api with:
```
DATABASE_URL=postgresql://postgres:root@localhost:5432/financedb
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

5. Run the API server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at http://localhost:3000
