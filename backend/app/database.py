import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

# 환경변수에서 DATABASE_URL 가져오기
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    # 로컬 개발 환경
    DATABASE_URL = "sqlite:///./tshirts.db"
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # 프로덕션 환경 (PostgreSQL)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    #engine = create_engine(DATABASE_URL)
    # ✅ Neon에 최적화된 설정
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,  # Serverless에 적합
        connect_args={
            "connect_timeout": 30,  # 연결 타임아웃 30초
        }
    )


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()