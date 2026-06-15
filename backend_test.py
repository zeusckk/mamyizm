#!/usr/bin/env python3
"""
FonAkış Backend API Test Suite
Tests all backend endpoints with full lifecycle scenario
"""
import requests
import json
import sys
from datetime import datetime

# Read backend URL from frontend/.env
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=')[1].strip()
            break

API_BASE = f"{BACKEND_URL}/api"

# Test data
TEST_EMAIL = f"test_{datetime.now().timestamp()}@fonakis.com"
TEST_PASSWORD = "test123456"
TEST_FULL_NAME = "Ahmet Yılmaz"
TEST_PHONE = "+905551234567"
TEST_TCKN = "12345678901"

# Global state
token = None
user_id = None

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_test(name):
    print(f"\n{Colors.BLUE}[TEST]{Colors.END} {name}")

def log_success(msg):
    print(f"  {Colors.GREEN}✓{Colors.END} {msg}")

def log_error(msg):
    print(f"  {Colors.RED}✗{Colors.END} {msg}")

def log_info(msg):
    print(f"  {Colors.YELLOW}ℹ{Colors.END} {msg}")

def assert_status(response, expected, test_name):
    if response.status_code == expected:
        log_success(f"Status {response.status_code} (expected {expected})")
        return True
    else:
        log_error(f"Status {response.status_code}, expected {expected}")
        log_error(f"Response: {response.text}")
        return False

def assert_field(data, field, test_name):
    if field in data:
        log_success(f"Field '{field}' present")
        return True
    else:
        log_error(f"Field '{field}' missing in response")
        log_error(f"Response data: {json.dumps(data, indent=2)}")
        return False

# Test 1: Register
def test_register():
    global token, user_id
    log_test("1. POST /api/auth/register")
    
    payload = {
        "full_name": TEST_FULL_NAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "phone": TEST_PHONE,
        "tckn": TEST_TCKN
    }
    
    response = requests.post(f"{API_BASE}/auth/register", json=payload)
    
    if not assert_status(response, 200, "register"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'token', 'register')
    success &= assert_field(data, 'user', 'register')
    
    if 'token' in data:
        token = data['token']
        log_info(f"Token: {token[:20]}...")
    
    if 'user' in data:
        user_id = data['user'].get('id')
        log_info(f"User ID: {user_id}")
        log_info(f"Email: {data['user'].get('email')}")
    
    return success

# Test 2: Login with same credentials
def test_login():
    global token
    log_test("2. POST /api/auth/login (correct credentials)")
    
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=payload)
    
    if not assert_status(response, 200, "login"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'token', 'login')
    success &= assert_field(data, 'user', 'login')
    
    if 'token' in data:
        token = data['token']
        log_success("Login successful, token updated")
    
    return success

# Test 3: Login with wrong password
def test_login_wrong_password():
    log_test("3. POST /api/auth/login (wrong password)")
    
    payload = {
        "email": TEST_EMAIL,
        "password": "wrongpassword123"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=payload)
    
    return assert_status(response, 401, "login_wrong_password")

# Test 4: GET /auth/me with token
def test_auth_me_with_token():
    log_test("4. GET /api/auth/me (with Bearer token)")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/auth/me", headers=headers)
    
    if not assert_status(response, 200, "auth_me"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'user', 'auth_me')
    
    if 'user' in data:
        log_info(f"User: {data['user'].get('full_name')} ({data['user'].get('email')})")
    
    return success

# Test 5: GET /auth/me without token
def test_auth_me_without_token():
    log_test("5. GET /api/auth/me (without token)")
    
    response = requests.get(f"{API_BASE}/auth/me")
    
    return assert_status(response, 401, "auth_me_no_token")

# Test 6: PATCH /auth/profile
def test_update_profile():
    log_test("6. PATCH /api/auth/profile")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "full_name": "Mehmet Demir",
        "phone": "+905559876543"
    }
    
    response = requests.patch(f"{API_BASE}/auth/profile", json=payload, headers=headers)
    
    if not assert_status(response, 200, "update_profile"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'user', 'update_profile')
    
    if 'user' in data:
        if data['user'].get('full_name') == "Mehmet Demir":
            log_success("Full name updated correctly")
        else:
            log_error(f"Full name not updated: {data['user'].get('full_name')}")
            success = False
        
        if data['user'].get('phone') == "+905559876543":
            log_success("Phone updated correctly")
        else:
            log_error(f"Phone not updated: {data['user'].get('phone')}")
            success = False
    
    return success

# Test 7: Change password
def test_change_password():
    global token
    log_test("7a. POST /api/auth/change-password (wrong current)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "current": "wrongpassword",
        "next": "newpassword123"
    }
    
    response = requests.post(f"{API_BASE}/auth/change-password", json=payload, headers=headers)
    
    if not assert_status(response, 400, "change_password_wrong"):
        return False
    
    log_test("7b. POST /api/auth/change-password (correct current)")
    
    payload = {
        "current": TEST_PASSWORD,
        "next": "newpassword123"
    }
    
    response = requests.post(f"{API_BASE}/auth/change-password", json=payload, headers=headers)
    
    if not assert_status(response, 200, "change_password_correct"):
        return False
    
    log_test("7c. Login with new password")
    
    login_payload = {
        "email": TEST_EMAIL,
        "password": "newpassword123"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=login_payload)
    
    if not assert_status(response, 200, "login_new_password"):
        return False
    
    data = response.json()
    if 'token' in data:
        token = data['token']
        log_success("Login with new password successful")
    
    return True

# Test 8: GET /funds
def test_list_funds():
    log_test("8. GET /api/funds")
    
    response = requests.get(f"{API_BASE}/funds")
    
    if not assert_status(response, 200, "list_funds"):
        return False
    
    data = response.json()
    
    if not isinstance(data, list):
        log_error("Response is not a list")
        return False
    
    if len(data) != 12:
        log_error(f"Expected 12 funds, got {len(data)}")
        return False
    
    log_success(f"Got {len(data)} funds")
    
    # Check first fund has required fields
    if len(data) > 0:
        fund = data[0]
        required_fields = ['code', 'name', 'category', 'category_label', 'price', 
                          'change_24h', 'change_ytd', 'risk', 'aum', 'manager', 
                          'currency', 'series', 'desc']
        
        success = True
        for field in required_fields:
            if field not in fund:
                log_error(f"Fund missing field: {field}")
                success = False
        
        if success:
            log_success("All required fields present in fund")
            log_info(f"Sample fund: {fund.get('code')} - {fund.get('name')}")
        
        return success
    
    return True

# Test 9: GET /funds/{code}
def test_get_fund():
    log_test("9. GET /api/funds/FAH")
    
    response = requests.get(f"{API_BASE}/funds/FAH")
    
    if not assert_status(response, 200, "get_fund"):
        return False
    
    data = response.json()
    
    if data.get('code') == 'FAH':
        log_success("Got correct fund")
        log_info(f"Fund: {data.get('name')}, Price: {data.get('price')}")
    else:
        log_error(f"Expected FAH, got {data.get('code')}")
        return False
    
    return True

# Test 10: GET /funds/NONEXIST
def test_get_fund_not_found():
    log_test("10. GET /api/funds/NONEXIST")
    
    response = requests.get(f"{API_BASE}/funds/NONEXIST")
    
    return assert_status(response, 404, "get_fund_not_found")

# Test 11: GET /portfolio (initial)
def test_portfolio_initial():
    log_test("11. GET /api/portfolio (initial)")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/portfolio", headers=headers)
    
    if not assert_status(response, 200, "portfolio_initial"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'cash_balance', 'portfolio')
    success &= assert_field(data, 'holdings', 'portfolio')
    success &= assert_field(data, 'total_value', 'portfolio')
    success &= assert_field(data, 'total_cost', 'portfolio')
    success &= assert_field(data, 'total_pl', 'portfolio')
    
    if data.get('cash_balance') == 0:
        log_success("Initial cash_balance is 0")
    else:
        log_error(f"Expected cash_balance 0, got {data.get('cash_balance')}")
        success = False
    
    if isinstance(data.get('holdings'), list) and len(data.get('holdings')) == 0:
        log_success("Initial holdings is empty list")
    else:
        log_error(f"Expected empty holdings, got {data.get('holdings')}")
        success = False
    
    return success

# Test 12: POST /cash/deposit
def test_deposit():
    log_test("12. POST /api/cash/deposit (10000)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"amount": 10000}
    
    response = requests.post(f"{API_BASE}/cash/deposit", json=payload, headers=headers)
    
    if not assert_status(response, 200, "deposit"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'cash_balance', 'deposit')
    success &= assert_field(data, 'transaction', 'deposit')
    
    if data.get('cash_balance') == 10000:
        log_success("Cash balance is 10000")
    else:
        log_error(f"Expected cash_balance 10000, got {data.get('cash_balance')}")
        success = False
    
    return success

# Test 13: POST /trade/buy (first)
def test_buy_first():
    log_test("13. POST /api/trade/buy (FAH, 100 units)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"code": "FAH", "units": 100}
    
    response = requests.post(f"{API_BASE}/trade/buy", json=payload, headers=headers)
    
    if not assert_status(response, 200, "buy_first"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'ok', 'buy')
    success &= assert_field(data, 'cash_balance', 'buy')
    success &= assert_field(data, 'transaction', 'buy')
    
    if data.get('ok'):
        log_success("Buy successful")
    
    # Cash should be deducted (FAH price is 12.4581, so 100 * 12.4581 = 1245.81)
    expected_cash = 10000 - (100 * 12.4581)
    if abs(data.get('cash_balance', 0) - expected_cash) < 1:
        log_success(f"Cash deducted correctly: {data.get('cash_balance')}")
    else:
        log_error(f"Expected cash ~{expected_cash}, got {data.get('cash_balance')}")
        success = False
    
    return success

# Test 14: POST /trade/buy (second - same fund)
def test_buy_second():
    log_test("14. POST /api/trade/buy (FAH, 50 units - weighted avg)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"code": "FAH", "units": 50}
    
    response = requests.post(f"{API_BASE}/trade/buy", json=payload, headers=headers)
    
    if not assert_status(response, 200, "buy_second"):
        return False
    
    data = response.json()
    
    if data.get('ok'):
        log_success("Second buy successful")
        log_info(f"Cash balance: {data.get('cash_balance')}")
    
    return True

# Test 15: POST /trade/buy (insufficient balance)
def test_buy_insufficient():
    log_test("15. POST /api/trade/buy (FAH, 999999 units - insufficient)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"code": "FAH", "units": 999999}
    
    response = requests.post(f"{API_BASE}/trade/buy", json=payload, headers=headers)
    
    return assert_status(response, 400, "buy_insufficient")

# Test 16: GET /portfolio (with holdings)
def test_portfolio_with_holdings():
    log_test("16. GET /api/portfolio (with holdings)")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/portfolio", headers=headers)
    
    if not assert_status(response, 200, "portfolio_holdings"):
        return False
    
    data = response.json()
    
    success = True
    
    if not isinstance(data.get('holdings'), list):
        log_error("Holdings is not a list")
        return False
    
    if len(data.get('holdings')) == 0:
        log_error("Holdings is empty, expected FAH")
        return False
    
    log_success(f"Got {len(data.get('holdings'))} holding(s)")
    
    # Find FAH holding
    fah_holding = None
    for h in data.get('holdings', []):
        if h.get('code') == 'FAH':
            fah_holding = h
            break
    
    if not fah_holding:
        log_error("FAH holding not found")
        return False
    
    log_success("FAH holding found")
    
    if fah_holding.get('units') == 150:
        log_success("FAH units is 150 (100 + 50)")
    else:
        log_error(f"Expected 150 units, got {fah_holding.get('units')}")
        success = False
    
    if 'avg_cost' in fah_holding:
        log_success(f"Avg cost: {fah_holding.get('avg_cost')}")
    
    if 'current_price' in fah_holding:
        log_success(f"Current price: {fah_holding.get('current_price')}")
    
    if 'total_value' in data:
        log_success(f"Total value: {data.get('total_value')}")
    
    if 'total_cost' in data:
        log_success(f"Total cost: {data.get('total_cost')}")
    
    if 'total_pl' in data:
        log_success(f"Total P/L: {data.get('total_pl')}")
    
    return success

# Test 17: POST /trade/sell
def test_sell():
    log_test("17. POST /api/trade/sell (FAH, 50 units)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"code": "FAH", "units": 50}
    
    response = requests.post(f"{API_BASE}/trade/sell", json=payload, headers=headers)
    
    if not assert_status(response, 200, "sell"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'ok', 'sell')
    success &= assert_field(data, 'cash_balance', 'sell')
    
    if data.get('ok'):
        log_success("Sell successful")
        log_info(f"Cash balance: {data.get('cash_balance')}")
    
    # Verify units left is 100
    headers = {"Authorization": f"Bearer {token}"}
    portfolio_response = requests.get(f"{API_BASE}/portfolio", headers=headers)
    
    if portfolio_response.status_code == 200:
        portfolio_data = portfolio_response.json()
        fah_holding = None
        for h in portfolio_data.get('holdings', []):
            if h.get('code') == 'FAH':
                fah_holding = h
                break
        
        if fah_holding and fah_holding.get('units') == 100:
            log_success("FAH units left is 100")
        else:
            log_error(f"Expected 100 units left, got {fah_holding.get('units') if fah_holding else 'no holding'}")
            success = False
    
    return success

# Test 18: POST /trade/sell (insufficient units)
def test_sell_insufficient():
    log_test("18. POST /api/trade/sell (FAH, 10000 units - insufficient)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"code": "FAH", "units": 10000}
    
    response = requests.post(f"{API_BASE}/trade/sell", json=payload, headers=headers)
    
    return assert_status(response, 400, "sell_insufficient")

# Test 19: POST /trade/sell (no holding)
def test_sell_no_holding():
    log_test("19. POST /api/trade/sell (FPL, 1 unit - no holding)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"code": "FPL", "units": 1}
    
    response = requests.post(f"{API_BASE}/trade/sell", json=payload, headers=headers)
    
    return assert_status(response, 400, "sell_no_holding")

# Test 20: POST /cash/withdraw (insufficient)
def test_withdraw_insufficient():
    log_test("20. POST /api/cash/withdraw (99999999 - insufficient)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"amount": 99999999}
    
    response = requests.post(f"{API_BASE}/cash/withdraw", json=payload, headers=headers)
    
    return assert_status(response, 400, "withdraw_insufficient")

# Test 21: POST /cash/withdraw
def test_withdraw():
    log_test("21. POST /api/cash/withdraw (100)")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"amount": 100}
    
    response = requests.post(f"{API_BASE}/cash/withdraw", json=payload, headers=headers)
    
    if not assert_status(response, 200, "withdraw"):
        return False
    
    data = response.json()
    
    success = True
    success &= assert_field(data, 'cash_balance', 'withdraw')
    success &= assert_field(data, 'transaction', 'withdraw')
    
    log_info(f"Cash balance after withdraw: {data.get('cash_balance')}")
    
    return success

# Test 22: GET /transactions
def test_list_transactions():
    log_test("22. GET /api/transactions")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/transactions", headers=headers)
    
    if not assert_status(response, 200, "list_transactions"):
        return False
    
    data = response.json()
    
    if not isinstance(data, list):
        log_error("Response is not a list")
        return False
    
    log_success(f"Got {len(data)} transactions")
    
    # Should have: 1 deposit, 2 buys, 1 sell, 1 withdraw = 5 transactions
    if len(data) >= 5:
        log_success("Has expected number of transactions (>=5)")
    else:
        log_error(f"Expected at least 5 transactions, got {len(data)}")
        return False
    
    # Check transaction types
    types = [t.get('type') for t in data]
    log_info(f"Transaction types: {types}")
    
    # Verify sorted by date desc (most recent first)
    if len(data) > 1:
        dates = [t.get('date') for t in data]
        if dates == sorted(dates, reverse=True):
            log_success("Transactions sorted by date desc")
        else:
            log_error("Transactions not sorted correctly")
            return False
    
    return True

# Test 23: GET /transactions with filter
def test_list_transactions_filtered():
    log_test("23. GET /api/transactions?type=Alım")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/transactions?type=Alım", headers=headers)
    
    if not assert_status(response, 200, "list_transactions_filtered"):
        return False
    
    data = response.json()
    
    if not isinstance(data, list):
        log_error("Response is not a list")
        return False
    
    log_success(f"Got {len(data)} Alım transactions")
    
    # Should have 2 buy transactions
    if len(data) == 2:
        log_success("Correct number of Alım transactions")
    else:
        log_error(f"Expected 2 Alım transactions, got {len(data)}")
        return False
    
    # Verify all are Alım type
    for t in data:
        if t.get('type') != 'Alım':
            log_error(f"Found non-Alım transaction: {t.get('type')}")
            return False
    
    log_success("All transactions are Alım type")
    
    return True

# Test 24: GET /news
def test_list_news():
    log_test("24. GET /api/news")
    
    response = requests.get(f"{API_BASE}/news")
    
    if not assert_status(response, 200, "list_news"):
        return False
    
    data = response.json()
    
    if not isinstance(data, list):
        log_error("Response is not a list")
        return False
    
    if len(data) != 6:
        log_error(f"Expected 6 news items, got {len(data)}")
        return False
    
    log_success(f"Got {len(data)} news items")
    
    # Check first news has required fields
    if len(data) > 0:
        news = data[0]
        required_fields = ['id', 'date', 'tag', 'title', 'summary']
        
        success = True
        for field in required_fields:
            if field not in news:
                log_error(f"News missing field: {field}")
                success = False
        
        if success:
            log_success("All required fields present in news")
            log_info(f"Sample news: {news.get('title')}")
        
        return success
    
    return True

# Main test runner
def main():
    print(f"\n{'='*80}")
    print(f"{Colors.BLUE}FonAkış Backend API Test Suite{Colors.END}")
    print(f"Backend URL: {API_BASE}")
    print(f"{'='*80}")
    
    tests = [
        ("Register", test_register),
        ("Login", test_login),
        ("Login Wrong Password", test_login_wrong_password),
        ("Auth Me With Token", test_auth_me_with_token),
        ("Auth Me Without Token", test_auth_me_without_token),
        ("Update Profile", test_update_profile),
        ("Change Password", test_change_password),
        ("List Funds", test_list_funds),
        ("Get Fund", test_get_fund),
        ("Get Fund Not Found", test_get_fund_not_found),
        ("Portfolio Initial", test_portfolio_initial),
        ("Deposit", test_deposit),
        ("Buy First", test_buy_first),
        ("Buy Second", test_buy_second),
        ("Buy Insufficient", test_buy_insufficient),
        ("Portfolio With Holdings", test_portfolio_with_holdings),
        ("Sell", test_sell),
        ("Sell Insufficient", test_sell_insufficient),
        ("Sell No Holding", test_sell_no_holding),
        ("Withdraw Insufficient", test_withdraw_insufficient),
        ("Withdraw", test_withdraw),
        ("List Transactions", test_list_transactions),
        ("List Transactions Filtered", test_list_transactions_filtered),
        ("List News", test_list_news),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            result = test_func()
            if result:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            log_error(f"Exception in {name}: {str(e)}")
            failed += 1
    
    print(f"\n{'='*80}")
    print(f"{Colors.BLUE}Test Summary{Colors.END}")
    print(f"{'='*80}")
    print(f"Total: {passed + failed}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    print(f"{'='*80}\n")
    
    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
