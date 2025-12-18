from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # 구글 로그인 사용자는 비밀번호 없음
    google_id = Column(String, nullable=True, unique=True, index=True)  # 구글 사용자 ID
    is_seller = Column(Integer, default=0)  # 0: 일반 사용자, 1: 판매자
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    cart_items = relationship("CartItem", back_populates="user")
    orders = relationship("Order", back_populates="user")
    seller = relationship("Seller", back_populates="user", uselist=False)

class Seller(Base):
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String, nullable=False)
    kakaopay_link = Column(String, nullable=False)
    kakaopay_qr_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    user = relationship("User", back_populates="seller")
    products = relationship("Product", back_populates="seller")

class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계
    product = relationship("Product", back_populates="images")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=False)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False)
    category_main = Column(String, nullable=False, default="미분류")  # 대분류
    category_sub = Column(String, nullable=True)  # 소분류
    # 외부 스토어 링크 (예: 스마트스토어, 11번가 등)
    # - API 레벨에서는 필수로 받되, 기존 데이터 호환을 위해 DB에서는 nullable 허용
    external_store_url = Column(String, nullable=True)
    is_active = Column(Integer, default=1)  # 추가: 1=활성, 0=비활성
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    seller = relationship("Seller", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")

class OrderStatus(str, enum.Enum):
    CANCELLED = "cancelled"  # 주문취소
    REFUND_REQUESTED = "refund_requested"  # 환불요청
    REFUND_COMPLETED = "refund_completed"  # 환불완료
    PENDING = "pending"  # 주문완료-입금확인중
    PAID = "paid"  # 제작대기중
    PREPARING = "preparing"  # 제작중
    READY_TO_SHIP = "ready_to_ship"  # 배송대기중
    SHIPPING = "shipping"  # 배송중
    DELIVERED = "delivered"  # 배송완료

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False)
    
    # 배송 정보
    recipient_name = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    address = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    delivery_request = Column(Text, nullable=True)
    
    # 주문 상태
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 설정
    user = relationship("User", back_populates="orders")
    seller = relationship("Seller")
    order_items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_order = Column(String, nullable=False)  # 주문 당시 가격
    
    # 관계 설정
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")