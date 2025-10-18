from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///./tshirts.db")

with engine.connect() as conn:
    try:
        # is_active 컬럼 추가 (기본값 1 = 활성)
        conn.execute(text(
            "ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1"
        ))
        conn.commit()
        print("✅ is_active 컬럼이 추가되었습니다!")
    except Exception as e:
        print(f"❌ 오류: {e}")
        print("이미 컬럼이 존재하거나 다른 문제가 있습니다.")