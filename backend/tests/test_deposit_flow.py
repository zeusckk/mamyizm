"""Backend tests for deposit-request flow + payment methods (admin) + sanity checks.

Covers:
  - Admin payment-methods CRUD (bank + crypto)
  - User listing of active payment methods
  - User deposit request creation (verifies balance NOT credited yet)
  - User /api/deposit-requests listing
  - Admin /api/admin/deposit-requests listing
  - Admin approve credits balance + creates Para Yatırma transaction
  - Admin reject does not change balance
  - Approve already-approved -> 400
  - Invalid payment_method_id -> 404
  - Sanity: /api/auth/me, /api/portfolio, /api/transactions, /api/cash/withdraw, /api/admin/transactions, /api/admin/stats.deposits.pending
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://access-test-12.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = 'admin@fonakis.com'
ADMIN_PASSWORD = 'admin1234'


# ---------------- fixtures ----------------
@pytest.fixture(scope='module')
def admin_token():
    r = requests.post(f"{API}/auth/login", json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()['token']


@pytest.fixture(scope='module')
def admin_headers(admin_token):
    return {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}


@pytest.fixture(scope='module')
def user_creds():
    ts = int(time.time() * 1000)
    return {
        'full_name': 'Deposit Tester',
        'email': f'TEST_dep_{ts}@fonakis.com',
        'password': 'test1234',
    }


@pytest.fixture(scope='module')
def user_session(user_creds):
    r = requests.post(f"{API}/auth/register", json=user_creds)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {'token': data['token'], 'user_id': data['user']['id'], 'email': user_creds['email']}


@pytest.fixture(scope='module')
def user_headers(user_session):
    return {'Authorization': f"Bearer {user_session['token']}", 'Content-Type': 'application/json'}


# ---------------- payment methods CRUD ----------------
created_pms = []


class TestPaymentMethodsAdminCRUD:
    def test_create_bank_pm(self, admin_headers):
        body = {
            'type': 'bank', 'label': 'TEST_Garanti BBVA', 'bank_name': 'Garanti BBVA',
            'account_holder': 'FonAkış Ltd', 'iban': 'TR330006100519786457841326',
            'active': True,
        }
        r = requests.post(f"{API}/admin/payment-methods", json=body, headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d['type'] == 'bank' and d['iban'] == body['iban']
        assert d['active'] is True
        created_pms.append(d['id'])

    def test_create_crypto_pm(self, admin_headers):
        body = {
            'type': 'crypto', 'label': 'TEST_USDT TRC20', 'currency': 'USDT',
            'network': 'TRC20', 'address': 'TXabc123testaddress', 'active': True,
        }
        r = requests.post(f"{API}/admin/payment-methods", json=body, headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d['type'] == 'crypto' and d['address'] == 'TXabc123testaddress'
        created_pms.append(d['id'])

    def test_list_pms_admin(self, admin_headers):
        r = requests.get(f"{API}/admin/payment-methods", headers=admin_headers)
        assert r.status_code == 200
        ids = [x['id'] for x in r.json()]
        for pm_id in created_pms:
            assert pm_id in ids

    def test_patch_pm_toggle_active(self, admin_headers):
        pm_id = created_pms[0]
        # toggle off
        r = requests.patch(f"{API}/admin/payment-methods/{pm_id}",
                           json={'type': 'bank', 'label': 'TEST_Garanti BBVA', 'active': False},
                           headers=admin_headers)
        assert r.status_code == 200
        assert r.json()['active'] is False
        # back on
        r = requests.patch(f"{API}/admin/payment-methods/{pm_id}",
                           json={'type': 'bank', 'label': 'TEST_Garanti BBVA', 'active': True},
                           headers=admin_headers)
        assert r.status_code == 200
        assert r.json()['active'] is True


# ---------------- user list active PMs ----------------
class TestUserPaymentMethods:
    def test_user_lists_active_pms(self, user_headers):
        r = requests.get(f"{API}/payment-methods", headers=user_headers)
        assert r.status_code == 200, r.text
        items = r.json()
        ids = [x['id'] for x in items]
        for pm_id in created_pms:
            assert pm_id in ids, f"PM {pm_id} missing from user list"

    def test_no_auth_returns_401(self):
        r = requests.get(f"{API}/payment-methods")
        assert r.status_code in (401, 403)


# ---------------- deposit request flow ----------------
deposit_state = {}


class TestDepositRequestFlow:
    def test_user_creates_deposit_request_no_balance_change(self, user_headers, user_session):
        # balance before
        me = requests.get(f"{API}/auth/me", headers=user_headers).json()['user']
        before_cash = me.get('cash_balance', 0)
        before_deposits = me.get('total_deposits', 0)

        body = {
            'amount': 1500.0,
            'payment_method_id': created_pms[0],
            'sender_name': 'TEST Sender',
            'note': 'test deposit request',
        }
        r = requests.post(f"{API}/cash/deposit", json=body, headers=user_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get('ok') is True
        assert d.get('status') == 'pending'
        assert 'request_id' in d
        deposit_state['req_id'] = d['request_id']
        deposit_state['amount'] = body['amount']

        # verify balance unchanged
        me2 = requests.get(f"{API}/auth/me", headers=user_headers).json()['user']
        assert me2['cash_balance'] == before_cash, 'cash_balance should NOT change on pending request'
        assert me2['total_deposits'] == before_deposits, 'total_deposits should NOT change on pending'

    def test_invalid_payment_method_returns_404(self, user_headers):
        body = {'amount': 100.0, 'payment_method_id': 'does-not-exist-pm-id'}
        r = requests.post(f"{API}/cash/deposit", json=body, headers=user_headers)
        assert r.status_code == 404, r.text

    def test_user_lists_own_deposit_requests(self, user_headers):
        r = requests.get(f"{API}/deposit-requests", headers=user_headers)
        assert r.status_code == 200
        items = r.json()
        ids = [x['id'] for x in items]
        assert deposit_state['req_id'] in ids
        item = next(x for x in items if x['id'] == deposit_state['req_id'])
        assert item['status'] == 'pending'
        assert item['amount'] == deposit_state['amount']
        assert item.get('payment_method_label') and item['payment_method_label'] != '-'

    def test_admin_lists_pending_requests(self, admin_headers):
        r = requests.get(f"{API}/admin/deposit-requests", params={'status': 'pending'}, headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert 'items' in body
        ids = [x['id'] for x in body['items']]
        assert deposit_state['req_id'] in ids
        item = next(x for x in body['items'] if x['id'] == deposit_state['req_id'])
        assert item['user_email'].lower() != '-'
        assert item['payment_method_label'] != '-'
        assert item['payment_method_type'] in ('bank', 'crypto')

    def test_admin_approves_request_credits_balance_and_creates_tx(self, admin_headers, user_headers, user_session):
        # before
        me_before = requests.get(f"{API}/auth/me", headers=user_headers).json()['user']
        before_cash = me_before['cash_balance']
        before_deposits = me_before['total_deposits']

        r = requests.post(f"{API}/admin/deposit-requests/{deposit_state['req_id']}/approve", headers=admin_headers)
        assert r.status_code == 200, r.text

        # after — balance credited
        me_after = requests.get(f"{API}/auth/me", headers=user_headers).json()['user']
        assert me_after['cash_balance'] == before_cash + deposit_state['amount']
        assert me_after['total_deposits'] == before_deposits + deposit_state['amount']

        # transaction recorded
        txs = requests.get(f"{API}/transactions", headers=user_headers).json()
        para_yat = [t for t in txs if t['type'] == 'Para Yatırma' and t['total'] == deposit_state['amount']]
        assert len(para_yat) >= 1, 'Para Yatırma transaction was not created'

        # user-facing list now shows approved
        items = requests.get(f"{API}/deposit-requests", headers=user_headers).json()
        item = next(x for x in items if x['id'] == deposit_state['req_id'])
        assert item['status'] == 'approved'

    def test_approve_already_approved_returns_400(self, admin_headers):
        r = requests.post(f"{API}/admin/deposit-requests/{deposit_state['req_id']}/approve", headers=admin_headers)
        assert r.status_code == 400

    def test_reject_flow_does_not_credit_balance(self, admin_headers, user_headers):
        # create new request
        body = {'amount': 250.0, 'payment_method_id': created_pms[1], 'tx_hash': '0xabc', 'sender_name': 'TEST'}
        r = requests.post(f"{API}/cash/deposit", json=body, headers=user_headers)
        assert r.status_code == 200
        req_id = r.json()['request_id']

        me_before = requests.get(f"{API}/auth/me", headers=user_headers).json()['user']

        r2 = requests.post(f"{API}/admin/deposit-requests/{req_id}/reject",
                           json={'reason': 'TEST rejected reason'}, headers=admin_headers)
        assert r2.status_code == 200, r2.text

        me_after = requests.get(f"{API}/auth/me", headers=user_headers).json()['user']
        assert me_after['cash_balance'] == me_before['cash_balance'], 'reject should NOT change balance'
        assert me_after['total_deposits'] == me_before['total_deposits']

        items = requests.get(f"{API}/deposit-requests", headers=user_headers).json()
        item = next(x for x in items if x['id'] == req_id)
        assert item['status'] == 'rejected'
        assert item.get('rejection_reason') == 'TEST rejected reason'

        # no Para Yatırma transaction for this rejected amount
        txs = requests.get(f"{API}/transactions", headers=user_headers).json()
        assert not any(t['type'] == 'Para Yatırma' and t['total'] == 250.0 for t in txs)


# ---------------- sanity checks: existing flows still work ----------------
class TestSanityExistingFlows:
    def test_auth_me(self, user_headers):
        r = requests.get(f"{API}/auth/me", headers=user_headers)
        assert r.status_code == 200
        assert 'user' in r.json()

    def test_portfolio(self, user_headers):
        r = requests.get(f"{API}/portfolio", headers=user_headers)
        assert r.status_code == 200
        assert 'cash_balance' in r.json() and 'holdings' in r.json()

    def test_transactions_list(self, user_headers):
        r = requests.get(f"{API}/transactions", headers=user_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_withdraw_works(self, user_headers):
        # user should have balance from approved deposit (1500). Withdraw 100.
        me = requests.get(f"{API}/auth/me", headers=user_headers).json()['user']
        if me['cash_balance'] < 100:
            pytest.skip('insufficient balance for withdraw test')
        before = me['cash_balance']
        r = requests.post(f"{API}/cash/withdraw", json={'amount': 100.0}, headers=user_headers)
        assert r.status_code == 200, r.text
        assert r.json()['cash_balance'] == before - 100.0

    def test_buy_requires_kyc(self, user_headers):
        # user is not KYC approved → expect 403
        r = requests.post(f"{API}/trade/buy", json={'symbol': 'AKBNK', 'units': 1}, headers=user_headers)
        assert r.status_code in (403, 404, 503)  # 403 kyc, 404 sym (if no symbol), 503 price

    def test_admin_transactions_includes_user_deposit(self, admin_headers, user_session):
        r = requests.get(f"{API}/admin/transactions", params={'user_id': user_session['user_id']},
                         headers=admin_headers)
        assert r.status_code == 200
        body = r.json()
        assert 'items' in body
        # at least one Para Yatırma in admin view for this user
        types = [t['type'] for t in body['items']]
        assert 'Para Yatırma' in types, f"admin transactions missing Para Yatırma, got types={types}"

    def test_admin_stats_includes_deposits_pending(self, admin_headers):
        r = requests.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert 'deposits' in data
        assert 'pending' in data['deposits']
        assert isinstance(data['deposits']['pending'], int)


# ---------------- cleanup ----------------
def test_zz_cleanup_payment_methods(admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}
    for pm_id in created_pms:
        requests.delete(f"{API}/admin/payment-methods/{pm_id}", headers=headers)
