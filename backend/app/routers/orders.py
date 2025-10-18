from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("/", response_model=schemas.OrderResponse)
async def create_order(
    order: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """주문 생성"""
    # 판매자 확인
    seller = db.query(models.Seller).filter(models.Seller.id == order.seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    # 주문 생성
    new_order = models.Order(
        user_id=current_user.id,
        seller_id=order.seller_id,
        recipient_name=order.recipient_name,
        postal_code=order.postal_code,
        address=order.address,
        phone=order.phone,
        delivery_request=order.delivery_request,
        status=models.OrderStatus.PENDING
    )
    db.add(new_order)
    db.flush()  # ID 생성을 위해
    
    # 주문 아이템 생성
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_order=product.price
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(new_order)
    
    return new_order

@router.get("/", response_model=List[schemas.OrderResponse])
async def get_my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내 주문 목록 조회"""
    orders = db.query(models.Order).filter(
        models.Order.user_id == current_user.id
    ).order_by(models.Order.created_at.desc()).all()
    return orders

@router.get("/{order_id}", response_model=schemas.OrderResponse)
async def get_order(
    order_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """주문 상세 조회"""
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order