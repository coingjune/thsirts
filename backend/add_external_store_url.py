"""
products 테이블에 external_store_url 컬럼을 추가하는 스크립트
로컬 SQLite(tshirts.db)에만 적용됩니다.
Neon(PostgreSQL)에는 별도의 SQL을 실행해야 합니다.
"""

import sqlite3
import os


DB_PATH = os.path.join(os.path.dirname(__file__), "tshirts.db")


def migrate_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # products 테이블 컬럼 정보 조회
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]

        # external_store_url 컬럼이 없으면 추가
        if "external_store_url" not in columns:
            print("external_store_url 컬럼 추가 중...")
            cursor.execute(
                "ALTER TABLE products ADD COLUMN external_store_url TEXT"
            )
            print("✓ external_store_url 컬럼 추가 완료")
        else:
            print("external_store_url 컬럼이 이미 존재합니다.")

        conn.commit()
        print("\n✓ products 테이블 마이그레이션 완료!")

    except Exception as e:
        conn.rollback()
        print(f"❌ 오류 발생: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_database()


