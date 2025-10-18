from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///./tshirts.db")

with engine.connect() as conn:
    try:
        # category_main 컬럼 추가
        conn.execute(text(
            "ALTER TABLE products ADD COLUMN category_main VARCHAR DEFAULT '미분류'"
        ))
        # category_sub 컬럼 추가
        conn.execute(text(
            "ALTER TABLE products ADD COLUMN category_sub VARCHAR"
        ))
        conn.commit()
        print("✅ 카테고리 컬럼이 추가되었습니다!")
    except Exception as e:
        print(f"❌ 오류: {e}")