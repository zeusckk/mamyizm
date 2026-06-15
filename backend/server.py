from fastapi import FastAPI, APIRouter, Depends, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

from auth import hash_password, verify_password, create_token, get_current_user_id
from models import (
    RegisterIn, LoginIn, ProfileUpdate, ChangePasswordIn, UserOut,
    Fund, PortfolioOut, HoldingOut, TradeIn, CashIn, TransactionOut, NewsOut, new_id,
)
from seed_data import seed_funds, SEED_NEWS
import market

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title='FonAkış API')
api = APIRouter(prefix='/api')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('fonakis')


# ---------- helpers ----------
async def user_to_out(u: dict) -> dict:
    return {
        'id': u['_id'], 'full_name': u['full_name'], 'email': u['email'],
        'phone': u.get('phone'), 'tckn': u.get('tckn'),
        'iban_masked': u.get('iban_masked', 'TR** **** **** **** **** ** 1234'),
        'cash_balance': u.get('cash_balance', 0.0),
        'total_deposits': u.get('total_deposits', 0.0),
        'created_at': u.get('created_at', datetime.now(timezone.utc)),
    }


async def get_user(user_id: str) -> dict:
    u = await db.users.find_one({'_id': user_id})
    if not u:
        raise HTTPException(404, 'Kullanıcı bulunamadı')
    return u


async def get_fund(code: str) -> dict:
    f = await db.funds.find_one({'_id': code})
    if not f:
        raise HTTPException(404, 'Fon bulunamadı')
    return f


# ---------- startup seed ----------
@app.on_event('startup')
async def startup_seed():
    await db.users.create_index('email', unique=True)
    await db.holdings.create_index([('user_id', 1), ('code', 1)], unique=True)
    await db.transactions.create_index([('user_id', 1), ('date', -1)])
    if await db.funds.count_documents({}) == 0:
        await db.funds.insert_many(seed_funds())
        logger.info('Seeded %d funds', await db.funds.count_documents({}))
    if await db.news.count_documents({}) == 0:
        await db.news.insert_many(SEED_NEWS)
        logger.info('Seeded news')


# ---------- health ----------
@api.get('/')
async def root():
    return {'service': 'FonAkış', 'status': 'ok'}


# ---------- auth ----------
@api.post('/auth/register')
async def register(body: RegisterIn):
    existing = await db.users.find_one({'email': body.email.lower()})
    if existing:
        raise HTTPException(409, 'Bu e-posta zaten kayıtlı')
    uid = new_id()
    user = {
        '_id': uid, 'full_name': body.full_name, 'email': body.email.lower(),
        'password_hash': hash_password(body.password),
        'phone': body.phone, 'tckn': body.tckn,
        'iban_masked': 'TR** **** **** **** **** ** 1234',
        'cash_balance': 0.0, 'total_deposits': 0.0,
        'created_at': datetime.now(timezone.utc),
    }
    await db.users.insert_one(user)
    token = create_token(uid)
    return {'token': token, 'user': await user_to_out(user)}


@api.post('/auth/login')
async def login(body: LoginIn):
    u = await db.users.find_one({'email': body.email.lower()})
    if not u or not verify_password(body.password, u['password_hash']):
        raise HTTPException(401, 'E-posta veya şifre hatalı')
    return {'token': create_token(u['_id']), 'user': await user_to_out(u)}


@api.get('/auth/me')
async def me(uid: str = Depends(get_current_user_id)):
    u = await get_user(uid)
    return {'user': await user_to_out(u)}


@api.patch('/auth/profile')
async def update_profile(body: ProfileUpdate, uid: str = Depends(get_current_user_id)):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    if upd:
        await db.users.update_one({'_id': uid}, {'$set': upd})
    u = await get_user(uid)
    return {'user': await user_to_out(u)}


@api.post('/auth/change-password')
async def change_password(body: ChangePasswordIn, uid: str = Depends(get_current_user_id)):
    u = await get_user(uid)
    if not verify_password(body.current, u['password_hash']):
        raise HTTPException(400, 'Mevcut şifre hatalı')
    await db.users.update_one({'_id': uid}, {'$set': {'password_hash': hash_password(body.next)}})
    return {'ok': True}


# ---------- funds ----------
@api.get('/funds')
async def list_funds():
    items = await db.funds.find().to_list(200)
    for f in items:
        f.pop('_id', None)
    return items


@api.get('/funds/{code}')
async def get_fund_route(code: str):
    f = await get_fund(code)
    f.pop('_id', None)
    return f


# ---------- portfolio ----------
async def build_portfolio(uid: str) -> dict:
    u = await get_user(uid)
    holdings = await db.holdings.find({'user_id': uid}).to_list(500)
    out_h = []
    total_value = 0.0
    total_cost = 0.0
    for h in holdings:
        f = await db.funds.find_one({'_id': h['code']})
        price = f['price'] if f else h.get('avg_cost', 0)
        out_h.append({'code': h['code'], 'units': h['units'], 'avg_cost': h['avg_cost'], 'current_price': price})
        total_value += h['units'] * price
        total_cost += h['units'] * h['avg_cost']
    pl = total_value - total_cost
    pl_pct = (pl / total_cost * 100) if total_cost else 0
    return {
        'cash_balance': u.get('cash_balance', 0.0),
        'holdings': out_h,
        'total_value': round(total_value, 2),
        'total_cost': round(total_cost, 2),
        'total_pl': round(pl, 2),
        'total_pl_pct': round(pl_pct, 2),
    }


@api.get('/portfolio')
async def get_portfolio(uid: str = Depends(get_current_user_id)):
    return await build_portfolio(uid)


# ---------- trade ----------
async def _record_tx(uid: str, tx_type: str, code: str, units: float, price: float, total: float) -> dict:
    tx = {
        '_id': new_id(), 'user_id': uid,
        'date': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M'),
        'type': tx_type, 'code': code, 'units': units, 'price': price, 'total': total,
        'status': 'Gerçekleşti',
    }
    await db.transactions.insert_one(tx)
    return {**tx, 'id': tx['_id']}


@api.post('/trade/buy')
async def buy(body: TradeIn, uid: str = Depends(get_current_user_id)):
    f = await get_fund(body.code)
    u = await get_user(uid)
    cost = body.units * f['price']
    if cost > u.get('cash_balance', 0):
        raise HTTPException(400, 'Yetersiz bakiye')
    existing = await db.holdings.find_one({'user_id': uid, 'code': body.code})
    if existing:
        total_units = existing['units'] + body.units
        new_avg = (existing['units'] * existing['avg_cost'] + body.units * f['price']) / total_units
        await db.holdings.update_one({'_id': existing['_id']}, {'$set': {'units': total_units, 'avg_cost': new_avg}})
    else:
        await db.holdings.insert_one({'_id': new_id(), 'user_id': uid, 'code': body.code, 'units': body.units, 'avg_cost': f['price']})
    new_cash = u['cash_balance'] - cost
    await db.users.update_one({'_id': uid}, {'$set': {'cash_balance': new_cash}})
    tx = await _record_tx(uid, 'Alım', body.code, body.units, f['price'], cost)
    tx.pop('_id', None); tx.pop('user_id', None)
    return {'ok': True, 'cash_balance': new_cash, 'transaction': tx}


@api.post('/trade/sell')
async def sell(body: TradeIn, uid: str = Depends(get_current_user_id)):
    f = await get_fund(body.code)
    holding = await db.holdings.find_one({'user_id': uid, 'code': body.code})
    if not holding or holding['units'] < body.units:
        raise HTTPException(400, 'Yetersiz pay adedi')
    proceeds = body.units * f['price']
    remaining = holding['units'] - body.units
    if remaining <= 0.0001:
        await db.holdings.delete_one({'_id': holding['_id']})
    else:
        await db.holdings.update_one({'_id': holding['_id']}, {'$set': {'units': remaining}})
    u = await get_user(uid)
    new_cash = u['cash_balance'] + proceeds
    await db.users.update_one({'_id': uid}, {'$set': {'cash_balance': new_cash}})
    tx = await _record_tx(uid, 'Satım', body.code, body.units, f['price'], proceeds)
    tx.pop('_id', None); tx.pop('user_id', None)
    return {'ok': True, 'cash_balance': new_cash, 'transaction': tx}


# ---------- cash ----------
@api.post('/cash/deposit')
async def deposit(body: CashIn, uid: str = Depends(get_current_user_id)):
    u = await get_user(uid)
    new_cash = u.get('cash_balance', 0) + body.amount
    new_total = u.get('total_deposits', 0) + body.amount
    await db.users.update_one({'_id': uid}, {'$set': {'cash_balance': new_cash, 'total_deposits': new_total}})
    tx = await _record_tx(uid, 'Para Yatırma', '-', 0, 0, body.amount)
    tx.pop('_id', None); tx.pop('user_id', None)
    return {'cash_balance': new_cash, 'transaction': tx}


@api.post('/cash/withdraw')
async def withdraw(body: CashIn, uid: str = Depends(get_current_user_id)):
    u = await get_user(uid)
    if body.amount > u.get('cash_balance', 0):
        raise HTTPException(400, 'Yetersiz bakiye')
    new_cash = u['cash_balance'] - body.amount
    await db.users.update_one({'_id': uid}, {'$set': {'cash_balance': new_cash}})
    tx = await _record_tx(uid, 'Para Çekme', '-', 0, 0, -body.amount)
    tx.pop('_id', None); tx.pop('user_id', None)
    return {'cash_balance': new_cash, 'transaction': tx}


# ---------- transactions ----------
@api.get('/transactions')
async def list_transactions(uid: str = Depends(get_current_user_id), type: Optional[str] = None, status: Optional[str] = None):
    q = {'user_id': uid}
    if type and type != 'all': q['type'] = type
    if status and status != 'all': q['status'] = status
    items = await db.transactions.find(q).sort('date', -1).to_list(1000)
    out = []
    for t in items:
        out.append({
            'id': t['_id'], 'date': t['date'], 'type': t['type'], 'code': t['code'],
            'units': t['units'], 'price': t['price'], 'total': t['total'], 'status': t['status'],
        })
    return out


# ---------- news ----------
@api.get('/news')
async def list_news():
    items = await db.news.find().sort('date', -1).to_list(50)
    return [{'id': n['_id'], 'date': n['date'], 'tag': n['tag'], 'title': n['title'], 'summary': n['summary']} for n in items]


# ---------- market (real-time via yfinance) ----------
@api.get('/market/{group}')
async def market_group(group: str):
    if group not in ('indices', 'stocks', 'commodities', 'fx', 'crypto'):
        raise HTTPException(404, 'Geçersiz piyasa grubu')
    items = await market.get_market_group(group)
    return items


@api.get('/market-symbol/detail')
async def market_symbol_detail(symbol: str):
    """Query via /api/market-symbol/detail?symbol=BTC-USD (avoid path-encoding issues with ^, =, .)"""
    d = await market.get_symbol_detail(symbol)
    if not d:
        raise HTTPException(404, 'Sembol bulunamadı')
    return d


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])


@app.on_event('shutdown')
async def shutdown_db():
    client.close()
