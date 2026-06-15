from fastapi import FastAPI, APIRouter, Depends, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from auth import hash_password, verify_password, create_token, get_current_user_id
from models import (
    RegisterIn, LoginIn, ProfileUpdate, ChangePasswordIn,
    TradeIn, CashIn, KycSubmitIn, new_id,
)
import market
from admin import make_admin_router, seed_default_admin

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
        'kyc_status': u.get('kyc_status', 'none'),
        'kyc_submitted_at': u.get('kyc_submitted_at'),
        'kyc_reviewed_at': u.get('kyc_reviewed_at'),
        'role': u.get('role', 'user'),
        'suspended': bool(u.get('suspended', False)),
        'created_at': u.get('created_at', datetime.now(timezone.utc)),
    }


async def get_user(user_id: str) -> dict:
    u = await db.users.find_one({'_id': user_id})
    if not u:
        raise HTTPException(404, 'Kullanıcı bulunamadı')
    return u


# ---------- startup ----------
NEWS_SEED = [
    {'_id': 'n1', 'date': '2025-07-09', 'tag': 'Piyasa', 'title': 'BIST 100 günü yükselişle kapattı, bankacılık endeksi öne çıktı', 'summary': 'Endeks gün içinde %2.1 değer kazanırken, bankacılık endeksi %3.4 yükseldi. Yabancı yatırımcı girişi 142M USD oldu.'},
    {'_id': 'n2', 'date': '2025-07-09', 'tag': 'Duyuru', 'title': 'BIST hisselerinde komisyon kampanyası', 'summary': 'Bu hafta sonuna kadar BIST hisse alım-satım komisyonu sıfırlandı.'},
    {'_id': 'n3', 'date': '2025-07-08', 'tag': 'Analiz', 'title': 'TCMB faiz kararı sonrası tahvil piyasası görünümü', 'summary': 'Politika faizinin sabit tutulmasıyla 10 yıllık tahvil getirisi 35 baz puan geriledi.'},
    {'_id': 'n4', 'date': '2025-07-07', 'tag': 'Emtia', 'title': 'Altın ons fiyatı 2,420 USD seviyesinde yatay seyrediyor', 'summary': 'Jeopolitik gerilimler altına talebi destekliyor; gram altın TL bazında haftalık %1.8 değerlendi.'},
    {'_id': 'n5', 'date': '2025-07-05', 'tag': 'Duyuru', 'title': 'Yeni mobil uygulama 2.4 sürümü yayında', 'summary': 'Biyometrik giriş, hızlı işlem ekranı ve özelleştirilebilir kontrol panelleri eklendi.'},
    {'_id': 'n6', 'date': '2025-07-04', 'tag': 'Strateji', 'title': 'Üçüncü çeyrek varlık dağılım önerimiz: dengeli portföy', 'summary': 'Hisse %40, tahvil %35, kıymetli maden %15, para piyasası %10 ağırlıklı bir dağılım öneriyoruz.'},
]


@app.on_event('startup')
async def startup_init():
    await db.users.create_index('email', unique=True)
    await db.holdings.create_index([('user_id', 1), ('code', 1)], unique=True)
    await db.transactions.create_index([('user_id', 1), ('date', -1)])
    await db.audit_log.create_index([('created_at', -1)])
    if await db.news.count_documents({}) == 0:
        await db.news.insert_many(NEWS_SEED)
    # remove obsolete funds collection if exists
    try:
        await db.funds.drop()
    except Exception:
        pass
    # seed default admin
    await seed_default_admin(db, hash_password)


# ---------- health ----------
@api.get('/')
async def root():
    return {'service': 'FonAkış', 'status': 'ok'}


# ---------- auth ----------
@api.post('/auth/register')
async def register(body: RegisterIn):
    if await db.users.find_one({'email': body.email.lower()}):
        raise HTTPException(409, 'Bu e-posta zaten kayıtlı')
    uid = new_id()
    user = {
        '_id': uid, 'full_name': body.full_name, 'email': body.email.lower(),
        'password_hash': hash_password(body.password),
        'phone': body.phone, 'tckn': body.tckn,
        'iban_masked': 'TR** **** **** **** **** ** 1234',
        'cash_balance': 0.0, 'total_deposits': 0.0,
        'kyc_status': 'none',
        'created_at': datetime.now(timezone.utc),
    }
    await db.users.insert_one(user)
    return {'token': create_token(uid), 'user': await user_to_out(user)}


@api.post('/auth/login')
async def login(body: LoginIn):
    u = await db.users.find_one({'email': body.email.lower()})
    if not u or not verify_password(body.password, u['password_hash']):
        raise HTTPException(401, 'E-posta veya şifre hatalı')
    if u.get('suspended'):
        raise HTTPException(403, 'Hesabınız askıya alınmıştır. Destek ekibi ile iletişime geçin.')
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


# ---------- KYC ----------
def _validate_base64_size(b64: str, max_mb: int = 8) -> None:
    # base64 ~4/3 of binary
    approx_bytes = (len(b64) * 3) // 4
    if approx_bytes > max_mb * 1024 * 1024:
        raise HTTPException(413, f'Dosya çok büyük (maks {max_mb} MB)')


@api.post('/kyc/submit')
async def kyc_submit(body: KycSubmitIn, uid: str = Depends(get_current_user_id)):
    _validate_base64_size(body.selfie_base64, 5)
    _validate_base64_size(body.id_doc_base64, 8)
    now = datetime.now(timezone.utc)
    await db.kyc_documents.update_one(
        {'user_id': uid},
        {'$set': {
            'user_id': uid,
            'selfie_base64': body.selfie_base64,
            'id_doc_base64': body.id_doc_base64,
            'id_doc_type': body.id_doc_type,
            'id_doc_filename': body.id_doc_filename,
            'id_doc_mime': body.id_doc_mime,
            'submitted_at': now,
        }},
        upsert=True,
    )
    await db.users.update_one({'_id': uid}, {'$set': {
        'kyc_status': 'pending', 'kyc_submitted_at': now, 'kyc_reviewed_at': None,
    }})
    u = await get_user(uid)
    return {'ok': True, 'user': await user_to_out(u)}


@api.get('/kyc/status')
async def kyc_status(uid: str = Depends(get_current_user_id)):
    u = await get_user(uid)
    doc = await db.kyc_documents.find_one({'user_id': uid}, {'selfie_base64': 0, 'id_doc_base64': 0})
    return {
        'status': u.get('kyc_status', 'none'),
        'submitted_at': u.get('kyc_submitted_at'),
        'reviewed_at': u.get('kyc_reviewed_at'),
        'has_documents': doc is not None,
        'id_doc_type': (doc or {}).get('id_doc_type'),
    }


@api.post('/kyc/demo-approve')
async def kyc_demo_approve(uid: str = Depends(get_current_user_id)):
    """Demo only - instantly approves current user's KYC."""
    u = await get_user(uid)
    if u.get('kyc_status') != 'pending':
        raise HTTPException(400, 'Önce KYC belgelerini yükleyin')
    await db.users.update_one({'_id': uid}, {'$set': {
        'kyc_status': 'approved', 'kyc_reviewed_at': datetime.now(timezone.utc),
    }})
    u = await get_user(uid)
    return {'ok': True, 'user': await user_to_out(u)}


# ---------- market ----------
@api.get('/market/{group}')
async def market_group(group: str):
    if group not in ('indices', 'stocks', 'commodities', 'fx', 'crypto'):
        raise HTTPException(404, 'Geçersiz piyasa grubu')
    return await market.get_market_group(group)


@api.get('/market-symbol/detail')
async def market_symbol_detail(symbol: str):
    d = await market.get_symbol_detail(symbol)
    if not d:
        raise HTTPException(404, 'Sembol bulunamadı')
    return d


# ---------- portfolio ----------
async def build_portfolio(uid: str) -> dict:
    u = await get_user(uid)
    holdings = await db.holdings.find({'user_id': uid}).to_list(500)
    symbols = list({h['code'] for h in holdings if h.get('code')})
    prices = await market.get_prices_for_symbols(symbols) if symbols else {}
    out_h = []
    total_value = 0.0
    total_cost = 0.0
    for h in holdings:
        price = prices.get(h['code'], 0) or h.get('avg_cost', 0)
        meta = market.TRADABLE.get(h['code'], {})
        out_h.append({
            'code': h['code'],
            'symbol': h['code'],
            'name': h.get('name') or meta.get('name', h['code']),
            'category': meta.get('category', '-'),
            'market': h.get('market', meta.get('market', 'BIST')),
            'units': h['units'],
            'avg_cost': h['avg_cost'],
            'current_price': price,
            'value': h['units'] * price,
            'cost': h['units'] * h['avg_cost'],
            'pl': h['units'] * (price - h['avg_cost']),
            'pl_pct': ((price - h['avg_cost']) / h['avg_cost'] * 100) if h['avg_cost'] else 0,
        })
        total_value += h['units'] * price
        total_cost += h['units'] * h['avg_cost']
    pl = total_value - total_cost
    return {
        'cash_balance': u.get('cash_balance', 0.0),
        'holdings': out_h,
        'total_value': round(total_value, 2),
        'total_cost': round(total_cost, 2),
        'total_pl': round(pl, 2),
        'total_pl_pct': round((pl / total_cost * 100) if total_cost else 0, 2),
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
    instr = await market.get_tradable_instrument(body.symbol)
    if not instr:
        raise HTTPException(404, 'Sembol bulunamadı veya işleme kapalı')
    if not instr.get('price'):
        raise HTTPException(503, 'Fiyat alınamadı, lütfen tekrar deneyin')
    u = await get_user(uid)
    if u.get('kyc_status') != 'approved':
        raise HTTPException(403, 'İşlem yapmak için KYC onayı gereklidir')
    cost = body.units * instr['price']
    if cost > u.get('cash_balance', 0):
        raise HTTPException(400, 'Yetersiz bakiye')
    existing = await db.holdings.find_one({'user_id': uid, 'code': body.symbol})
    if existing:
        total_units = existing['units'] + body.units
        new_avg = (existing['units'] * existing['avg_cost'] + body.units * instr['price']) / total_units
        await db.holdings.update_one({'_id': existing['_id']}, {'$set': {'units': total_units, 'avg_cost': new_avg}})
    else:
        await db.holdings.insert_one({
            '_id': new_id(), 'user_id': uid, 'code': body.symbol,
            'units': body.units, 'avg_cost': instr['price'],
            'name': instr['name'], 'market': instr['market'],
        })
    new_cash = u['cash_balance'] - cost
    await db.users.update_one({'_id': uid}, {'$set': {'cash_balance': new_cash}})
    tx = await _record_tx(uid, 'Alım', body.symbol, body.units, instr['price'], cost)
    tx.pop('_id', None); tx.pop('user_id', None)
    return {'ok': True, 'cash_balance': new_cash, 'transaction': tx}


@api.post('/trade/sell')
async def sell(body: TradeIn, uid: str = Depends(get_current_user_id)):
    instr = await market.get_tradable_instrument(body.symbol)
    if not instr:
        raise HTTPException(404, 'Sembol bulunamadı')
    if not instr.get('price'):
        raise HTTPException(503, 'Fiyat alınamadı, lütfen tekrar deneyin')
    holding = await db.holdings.find_one({'user_id': uid, 'code': body.symbol})
    if not holding or holding['units'] < body.units:
        raise HTTPException(400, 'Yetersiz pay adedi')
    u = await get_user(uid)
    if u.get('kyc_status') != 'approved':
        raise HTTPException(403, 'İşlem yapmak için KYC onayı gereklidir')
    proceeds = body.units * instr['price']
    remaining = holding['units'] - body.units
    if remaining <= 0.0001:
        await db.holdings.delete_one({'_id': holding['_id']})
    else:
        await db.holdings.update_one({'_id': holding['_id']}, {'$set': {'units': remaining}})
    new_cash = u['cash_balance'] + proceeds
    await db.users.update_one({'_id': uid}, {'$set': {'cash_balance': new_cash}})
    tx = await _record_tx(uid, 'Satım', body.symbol, body.units, instr['price'], proceeds)
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
    return [{
        'id': t['_id'], 'date': t['date'], 'type': t['type'], 'code': t['code'],
        'units': t['units'], 'price': t['price'], 'total': t['total'], 'status': t['status'],
    } for t in items]


# ---------- news ----------
@api.get('/news')
async def list_news():
    items = await db.news.find().sort('date', -1).to_list(50)
    return [{'id': n['_id'], 'date': n['date'], 'tag': n['tag'], 'title': n['title'], 'summary': n['summary']} for n in items]


app.include_router(api)
app.include_router(make_admin_router(db, market), prefix='/api')
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])


@app.on_event('shutdown')
async def shutdown_db():
    client.close()
