from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime
import uuid


class RegisterIn(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: Optional[str] = None
    tckn: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    tckn: Optional[str] = None


class ChangePasswordIn(BaseModel):
    current: str
    next: str = Field(min_length=6)


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    tckn: Optional[str] = None
    iban_masked: Optional[str] = 'TR** **** **** **** **** ** 1234'
    cash_balance: float = 0.0
    total_deposits: float = 0.0
    kyc_status: str = 'none'  # 'none' | 'pending' | 'approved' | 'rejected'
    kyc_submitted_at: Optional[datetime] = None
    kyc_reviewed_at: Optional[datetime] = None
    created_at: datetime


class TradeIn(BaseModel):
    symbol: str
    units: float = Field(gt=0)


class CashIn(BaseModel):
    amount: float = Field(gt=0)


class KycSubmitIn(BaseModel):
    selfie_base64: str = Field(min_length=10, description='base64 encoded image (data URI or raw)')
    id_doc_base64: str = Field(min_length=10)
    id_doc_type: Literal['tc_kimlik', 'pasaport', 'ehliyet']
    id_doc_filename: Optional[str] = None
    id_doc_mime: Optional[str] = 'image/jpeg'


def new_id() -> str:
    return str(uuid.uuid4())
