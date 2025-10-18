from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from pathlib import Path
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/sellers", tags=["sellers"])

# 이미지 저장 경로
UPLOAD_DIR = Path("uploads/qr_codes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/", response_model=List[schemas.SellerResponse])
async def get_sellers(db: Session = Depends(get_db)):
    """판매자 목록 조회"""
    sellers = db.query(models.Seller).all()
    return sellers

@router.get("/me", response_model=schemas.SellerResponse)
async def get_my_seller(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내 판매자 정보 조회"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=404, detail="판매자 정보가 없습니다")
    
    return seller

@router.post("/", response_model=schemas.SellerResponse)
async def create_seller(
    name: str = Form(...),
    kakaopay_link: str = Form(...),
    qr_image: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """판매자 등록"""
    # 이미 판매자인지 확인
    existing_seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if existing_seller:
        raise HTTPException(status_code=400, detail="이미 판매자로 등록되어 있습니다")
    
    # QR 이미지 저장
    qr_url = None
    if qr_image and qr_image.filename:
        file_extension = os.path.splitext(qr_image.filename)[1]
        filename = f"seller_{current_user.id}_{int(datetime.utcnow().timestamp())}{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(qr_image.file, buffer)
        
        qr_url = f"/uploads/qr_codes/{filename}"
    
    # 판매자 생성
    new_seller = models.Seller(
        user_id=current_user.id,
        name=name,
        kakaopay_link=kakaopay_link,
        kakaopay_qr_url=qr_url
    )
    
    db.add(new_seller)
    
    # 사용자를 판매자로 업데이트
    current_user.is_seller = 1
    
    db.commit()
    db.refresh(new_seller)
    
    return new_seller

@router.put("/me", response_model=schemas.SellerResponse)
async def update_my_seller(
    name: str = Form(...),
    kakaopay_link: str = Form(...),
    qr_image: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내 판매자 정보 수정"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=404, detail="판매자 정보가 없습니다")
    
    # QR 이미지 업데이트
    if qr_image and qr_image.filename:
        # 기존 이미지 삭제 (선택사항)
        file_extension = os.path.splitext(qr_image.filename)[1]
        filename = f"seller_{current_user.id}_{int(datetime.utcnow().timestamp())}{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(qr_image.file, buffer)
        
        seller.kakaopay_qr_url = f"/uploads/qr_codes/{filename}"
    
    # 정보 업데이트
    seller.name = name
    seller.kakaopay_link = kakaopay_link
    
    db.commit()
    db.refresh(seller)
    
    return seller

@router.get("/orders", response_model=List[schemas.OrderResponse])
async def get_seller_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """판매자의 주문 목록 조회"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=403, detail="판매자가 아닙니다")
    
    orders = db.query(models.Order).filter(
        models.Order.seller_id == seller.id
    ).order_by(models.Order.created_at.desc()).all()
    
    return orders

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_update: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """주문 상태 변경"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=403, detail="판매자가 아닙니다")
    
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.seller_id == seller.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다")
    
    new_status = status_update.get('status')
    if not new_status:
        raise HTTPException(status_code=400, detail="상태 값이 필요합니다")
    
    order.status = new_status
    db.commit()
    
    return {"message": "주문 상태가 변경되었습니다"}

@router.get("/{seller_id}", response_model=schemas.SellerResponse)
async def get_seller(seller_id: int, db: Session = Depends(get_db)):
    """판매자 상세 조회"""
    seller = db.query(models.Seller).filter(models.Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    return seller