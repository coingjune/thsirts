from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["cart"])

@router.get("/", response_model=List[schemas.CartItemResponse])
async def get_cart(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 사용자의 장바구니 조회"""
    cart_items = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id
    ).all()

    print(current_user.is_seller)
    print(current_user.id)


    return cart_items

@router.post("/", response_model=schemas.CartItemResponse)
async def add_to_cart(
    item: schemas.CartItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니에 상품 추가"""
    # 상품이 존재하는지 확인
    product = db.query(models.Product).filter(
        models.Product.id == item.product_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # 이미 장바구니에 있는지 확인
    existing_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == item.product_id
    ).first()
    
    if existing_item:
        # 이미 있으면 수량만 증가
        existing_item.quantity += item.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    
    # 새로운 장바구니 아이템 생성
    new_item = models.CartItem(
        user_id=current_user.id,
        product_id=item.product_id,
        quantity=item.quantity
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/{item_id}")
async def remove_from_cart(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니에서 상품 제거"""
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}

@router.put("/{item_id}")
async def update_cart_quantity(
    item_id: int,
    quantity: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니 상품 수량 변경"""
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item
