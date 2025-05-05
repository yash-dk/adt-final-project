import os
from sqlalchemy import create_engine

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/financedb")

engine = create_engine(DB_URL, echo=False)
