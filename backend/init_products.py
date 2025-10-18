from app.database import SessionLocal, engine
from app.models import Base, Product, Seller  # Seller 모델 import

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# 초기 상품 데이터
products_data = [
    {
        "id": 1,
        "name": "클래식 코튼 크루넥 티셔츠",
        "price": "25,000원",
        "description": "부드러운 100% 프리미엄 코튼으로 제작되어 매일 입기에 완벽한 편안함을 제공합니다. 어떤 옷과도 잘 어울리는 클래식한 디자인입니다.",
        "image_url": "https://picsum.photos/seed/tshirt1/800/800",
        "seller_id": 1,
        "seller": {
        "id": 1,
        "name": "T-Style 공식스토어",
        "kakaopay_link": "https://qr.kakaopay.com/FUM39B8EO",
        "kakaopay_qr_url": "http://127.0.0.1:8000/static/qr/seller1qr.png"
            }
    },
    {
        "id": 2,
        "name": "오버사이즈 그래픽 티셔츠",
        "price": "35,000원",
        "description": "트렌디한 오버사이즈 핏과 독특한 전면 그래픽이 특징입니다. 스트리트 패션을 완성하는 필수 아이템입니다.",
        "image_url": "https://picsum.photos/seed/tshirt2/800/800",
        "seller_id": 1,
        "seller": {
        "id": 1,
        "name": "T-Style 공식스토어",
        "kakaopay_link": "https://qr.kakaopay.com/FUM39B8EO",
        "kakaopay_qr_url": "http://127.0.0.1:8000/static/qr/seller1qr.png"
        }
    },
    {
        "id": 3,
        "name": "슬림핏 기능성 티셔츠",
        "price": "30,000원",
        "description": "땀을 빠르게 흡수하고 건조시키는 기능성 원단으로 제작되었습니다. 운동이나 야외 활동 시 쾌적함을 유지해줍니다.",
        "image_url": "https://picsum.photos/seed/tshirt3/800/800",
        "seller_id": 1,
        "seller": {
        "id": 1,
        "name": "T-Style 공식스토어",
        "kakaopay_link": "https://qr.kakaopay.com/FUM39B8EO",
        "kakaopay_qr_url": "http://127.0.0.1:8000/static/qr/seller1qr.png"
        }
    },
    {
        "id": 4,
        "name": "빈티지 워싱 포켓 티셔츠",
        "price": "32,000원",
        "description": "자연스러운 워싱 처리로 빈티지한 감성을 더했으며, 가슴 부분의 포켓이 실용적인 포인트가 됩니다.",
        "image_url": "https://picsum.photos/seed/tshirt4/800/800",
        "seller_id": 1,
        "seller": {
        "id": 1,
        "name": "T-Style 공식스토어",
        "kakaopay_link": "https://qr.kakaopay.com/FUM39B8EO",
        "kakaopay_qr_url": "http://127.0.0.1:8000/static/qr/seller1qr.png"
        }
    },
    {
        "id": 5,
        "name": "프리미엄 린넨 혼방 티셔츠",
        "price": "40,000원",
        "description": "고급 린넨과 코튼 혼방 소재로 시원하고 가벼운 착용감을 선사합니다. 여름철에도 쾌적하게 스타일을 연출할 수 있습니다.",
        "image_url": "https://picsum.photos/seed/tshirt5/800/800",
        "seller_id": 1,
        "seller": {
        "id": 1,
        "name": "T-Style 공식스토어",
        "kakaopay_link": "https://qr.kakaopay.com/FUM39B8EO",
        "kakaopay_qr_url": "http://127.0.0.1:8000/static/qr/seller1qr.png"
        }
    },
    {
        "id": 6,
        "name": "베이직 롱슬리브 티셔츠",
        "price": "28,000원",
        "description": "간절기에 유용한 베이직한 디자인의 롱슬리브 티셔츠입니다. 단독으로 입거나 레이어드하여 다양하게 활용할 수 있습니다.",
        "image_url": "https://picsum.photos/seed/tshirt6/800/800",
        "seller_id": 1,
        "seller": {
        "id": 1,
        "name": "T-Style 공식스토어",
        "kakaopay_link": "https://qr.kakaopay.com/FUM39B8EO",
        "kakaopay_qr_url": "http://127.0.0.1:8000/static/qr/seller1qr.png"
        }
    },
    {
        "id": 7,
        "name": "베이직 롱슬리브 티셔츠2",
        "price": "28,000원",
        "description": "간절기에 유용한 베이직한 디자인의 롱슬리브 티셔츠입니다. 단독으로 입거나 레이어드하여 다양하게 활용할 수 있습니다.",
        "image_url": "https://picsum.photos/seed/tshirt6/800/800",
        "seller_id": 3,
        "seller": {
        "id": 3,
        "name": "T-Style 공식스토어3",
        "kakaopay_link": "https://qr.kakaopay.com/FUM39B8EO",
        "kakaopay_qr_url": "http://127.0.0.1:8000/static/qr/seller1qr.png"
        }
    }
]

def init_products():
    db = SessionLocal()
    try:
        # 기존 상품이 있는지 확인
        existing_products = db.query(Product).count()
        if existing_products > 0:
            print(f"이미 {existing_products}개의 상품이 있습니다.")
            return
        
        # 상품 데이터 추가
        for product_data in products_data:
            seller_data = product_data.pop("seller", None)  # seller dict 제거
            
            # Product 객체 생성
            product = Product(**product_data)
            
            # seller dict가 있으면 DB에서 Seller 객체 조회 후 연결
            if seller_data:
                seller = db.query(Seller).get(seller_data["id"])
                if seller:
                    product.seller = seller
                else:
                    print(f"경고: seller_id {seller_data['id']}에 해당하는 Seller가 DB에 없습니다.")
            
            db.add(product)
        
        db.commit()
        print(f"{len(products_data)}개의 상품이 성공적으로 추가되었습니다!")
    except Exception as e:
        print(f"에러 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_products()