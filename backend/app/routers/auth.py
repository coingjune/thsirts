from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models, schemas
from ..database import get_db
from ..auth import hash_password, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, verify_google_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=schemas.Token)
async def signup(user: schemas.UserSignup, db: Session = Depends(get_db)):
    # 이메일 중복 확인
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 새 사용자 생성
    hashed_password = hash_password(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # JWT 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse(name=new_user.name, email=new_user.email)
    }

@router.post("/login", response_model=schemas.Token)
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # 사용자 찾기
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # 구글 로그인 사용자는 일반 로그인 불가
    if not db_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google login. Please use Google sign-in."
        )
    
    # 비밀번호 확인
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # JWT 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse(name=db_user.name, email=db_user.email, is_seller=db_user.is_seller)
    }

@router.post("/google", response_model=schemas.Token)
async def google_login(google_token: schemas.GoogleToken, db: Session = Depends(get_db)):
    """구글 OAuth 토큰으로 로그인/회원가입"""
    try:
        # 구글 토큰 검증 및 사용자 정보 추출
        user_info = await verify_google_token(google_token.token)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )
        
        google_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name", email.split("@")[0])  # 이름이 없으면 이메일 앞부분 사용
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
        
        # 기존 사용자 확인 (이메일 또는 구글 ID로)
        db_user = db.query(models.User).filter(
            (models.User.email == email) | (models.User.google_id == google_id)
        ).first()
        
        if db_user:
            # 기존 사용자 - 구글 ID 업데이트 (없는 경우)
            if not db_user.google_id:
                db_user.google_id = google_id
            # 이름 업데이트 (변경 가능)
            if user_info.get("name"):
                db_user.name = user_info.get("name")
            db.commit()
            db.refresh(db_user)
        else:
            # 새 사용자 생성
            db_user = models.User(
                name=name,
                email=email,
                google_id=google_id,
                hashed_password=None  # 구글 로그인은 비밀번호 없음
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        
        # JWT 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserResponse(name=db_user.name, email=db_user.email, is_seller=db_user.is_seller)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )

@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserResponse(name=current_user.name, email=current_user.email, is_seller=current_user.is_seller)
