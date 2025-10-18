from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///./tshirts.db")

with engine.connect() as conn:
    try:
        # product_images 테이블 생성
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                image_url VARCHAR NOT NULL,
                display_order INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        """))
        
        # 기존 products의 image_url을 product_images로 마이그레이션
        conn.execute(text("""
            INSERT INTO product_images (product_id, image_url, display_order)
            SELECT id, image_url, 0 FROM products WHERE image_url IS NOT NULL
        """))
        
        conn.commit()
        print("✅ product_images 테이블이 생성되고 기존 이미지가 마이그레이션되었습니다!")
    except Exception as e:
        print(f"❌ 오류: {e}")