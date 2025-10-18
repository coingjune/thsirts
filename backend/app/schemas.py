from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# 회원가입 요청
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

# 로그인 요청
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 사용자 응답 (비밀번호 제외)
class UserResponse(BaseModel):
    name: str
    email: str
    is_seller: Optional[int] = 0

    class Config:
        from_attributes = True

# 토큰 응답
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# 판매자 생성 요청
class SellerCreate(BaseModel):
    name: str
    kakaopay_link: str

# 판매자 응답
class SellerResponse(BaseModel):
    id: int
    user_id: int
    name: str
    kakaopay_link: str
    kakaopay_qr_url: Optional[str] = None

    class Config:
        from_attributes = True


# ProductImage 스키마 추가
class ProductImageResponse(BaseModel):
    id: int
    image_url: str
    display_order: int
    
    class Config:
        from_attributes = True


# 상품 생성 요청
class ProductCreate(BaseModel):
    name: str
    price: str
    description: str
    image_url: str
    category_main: Optional[str] = "미분류"
    category_sub: Optional[str] = None
    #seller_id: int

# 상품 응답
class ProductResponse(BaseModel):
    id: int
    name: str
    price: str
    description: str
    image_url: str
    seller_id: int
    category_main: Optional[str] = "미분류"
    category_sub: Optional[str] = None
    is_active: int
    images: List[ProductImageResponse] = []  # 추가
    seller: Optional[SellerResponse] = None

    class Config:
        from_attributes = True

# 장바구니 추가 요청
class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

# 장바구니 아이템 응답
class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

# 주문 아이템 생성
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

# 주문 생성 요청
class OrderCreate(BaseModel):
    seller_id: int
    recipient_name: str
    postal_code: str
    address: str
    phone: str
    delivery_request: Optional[str] = None
    items: List[OrderItemCreate]

# 주문 아이템 응답
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_order: str
    product: ProductResponse

    class Config:
        from_attributes = True

# 주문 응답
class OrderResponse(BaseModel):
    id: int
    seller_id: int
    recipient_name: str
    postal_code: str
    address: str
    phone: str
    delivery_request: Optional[str] = None
    status: str
    created_at: datetime
    seller: SellerResponse
    order_items: List[OrderItemResponse]

    class Config:
        from_attributes = True