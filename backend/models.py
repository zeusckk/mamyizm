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
    created_at: datetime


class SeriesPoint(BaseModel):
    d: int
    v: float


class Fund(BaseModel):
    code: str
    name: str
    category: str
    category_label: str
    price: float
    change_24h: float
    change_ytd: float
    risk: int
    aum: float
    manager: str
    min_buy: float = 1
    currency: str = 'TRY'
    series: List[SeriesPoint]
    desc: str


class HoldingOut(BaseModel):
    code: str
    units: float
    avg_cost: float
    current_price: float


class PortfolioOut(BaseModel):
    cash_balance: float
    holdings: List[HoldingOut]
    total_value: float
    total_cost: float
    total_pl: float
    total_pl_pct: float


class TradeIn(BaseModel):
    code: str
    units: float = Field(gt=0)


class CashIn(BaseModel):
    amount: float = Field(gt=0)


class TransactionOut(BaseModel):
    id: str
    date: str
    type: Literal['Alım', 'Satım', 'Para Yatırma', 'Para Çekme']
    code: str
    units: float
    price: float
    total: float
    status: str = 'Gerçekleşti'


class NewsOut(BaseModel):
    id: str
    date: str
    tag: str
    title: str
    summary: str


def new_id() -> str:
    return str(uuid.uuid4())
