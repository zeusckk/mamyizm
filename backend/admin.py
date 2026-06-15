"""Admin panel endpoints — role-based access (admin role required)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime, timezone
import logging

from auth import hash_password, get_current_user_id
from models import new_id

logger = logging.getLogger('fonakis.admin')


def make_admin_router(db, market_mod):
    """Factory that returns admin router bound to db + market module."""
    router = APIRouter(prefix='/admin')

    # ---------- helpers ----------
    async def require_admin(uid: str = Depends(get_current_user_id)) -> dict:
        u = await db.users.find_one({'_id': uid})
        if not u:
            raise HTTPException(401, 'Yetkisiz')
        if u.get('role') != 'admin':
            raise HTTPException(403, 'Admin yetkisi gerekli')
        return u

    async def _audit(admin_id: str, action: str, target_id: Optional[str] = None, meta: Optional[dict] = None):
        await db.audit_log.insert_one({
            '_id': new_id(),
            'admin_id': admin_id,
            'action': action,
            'target_id': target_id,
            'meta': meta or {},
            'created_at': datetime.now(timezone.utc),
        })

    async def _user_summary(u: dict) -> dict:
        # auto-assign customer_no if missing
        cust_no = u.get('customer_no')
        if not cust_no:
            cust_no = 'FNK' + str(abs(hash(u['_id'])))[:10].zfill(10)
            await db.users.update_one({'_id': u['_id']}, {'$set': {'customer_no': cust_no}})
        return {
            'id': u['_id'], 'email': u['email'], 'full_name': u['full_name'],
            'phone': u.get('phone'), 'tckn': u.get('tckn'),
            'role': u.get('role', 'user'),
            'suspended': bool(u.get('suspended', False)),
            'kyc_status': u.get('kyc_status', 'none'),
            'cash_balance': u.get('cash_balance', 0),
            'credit_balance': u.get('credit_balance', 0),
            'total_deposits': u.get('total_deposits', 0),
            'customer_no': cust_no,
            'tier': u.get('tier', 'STANDARD'),
            'currency': u.get('currency', 'TRY'),
            'created_at': u.get('created_at'),
        }

    # ---------- models ----------
    class UpdateUserIn(BaseModel):
        full_name: Optional[str] = None
        phone: Optional[str] = None
        tckn: Optional[str] = None
        cash_balance: Optional[float] = None
        suspended: Optional[bool] = None
        role: Optional[Literal['user', 'admin']] = None

    class KycActionIn(BaseModel):
        reason: Optional[str] = None

    class NewsIn(BaseModel):
        date: str
        tag: str
        title: str
        summary: str

    class SettingsIn(BaseModel):
        commission_rate: Optional[float] = None
        min_trade_amount: Optional[float] = None
        max_trade_amount: Optional[float] = None
        min_deposit: Optional[float] = None
        max_withdraw: Optional[float] = None
        maintenance_mode: Optional[bool] = None
        announcement: Optional[str] = None

    class CreateAdminIn(BaseModel):
        email: str
        password: str = Field(min_length=6)
        full_name: str

    class PaymentMethodIn(BaseModel):
        type: Literal['bank', 'crypto']
        label: str  # display label e.g. "Garanti BBVA" or "USDT TRC20"
        # bank fields
        bank_code: Optional[str] = None  # garanti, akbank, ziraat...
        bank_name: Optional[str] = None
        account_holder: Optional[str] = None
        iban: Optional[str] = None
        account_number: Optional[str] = None
        branch: Optional[str] = None
        # crypto fields
        currency: Optional[str] = None  # USDT, BTC, ETH...
        network: Optional[str] = None  # TRC20, ERC20, BEP20, Bitcoin
        address: Optional[str] = None
        memo: Optional[str] = None
        # common
        active: Optional[bool] = True
        notes: Optional[str] = None

    class DepositActionIn(BaseModel):
        reason: Optional[str] = None

    class BalanceActionIn(BaseModel):
        delta: float
        reason: Optional[str] = None

    class CreditActionIn(BaseModel):
        delta: float
        reason: Optional[str] = None

    class AdminUserUpdateIn(BaseModel):
        full_name: Optional[str] = None
        email: Optional[str] = None
        phone: Optional[str] = None
        tckn: Optional[str] = None

    class AdminPasswordIn(BaseModel):
        password: str = Field(min_length=6)

    # ---------- DASHBOARD STATS ----------
    @router.get('/stats')
    async def stats(admin=Depends(require_admin)):
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({'suspended': {'$ne': True}})
        pending_kyc = await db.users.count_documents({'kyc_status': 'pending'})
        approved_kyc = await db.users.count_documents({'kyc_status': 'approved'})
        total_holdings = await db.holdings.count_documents({})
        total_tx = await db.transactions.count_documents({})
        pending_deposits = await db.deposit_requests.count_documents({'status': 'pending'})

        # Cash aggregates
        pipe_cash = [{'$group': {'_id': None, 'total_cash': {'$sum': '$cash_balance'}, 'total_deposits': {'$sum': '$total_deposits'}}}]
        cash_agg = await db.users.aggregate(pipe_cash).to_list(1)
        total_cash = cash_agg[0]['total_cash'] if cash_agg else 0
        total_deposits = cash_agg[0]['total_deposits'] if cash_agg else 0

        # Trade volume (last 7d)
        pipe_vol = [
            {'$match': {'type': {'$in': ['Alım', 'Satım']}}},
            {'$group': {'_id': '$type', 'count': {'$sum': 1}, 'volume': {'$sum': '$total'}}},
        ]
        vol_agg = await db.transactions.aggregate(pipe_vol).to_list(10)
        volumes = {a['_id']: {'count': a['count'], 'volume': a['volume']} for a in vol_agg}

        # Top traded symbols
        pipe_top = [
            {'$match': {'type': {'$in': ['Alım', 'Satım']}}},
            {'$group': {'_id': '$code', 'count': {'$sum': 1}, 'volume': {'$sum': '$total'}}},
            {'$sort': {'volume': -1}},
            {'$limit': 5},
        ]
        top_symbols = await db.transactions.aggregate(pipe_top).to_list(5)
        top_symbols = [{'symbol': t['_id'], 'count': t['count'], 'volume': t['volume']} for t in top_symbols]

        # Recent registrations (last 5)
        recent_users_raw = await db.users.find().sort('created_at', -1).limit(5).to_list(5)
        recent_users = [await _user_summary(u) for u in recent_users_raw]

        # Recent transactions (last 5)
        recent_tx_raw = await db.transactions.find().sort('date', -1).limit(5).to_list(5)
        recent_tx = []
        for t in recent_tx_raw:
            u = await db.users.find_one({'_id': t['user_id']}, {'email': 1, 'full_name': 1})
            recent_tx.append({
                'id': t['_id'], 'date': t['date'], 'type': t['type'], 'code': t['code'],
                'units': t['units'], 'price': t['price'], 'total': t['total'],
                'user_email': (u or {}).get('email', '-'), 'user_name': (u or {}).get('full_name', '-'),
            })

        return {
            'users': {'total': total_users, 'active': active_users, 'suspended': total_users - active_users},
            'kyc': {'pending': pending_kyc, 'approved': approved_kyc, 'none': total_users - pending_kyc - approved_kyc},
            'cash': {'total_cash_balance': total_cash, 'total_deposits': total_deposits},
            'trading': {'total_transactions': total_tx, 'total_holdings': total_holdings, 'volumes': volumes, 'top_symbols': top_symbols},
            'deposits': {'pending': pending_deposits},
            'recent_users': recent_users,
            'recent_transactions': recent_tx,
        }

    # ---------- USERS ----------
    @router.get('/users')
    async def list_users(
        admin=Depends(require_admin),
        q: Optional[str] = None,
        kyc: Optional[str] = None,
        role: Optional[str] = None,
        suspended: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        query = {}
        if q:
            query['$or'] = [
                {'email': {'$regex': q, '$options': 'i'}},
                {'full_name': {'$regex': q, '$options': 'i'}},
                {'phone': {'$regex': q}},
                {'tckn': {'$regex': q}},
            ]
        if kyc and kyc != 'all': query['kyc_status'] = kyc
        if role and role != 'all': query['role'] = role
        if suspended is not None: query['suspended'] = suspended

        total = await db.users.count_documents(query)
        items_raw = await db.users.find(query).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
        items = [await _user_summary(u) for u in items_raw]
        return {'total': total, 'items': items}

    @router.get('/users/{user_id}')
    async def user_detail(user_id: str, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')

        holdings = await db.holdings.find({'user_id': user_id}).to_list(500)
        # Open positions with live prices + P/L
        symbols = list({h['code'] for h in holdings if h.get('code')})
        prices = await market_mod.get_prices_for_symbols(symbols) if symbols else {}
        open_positions = []
        open_value = 0.0
        open_cost = 0.0
        for h in holdings:
            price = prices.get(h['code'], 0) or h.get('avg_cost', 0)
            value = h['units'] * price
            cost = h['units'] * h['avg_cost']
            open_positions.append({
                'code': h['code'], 'name': h.get('name', h['code']),
                'units': h['units'], 'avg_cost': h['avg_cost'],
                'current_price': price,
                'value': value, 'cost': cost,
                'pl': value - cost,
                'pl_pct': ((price - h['avg_cost']) / h['avg_cost'] * 100) if h['avg_cost'] else 0,
            })
            open_value += value
            open_cost += cost

        all_tx = await db.transactions.find({'user_id': user_id}).sort('date', -1).to_list(1000)

        def _tx_dto(t):
            return {
                'id': t['_id'], 'date': t['date'], 'type': t['type'], 'code': t.get('code', '-'),
                'units': t.get('units', 0), 'price': t.get('price', 0),
                'total': t.get('total', 0), 'status': t.get('status', '-'),
            }

        deposits = [_tx_dto(t) for t in all_tx if t['type'] == 'Para Yatırma']
        withdrawals = [_tx_dto(t) for t in all_tx if t['type'] == 'Para Çekme']
        closed_trades = [_tx_dto(t) for t in all_tx if t['type'] == 'Satım']
        movements = [_tx_dto(t) for t in all_tx]

        # KYC info
        kyc_doc = await db.kyc_documents.find_one({'user_id': user_id}, {'selfie_base64': 0, 'id_doc_base64': 0})

        summary = await _user_summary(u)
        return {
            **summary,
            'kyc_submitted_at': u.get('kyc_submitted_at'),
            'kyc_reviewed_at': u.get('kyc_reviewed_at'),
            'kyc_rejection_reason': u.get('kyc_rejection_reason'),
            'iban_masked': u.get('iban_masked'),
            'has_kyc_documents': kyc_doc is not None,
            'kyc_id_doc_type': (kyc_doc or {}).get('id_doc_type'),
            'kyc_id_doc_filename': (kyc_doc or {}).get('id_doc_filename'),
            'positions_summary': {
                'open_value': round(open_value, 2),
                'open_cost': round(open_cost, 2),
                'open_pl': round(open_value - open_cost, 2),
                'open_count': len(open_positions),
            },
            'open_positions': open_positions,
            'closed_trades': closed_trades,
            'deposits': deposits,
            'withdrawals': withdrawals,
            'movements': movements,
        }

    @router.post('/users/{user_id}/balance')
    async def adjust_balance(user_id: str, body: BalanceActionIn, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        new_cash = u.get('cash_balance', 0) + body.delta
        if new_cash < 0:
            raise HTTPException(400, 'Bakiye negatif olamaz')
        await db.users.update_one({'_id': user_id}, {'$set': {'cash_balance': new_cash}})
        # record as transaction
        await db.transactions.insert_one({
            '_id': new_id(), 'user_id': user_id,
            'date': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M'),
            'type': 'Admin Bakiye' if body.delta >= 0 else 'Admin Düzeltme',
            'code': '-', 'units': 0, 'price': 0,
            'total': body.delta, 'status': 'Gerçekleşti',
            'admin_id': admin['_id'], 'reason': body.reason or '',
        })
        await _audit(admin['_id'], 'user.balance', user_id, {'delta': body.delta, 'reason': body.reason, 'new': new_cash})
        return {'ok': True, 'cash_balance': new_cash}

    @router.post('/users/{user_id}/credit')
    async def adjust_credit(user_id: str, body: CreditActionIn, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        new_credit = u.get('credit_balance', 0) + body.delta
        if new_credit < 0:
            raise HTTPException(400, 'Kredi negatif olamaz')
        await db.users.update_one({'_id': user_id}, {'$set': {'credit_balance': new_credit}})
        await _audit(admin['_id'], 'user.credit', user_id, {'delta': body.delta, 'reason': body.reason, 'new': new_credit})
        return {'ok': True, 'credit_balance': new_credit}

    @router.post('/users/{user_id}/info')
    async def update_user_info(user_id: str, body: AdminUserUpdateIn, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        upd = {k: v for k, v in body.dict().items() if v is not None}
        if 'email' in upd:
            upd['email'] = upd['email'].lower()
            other = await db.users.find_one({'email': upd['email'], '_id': {'$ne': user_id}})
            if other: raise HTTPException(409, 'Bu e-posta başka kullanıcıda kayıtlı')
        if upd:
            await db.users.update_one({'_id': user_id}, {'$set': upd})
            await _audit(admin['_id'], 'user.info', user_id, upd)
        u2 = await db.users.find_one({'_id': user_id})
        return await _user_summary(u2)

    @router.post('/users/{user_id}/password')
    async def admin_set_password(user_id: str, body: AdminPasswordIn, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        await db.users.update_one({'_id': user_id}, {'$set': {'password_hash': hash_password(body.password)}})
        await _audit(admin['_id'], 'user.password_reset', user_id)
        return {'ok': True}

    @router.patch('/users/{user_id}')
    async def update_user(user_id: str, body: UpdateUserIn, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        if user_id == admin['_id'] and body.role == 'user':
            raise HTTPException(400, 'Kendi rolünüzü değiştiremezsiniz')
        upd = {k: v for k, v in body.dict().items() if v is not None}
        if upd:
            await db.users.update_one({'_id': user_id}, {'$set': upd})
            await _audit(admin['_id'], 'user.update', user_id, upd)
        u2 = await db.users.find_one({'_id': user_id})
        return await _user_summary(u2)

    @router.delete('/users/{user_id}')
    async def delete_user(user_id: str, admin=Depends(require_admin)):
        if user_id == admin['_id']:
            raise HTTPException(400, 'Kendinizi silemezsiniz')
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        await db.users.delete_one({'_id': user_id})
        await db.holdings.delete_many({'user_id': user_id})
        await db.transactions.delete_many({'user_id': user_id})
        await db.kyc_documents.delete_many({'user_id': user_id})
        await _audit(admin['_id'], 'user.delete', user_id, {'email': u.get('email')})
        return {'ok': True}

    # ---------- KYC ----------
    @router.get('/kyc/pending')
    async def kyc_pending(admin=Depends(require_admin)):
        users = await db.users.find({'kyc_status': 'pending'}).sort('kyc_submitted_at', -1).to_list(200)
        out = []
        for u in users:
            doc = await db.kyc_documents.find_one({'user_id': u['_id']}, {'selfie_base64': 0, 'id_doc_base64': 0})
            out.append({
                **(await _user_summary(u)),
                'submitted_at': u.get('kyc_submitted_at'),
                'id_doc_type': (doc or {}).get('id_doc_type'),
                'id_doc_filename': (doc or {}).get('id_doc_filename'),
            })
        return {'items': out, 'total': len(out)}

    @router.get('/kyc/all')
    async def kyc_all(admin=Depends(require_admin), status: Optional[str] = None):
        q = {}
        if status and status != 'all': q['kyc_status'] = status
        else: q['kyc_status'] = {'$in': ['pending', 'approved', 'rejected']}
        users = await db.users.find(q).sort('kyc_submitted_at', -1).to_list(500)
        return [await _user_summary(u) for u in users]

    @router.get('/kyc/{user_id}/documents')
    async def kyc_documents(user_id: str, admin=Depends(require_admin)):
        doc = await db.kyc_documents.find_one({'user_id': user_id})
        if not doc: raise HTTPException(404, 'Belge bulunamadı')
        u = await db.users.find_one({'_id': user_id})
        return {
            'user': await _user_summary(u) if u else None,
            'selfie_base64': doc.get('selfie_base64'),
            'id_doc_base64': doc.get('id_doc_base64'),
            'id_doc_type': doc.get('id_doc_type'),
            'id_doc_filename': doc.get('id_doc_filename'),
            'id_doc_mime': doc.get('id_doc_mime'),
            'submitted_at': doc.get('submitted_at'),
        }

    @router.post('/kyc/{user_id}/approve')
    async def kyc_approve(user_id: str, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        await db.users.update_one({'_id': user_id}, {'$set': {
            'kyc_status': 'approved',
            'kyc_reviewed_at': datetime.now(timezone.utc),
            'kyc_reviewed_by': admin['_id'],
        }})
        await _audit(admin['_id'], 'kyc.approve', user_id)
        return {'ok': True}

    @router.post('/kyc/{user_id}/reject')
    async def kyc_reject(user_id: str, body: KycActionIn, admin=Depends(require_admin)):
        u = await db.users.find_one({'_id': user_id})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        await db.users.update_one({'_id': user_id}, {'$set': {
            'kyc_status': 'rejected',
            'kyc_reviewed_at': datetime.now(timezone.utc),
            'kyc_reviewed_by': admin['_id'],
            'kyc_rejection_reason': body.reason or '',
        }})
        await _audit(admin['_id'], 'kyc.reject', user_id, {'reason': body.reason})
        return {'ok': True}

    # ---------- TRANSACTIONS ----------
    @router.get('/transactions')
    async def all_transactions(
        admin=Depends(require_admin),
        q: Optional[str] = None, type: Optional[str] = None,
        user_id: Optional[str] = None, skip: int = 0, limit: int = 100,
    ):
        query = {}
        if user_id: query['user_id'] = user_id
        if type and type != 'all': query['type'] = type
        if q: query['$or'] = [{'code': {'$regex': q, '$options': 'i'}}]
        total = await db.transactions.count_documents(query)
        items = await db.transactions.find(query).sort('date', -1).skip(skip).limit(limit).to_list(limit)
        out = []
        for t in items:
            u = await db.users.find_one({'_id': t['user_id']}, {'email': 1, 'full_name': 1})
            out.append({
                'id': t['_id'], 'date': t['date'], 'type': t['type'], 'code': t['code'],
                'units': t['units'], 'price': t['price'], 'total': t['total'], 'status': t['status'],
                'user_id': t['user_id'], 'user_email': (u or {}).get('email', '-'),
                'user_name': (u or {}).get('full_name', '-'),
            })
        return {'total': total, 'items': out}

    # ---------- NEWS CRUD ----------
    @router.get('/news')
    async def admin_list_news(admin=Depends(require_admin)):
        items = await db.news.find().sort('date', -1).to_list(200)
        return [{'id': n['_id'], 'date': n['date'], 'tag': n['tag'], 'title': n['title'], 'summary': n['summary']} for n in items]

    @router.post('/news')
    async def create_news(body: NewsIn, admin=Depends(require_admin)):
        nid = new_id()
        doc = {'_id': nid, **body.dict()}
        await db.news.insert_one(doc)
        await _audit(admin['_id'], 'news.create', nid, body.dict())
        return {'id': nid, **body.dict()}

    @router.patch('/news/{news_id}')
    async def update_news(news_id: str, body: NewsIn, admin=Depends(require_admin)):
        await db.news.update_one({'_id': news_id}, {'$set': body.dict()})
        await _audit(admin['_id'], 'news.update', news_id, body.dict())
        return {'id': news_id, **body.dict()}

    @router.delete('/news/{news_id}')
    async def delete_news(news_id: str, admin=Depends(require_admin)):
        r = await db.news.delete_one({'_id': news_id})
        if r.deleted_count == 0: raise HTTPException(404, 'Haber bulunamadı')
        await _audit(admin['_id'], 'news.delete', news_id)
        return {'ok': True}

    # ---------- REPORTS ----------
    @router.get('/reports/top-stocks')
    async def top_stocks(admin=Depends(require_admin), limit: int = 10):
        pipe = [
            {'$match': {'type': {'$in': ['Alım', 'Satım']}}},
            {'$group': {'_id': '$code', 'tx_count': {'$sum': 1}, 'volume': {'$sum': '$total'}, 'units': {'$sum': '$units'}}},
            {'$sort': {'volume': -1}},
            {'$limit': limit},
        ]
        res = await db.transactions.aggregate(pipe).to_list(limit)
        return [{'symbol': r['_id'], 'tx_count': r['tx_count'], 'volume': r['volume'], 'units': r['units']} for r in res]

    @router.get('/reports/top-users')
    async def top_users(admin=Depends(require_admin), limit: int = 10):
        pipe = [
            {'$match': {'type': {'$in': ['Alım', 'Satım']}}},
            {'$group': {'_id': '$user_id', 'tx_count': {'$sum': 1}, 'volume': {'$sum': '$total'}}},
            {'$sort': {'volume': -1}},
            {'$limit': limit},
        ]
        res = await db.transactions.aggregate(pipe).to_list(limit)
        out = []
        for r in res:
            u = await db.users.find_one({'_id': r['_id']})
            out.append({
                'user_id': r['_id'],
                'email': (u or {}).get('email', '-'),
                'full_name': (u or {}).get('full_name', '-'),
                'tx_count': r['tx_count'], 'volume': r['volume'],
                'cash_balance': (u or {}).get('cash_balance', 0),
            })
        return out

    @router.get('/reports/holdings-distribution')
    async def holdings_dist(admin=Depends(require_admin)):
        pipe = [
            {'$group': {'_id': '$code', 'total_units': {'$sum': '$units'}, 'user_count': {'$sum': 1}}},
            {'$sort': {'user_count': -1}},
        ]
        res = await db.holdings.aggregate(pipe).to_list(200)
        return [{'symbol': r['_id'], 'total_units': r['total_units'], 'user_count': r['user_count']} for r in res]

    # ---------- ADMINS ----------
    @router.get('/admins')
    async def list_admins(admin=Depends(require_admin)):
        admins = await db.users.find({'role': 'admin'}).to_list(100)
        return [await _user_summary(a) for a in admins]

    @router.post('/admins')
    async def create_admin(body: CreateAdminIn, admin=Depends(require_admin)):
        if await db.users.find_one({'email': body.email.lower()}):
            raise HTTPException(409, 'Bu e-posta zaten kayıtlı')
        new_admin = {
            '_id': new_id(),
            'email': body.email.lower(), 'full_name': body.full_name,
            'password_hash': hash_password(body.password),
            'role': 'admin', 'cash_balance': 0.0, 'total_deposits': 0.0,
            'kyc_status': 'approved',
            'created_at': datetime.now(timezone.utc),
        }
        await db.users.insert_one(new_admin)
        await _audit(admin['_id'], 'admin.create', new_admin['_id'], {'email': body.email})
        return await _user_summary(new_admin)

    # ---------- SETTINGS ----------
    DEFAULT_SETTINGS = {
        '_id': 'global',
        'commission_rate': 0.0,
        'min_trade_amount': 1.0,
        'max_trade_amount': 1_000_000.0,
        'min_deposit': 100.0,
        'max_withdraw': 100_000.0,
        'maintenance_mode': False,
        'announcement': '',
    }

    @router.get('/settings')
    async def get_settings(admin=Depends(require_admin)):
        s = await db.settings.find_one({'_id': 'global'})
        if not s:
            await db.settings.insert_one(DEFAULT_SETTINGS)
            s = DEFAULT_SETTINGS.copy()
        s.pop('_id', None)
        return s

    @router.patch('/settings')
    async def update_settings(body: SettingsIn, admin=Depends(require_admin)):
        upd = {k: v for k, v in body.dict().items() if v is not None}
        if upd:
            await db.settings.update_one({'_id': 'global'}, {'$set': upd}, upsert=True)
            await _audit(admin['_id'], 'settings.update', None, upd)
        s = await db.settings.find_one({'_id': 'global'}) or DEFAULT_SETTINGS.copy()
        s.pop('_id', None)
        return s

    # ---------- AUDIT LOG ----------
    @router.get('/audit-log')
    async def audit_log(admin=Depends(require_admin), skip: int = 0, limit: int = 100):
        total = await db.audit_log.count_documents({})
        items = await db.audit_log.find().sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
        out = []
        for it in items:
            adm = await db.users.find_one({'_id': it['admin_id']}, {'email': 1, 'full_name': 1})
            out.append({
                'id': it['_id'],
                'action': it['action'],
                'target_id': it.get('target_id'),
                'meta': it.get('meta', {}),
                'created_at': it['created_at'],
                'admin_email': (adm or {}).get('email', '-'),
                'admin_name': (adm or {}).get('full_name', '-'),
            })
        return {'total': total, 'items': out}

    # ---------- PAYMENT METHODS ----------
    def _pm_out(d: dict) -> dict:
        return {
            'id': d['_id'], 'type': d.get('type'), 'label': d.get('label'),
            'bank_name': d.get('bank_name'), 'account_holder': d.get('account_holder'),
            'iban': d.get('iban'), 'account_number': d.get('account_number'),
            'branch': d.get('branch'),
            'currency': d.get('currency'), 'network': d.get('network'),
            'address': d.get('address'), 'memo': d.get('memo'),
            'active': bool(d.get('active', True)),
            'notes': d.get('notes'),
            'created_at': d.get('created_at'),
        }

    @router.get('/payment-methods')
    async def list_payment_methods(admin=Depends(require_admin), type: Optional[str] = None):
        q = {}
        if type and type != 'all': q['type'] = type
        items = await db.payment_methods.find(q).sort('created_at', -1).to_list(200)
        return [_pm_out(d) for d in items]

    @router.post('/payment-methods')
    async def create_payment_method(body: PaymentMethodIn, admin=Depends(require_admin)):
        doc = {'_id': new_id(), **body.dict(), 'created_at': datetime.now(timezone.utc)}
        await db.payment_methods.insert_one(doc)
        await _audit(admin['_id'], 'payment_method.create', doc['_id'], {'type': doc['type'], 'label': doc['label']})
        return _pm_out(doc)

    @router.patch('/payment-methods/{pm_id}')
    async def update_payment_method(pm_id: str, body: PaymentMethodIn, admin=Depends(require_admin)):
        upd = {k: v for k, v in body.dict().items() if v is not None}
        if upd:
            await db.payment_methods.update_one({'_id': pm_id}, {'$set': upd})
            await _audit(admin['_id'], 'payment_method.update', pm_id, upd)
        d = await db.payment_methods.find_one({'_id': pm_id})
        if not d: raise HTTPException(404, 'Bulunamadı')
        return _pm_out(d)

    @router.delete('/payment-methods/{pm_id}')
    async def delete_payment_method(pm_id: str, admin=Depends(require_admin)):
        r = await db.payment_methods.delete_one({'_id': pm_id})
        if r.deleted_count == 0: raise HTTPException(404, 'Bulunamadı')
        await _audit(admin['_id'], 'payment_method.delete', pm_id)
        return {'ok': True}

    # ---------- DEPOSIT REQUESTS ----------
    async def _dr_out(d: dict) -> dict:
        u = await db.users.find_one({'_id': d['user_id']}, {'email': 1, 'full_name': 1})
        pm = await db.payment_methods.find_one({'_id': d.get('payment_method_id')}) if d.get('payment_method_id') else None
        return {
            'id': d['_id'], 'user_id': d['user_id'],
            'user_email': (u or {}).get('email', '-'),
            'user_name': (u or {}).get('full_name', '-'),
            'amount': d.get('amount'),
            'status': d.get('status'),
            'payment_method_id': d.get('payment_method_id'),
            'payment_method_label': (pm or {}).get('label', '-'),
            'payment_method_type': (pm or {}).get('type', '-'),
            'sender_name': d.get('sender_name'),
            'note': d.get('note'),
            'tx_hash': d.get('tx_hash'),
            'has_receipt': bool(d.get('receipt_base64')),
            'rejection_reason': d.get('rejection_reason'),
            'created_at': d.get('created_at'),
            'reviewed_at': d.get('reviewed_at'),
        }

    @router.get('/deposit-requests')
    async def list_deposit_requests(admin=Depends(require_admin), status: Optional[str] = None, skip: int = 0, limit: int = 100):
        q = {}
        if status and status != 'all': q['status'] = status
        total = await db.deposit_requests.count_documents(q)
        items = await db.deposit_requests.find(q).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
        out = [await _dr_out(d) for d in items]
        return {'total': total, 'items': out}

    @router.get('/deposit-requests/{req_id}')
    async def deposit_request_detail(req_id: str, admin=Depends(require_admin)):
        d = await db.deposit_requests.find_one({'_id': req_id})
        if not d: raise HTTPException(404, 'Bulunamadı')
        base = await _dr_out(d)
        base['receipt_base64'] = d.get('receipt_base64')
        return base

    @router.post('/deposit-requests/{req_id}/approve')
    async def approve_deposit_request(req_id: str, admin=Depends(require_admin)):
        d = await db.deposit_requests.find_one({'_id': req_id})
        if not d: raise HTTPException(404, 'Bulunamadı')
        if d.get('status') != 'pending':
            raise HTTPException(400, 'Sadece beklemedeki talepler onaylanabilir')
        amount = float(d['amount'])
        uid = d['user_id']
        u = await db.users.find_one({'_id': uid})
        if not u: raise HTTPException(404, 'Kullanıcı bulunamadı')
        new_cash = u.get('cash_balance', 0) + amount
        new_total = u.get('total_deposits', 0) + amount
        await db.users.update_one({'_id': uid}, {'$set': {'cash_balance': new_cash, 'total_deposits': new_total}})
        await db.deposit_requests.update_one({'_id': req_id}, {'$set': {
            'status': 'approved',
            'reviewed_at': datetime.now(timezone.utc),
            'reviewed_by': admin['_id'],
        }})
        # record as transaction
        await db.transactions.insert_one({
            '_id': new_id(), 'user_id': uid,
            'date': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M'),
            'type': 'Para Yatırma', 'code': '-', 'units': 0, 'price': 0,
            'total': amount, 'status': 'Gerçekleşti',
            'deposit_request_id': req_id,
        })
        await _audit(admin['_id'], 'deposit_request.approve', req_id, {'user_id': uid, 'amount': amount})
        return {'ok': True}

    @router.post('/deposit-requests/{req_id}/reject')
    async def reject_deposit_request(req_id: str, body: DepositActionIn, admin=Depends(require_admin)):
        d = await db.deposit_requests.find_one({'_id': req_id})
        if not d: raise HTTPException(404, 'Bulunamadı')
        if d.get('status') != 'pending':
            raise HTTPException(400, 'Sadece beklemedeki talepler reddedilebilir')
        await db.deposit_requests.update_one({'_id': req_id}, {'$set': {
            'status': 'rejected',
            'reviewed_at': datetime.now(timezone.utc),
            'reviewed_by': admin['_id'],
            'rejection_reason': body.reason or '',
        }})
        await _audit(admin['_id'], 'deposit_request.reject', req_id, {'reason': body.reason})
        return {'ok': True}

    return router


async def seed_default_admin(db, hash_password_fn):
    """Create default admin user if no admin exists."""
    exists = await db.users.find_one({'role': 'admin'})
    if exists:
        return
    from models import new_id
    admin_doc = {
        '_id': new_id(),
        'email': 'admin@fonakis.com', 'full_name': 'FonAkış Admin',
        'password_hash': hash_password_fn('admin1234'),
        'role': 'admin', 'cash_balance': 0.0, 'total_deposits': 0.0,
        'kyc_status': 'approved',
        'created_at': datetime.now(timezone.utc),
    }
    try:
        await db.users.insert_one(admin_doc)
        logger.info('Default admin seeded: admin@fonakis.com / admin1234')
    except Exception as e:
        logger.warning('Admin seed failed: %s', e)
