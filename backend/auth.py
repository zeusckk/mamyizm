import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

JWT_SECRET = os.environ.get('JWT_SECRET', 'fonakis-dev-secret-change-me')
JWT_ALG = 'HS256'
JWT_EXP_DAYS = 7

pwd_ctx = CryptContext(schemes=['bcrypt'], deprecated='auto')
bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return pwd_ctx.verify(pw, hashed)
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token süresi doldu')
    except Exception:
        raise HTTPException(status_code=401, detail='Geçersiz token')


async def get_current_user_id(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail='Yetkilendirme gerekli')
    payload = decode_token(creds.credentials)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail='Geçersiz token')
    return user_id
