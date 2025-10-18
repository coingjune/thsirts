from app.database import SessionLocal, engine
from app.models import Base, Seller, Product

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

def init_sellers():
    db = SessionLocal()
    try:
        """
        # 기존 판매자 확인
        existing_seller = db.query(Seller).first()
        if existing_seller:
            print("판매자가 이미 존재합니다.")
            return
        
        """
        """
        # 기본 판매자 생성
        seller = Seller(
            id=1,
            name="T-Style 공식스토어",
            kakaopay_link="https://qr.kakaopay.com/FUM39B8EO",
            kakaopay_qr_url="http://127.0.0.1:8000/static/qr/seller1qr.png"
        )
        db.add(seller)
        db.commit()
        """

        seller = Seller(
            id=3,
            name="T-Style 공식스토어3",
            kakaopay_link="https://qr.kakaopay.com/FUM39B8EO",
            kakaopay_qr_url="http://127.0.0.1:8000/static/qr/seller1qr.png"
        )
        db.add(seller)
        db.commit()
        
        print("기본 판매자가 생성되었습니다!")
        
        # 기존 상품들에 seller_id 업데이트
        products = db.query(Product).all()
        for product in products:
            if not product.seller_id:
                product.seller_id = 1
        db.commit()
        
        print(f"{len(products)}개 상품에 판매자가 연결되었습니다!")
        
    except Exception as e:
        print(f"에러 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_sellers()