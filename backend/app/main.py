from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .database import engine, Base
from .routers import auth, products, cart, orders, sellers

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="T-Shirts API")

# 업로드 폴더 생성
upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok=True)

# 정적 파일 서빙 (업로드된 이미지)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS 설정 (프론트엔드와 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://tshirts-shop.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(sellers.router)

@app.get("/")
async def root():
    return {"message": "T-Shirts API is running!"}