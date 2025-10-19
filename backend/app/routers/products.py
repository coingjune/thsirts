from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import cloudinary.uploader
import json
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("/categories", response_model=dict)
async def get_categories():
    """카테고리 목록 조회"""
    categories = {
        "미분류": [],
        "상의": ["반팔", "후드", "맨투맨/스웨트"],
        "바지": ["데님팬츠", "숏팬츠"]
    }
    return categories

@router.get("/my/products", response_model=List[schemas.ProductResponse])
async def get_my_products(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내가 등록한 상품 목록"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=403, detail="판매자가 아닙니다")
    
    products = db.query(models.Product).filter(
        models.Product.seller_id == seller.id,
    ).all()
    
    return products

@router.get("/", response_model=List[schemas.ProductResponse])
async def get_products(db: Session = Depends(get_db)):
    """전체 상품 조회"""
    products = db.query(models.Product).filter(models.Product.is_active == 1).all()
    return products

@router.get("/{product_id}", response_model=schemas.ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=schemas.ProductResponse)
async def create_product(
    name: str = Form(...),
    price: str = Form(...),
    description: str = Form(...),
    category_main: str = Form("미분류"),
    category_sub: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """상품 등록 (판매자만 가능) - Cloudinary"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=403, detail="판매자만 상품을 등록할 수 있습니다")
    
    if len(images) > 5:
        raise HTTPException(status_code=400, detail="이미지는 최대 5개까지 업로드 가능합니다")
    
    if len(images) == 0:
        raise HTTPException(status_code=400, detail="최소 1개의 이미지가 필요합니다")
    
    # 타임스탬프 한 번만 생성
    timestamp = int(datetime.utcnow().timestamp())
    
    # Cloudinary에 이미지 업로드
    saved_image_urls = []
    try:
        for idx, image in enumerate(images):
            # 파일 포인터를 처음으로 되돌림
            await image.seek(0)
            
            # Cloudinary에 업로드
            result = cloudinary.uploader.upload(
                image.file,
                folder=f"tshirts/products/seller_{seller.id}",
                public_id=f"product_{timestamp}_{idx}",
                resource_type="auto"
            )
            
            # Cloudinary URL 저장
            saved_image_urls.append(result['secure_url'])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 업로드 실패: {str(e)}")
    
    # 첫 번째 이미지를 메인 이미지로
    main_image_url = saved_image_urls[0]
    
    # 상품 생성
    new_product = models.Product(
        name=name,
        price=price,
        description=description,
        image_url=main_image_url,
        seller_id=seller.id,
        category_main=category_main,
        category_sub=category_sub,
        is_active=1
    )
    db.add(new_product)
    db.flush()
    
    # ProductImage 테이블에 저장
    for idx, image_url in enumerate(saved_image_urls):
        product_image = models.ProductImage(
            product_id=new_product.id,
            image_url=image_url,
            display_order=idx
        )
        db.add(product_image)
    
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
async def update_product(
    product_id: int,
    name: str = Form(...),
    price: str = Form(...),
    description: str = Form(...),
    category_main: str = Form("미분류"),
    category_sub: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    slot_info: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """상품 수정 (본인 상품만) - Cloudinary"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=403, detail="판매자만 수정할 수 있습니다")
    
    existing_product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.seller_id == seller.id
    ).first()
    
    if not existing_product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없거나 권한이 없습니다")
    
    # 슬롯 정보가 있는 경우 (수정 모드)
    if slot_info:
        try:
            slots = json.loads(slot_info)
        except:
            slots = []
        
        # 기존 이미지 삭제
        db.query(models.ProductImage).filter(
            models.ProductImage.product_id == product_id
        ).delete()
        
        # 타임스탬프 생성
        timestamp = int(datetime.utcnow().timestamp())
        
        # 새 파일들을 Cloudinary에 업로드
        new_image_urls = []
        if images and len(images) > 0 and images[0].filename:
            try:
                for idx, image in enumerate(images):
                    await image.seek(0)
                    
                    # Cloudinary에 업로드
                    result = cloudinary.uploader.upload(
                        image.file,
                        folder=f"tshirts/products/seller_{seller.id}",
                        public_id=f"product_{product_id}_{timestamp}_{idx}",
                        resource_type="auto"
                    )
                    
                    new_image_urls.append(result['secure_url'])
                    
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"이미지 업로드 실패: {str(e)}")
        
        # 슬롯 순서대로 최종 이미지 리스트 구성
        final_image_urls = []
        new_file_counter = 0
        
        for slot in slots:
            if slot['isNew']:
                # 새 파일
                if new_file_counter < len(new_image_urls):
                    final_image_urls.append(new_image_urls[new_file_counter])
                    new_file_counter += 1
            else:
                # 기존 이미지 유지
                final_image_urls.append(slot['url'])
        
        if len(final_image_urls) > 0:
            # 첫 번째 이미지를 메인으로
            existing_product.image_url = final_image_urls[0]
            
            # ProductImage 테이블에 저장
            for idx, image_url in enumerate(final_image_urls):
                product_image = models.ProductImage(
                    product_id=product_id,
                    image_url=image_url,
                    display_order=idx
                )
                db.add(product_image)
    
    # 다른 필드 업데이트
    existing_product.name = name
    existing_product.price = price
    existing_product.description = description
    existing_product.category_main = category_main
    existing_product.category_sub = category_sub
    existing_product.is_active = 1
    
    db.commit()
    db.refresh(existing_product)
    return existing_product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """상품 삭제 (본인 상품만)"""
    seller = db.query(models.Seller).filter(
        models.Seller.user_id == current_user.id
    ).first()
    
    if not seller:
        raise HTTPException(status_code=403, detail="판매자만 삭제할 수 있습니다")
    
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.seller_id == seller.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없거나 권한이 없습니다")
    
    # DB에서 유지, 대신 비활성화 처리
    product.is_active = 0
    db.commit()
    return {"message": "상품이 삭제되었습니다"}