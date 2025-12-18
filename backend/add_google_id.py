"""
데이터베이스에 google_id 컬럼 추가 스크립트
기존 users 테이블에 google_id와 hashed_password nullable 변경을 적용합니다.
"""
import sqlite3
import os

# 데이터베이스 경로
db_path = os.path.join(os.path.dirname(__file__), "tshirts.db")

def migrate_database():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # google_id 컬럼이 있는지 확인
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'google_id' not in columns:
            print("google_id 컬럼 추가 중...")
            cursor.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id)")
            print("✓ google_id 컬럼 추가 완료")
        else:
            print("google_id 컬럼이 이미 존재합니다.")
        
        # hashed_password가 NOT NULL인지 확인하고 변경
        # SQLite는 ALTER COLUMN을 직접 지원하지 않으므로, 새 테이블 생성 후 데이터 복사
        cursor.execute("PRAGMA table_info(users)")
        columns_info = cursor.fetchall()
        hashed_pw_info = next((col for col in columns_info if col[1] == 'hashed_password'), None)
        
        if hashed_pw_info and hashed_pw_info[3] == 1:  # NOT NULL인 경우
            print("hashed_password를 nullable로 변경 중...")
            # 기존 데이터 백업
            cursor.execute("SELECT * FROM users")
            users_data = cursor.fetchall()
            
            # 새 테이블 생성 (hashed_password nullable)
            cursor.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    email VARCHAR UNIQUE NOT NULL,
                    hashed_password VARCHAR,
                    google_id TEXT,
                    is_seller INTEGER DEFAULT 0,
                    created_at DATETIME
                )
            """)
            
            # 인덱스 생성
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users_new(email)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_google_id ON users_new(google_id)")
            
            # 데이터 복사
            for user in users_data:
                cursor.execute("""
                    INSERT INTO users_new (id, name, email, hashed_password, google_id, is_seller, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, user[:7] if len(user) >= 7 else user + (None,) * (7 - len(user)))
            
            # 기존 테이블 삭제 및 새 테이블 이름 변경
            cursor.execute("DROP TABLE users")
            cursor.execute("ALTER TABLE users_new RENAME TO users")
            
            print("✓ hashed_password nullable 변경 완료")
        else:
            print("hashed_password는 이미 nullable입니다.")
        
        conn.commit()
        print("\n✓ 데이터베이스 마이그레이션 완료!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ 오류 발생: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()

