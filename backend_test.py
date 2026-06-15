#!/usr/bin/env python3
"""
FonAkış Backend Test Suite - Post-Refactor Validation
Tests KYC flow, BIST stock trading, and removal of funds endpoints.
"""
import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://access-test-12.preview.emergentagent.com/api"

# Test state
test_results = []
token = None
user_id = None


def log_test(name, passed, details=""):
    """Log test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    test_results.append({"name": name, "passed": passed, "details": details})
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")


def test_1_register_fresh_user():
    """Test 1: Register fresh user -> verify kyc_status == 'none'"""
    global token, user_id
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"test_kyc_{timestamp}@example.com"
    
    payload = {
        "full_name": "Ahmet Yılmaz",
        "email": email,
        "password": "Test123!",
        "phone": "+905551234567",
        "tckn": "12345678901"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("token")
            user = data.get("user", {})
            user_id = user.get("id")
            kyc_status = user.get("kyc_status")
            
            if kyc_status == "none":
                log_test("1. Register user with kyc_status='none'", True, 
                        f"User created: {email}, kyc_status={kyc_status}")
                return True
            else:
                log_test("1. Register user with kyc_status='none'", False, 
                        f"Expected kyc_status='none', got '{kyc_status}'")
                return False
        else:
            log_test("1. Register user with kyc_status='none'", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("1. Register user with kyc_status='none'", False, f"Exception: {e}")
        return False


def test_2_get_me_kyc_field():
    """Test 2: GET /api/auth/me -> verify kyc_status field present"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            user = data.get("user", {})
            if "kyc_status" in user:
                log_test("2. GET /me has kyc_status field", True, 
                        f"kyc_status={user['kyc_status']}")
                return True
            else:
                log_test("2. GET /me has kyc_status field", False, 
                        "kyc_status field missing")
                return False
        else:
            log_test("2. GET /me has kyc_status field", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("2. GET /me has kyc_status field", False, f"Exception: {e}")
        return False


def test_3_cash_deposit_no_kyc():
    """Test 3: POST /api/cash/deposit -> succeeds (no KYC needed)"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"amount": 50000}
    
    try:
        resp = requests.post(f"{BASE_URL}/cash/deposit", json=payload, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            cash_balance = data.get("cash_balance")
            log_test("3. Cash deposit without KYC", True, 
                    f"Deposited 50000, balance={cash_balance}")
            return True
        else:
            log_test("3. Cash deposit without KYC", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("3. Cash deposit without KYC", False, f"Exception: {e}")
        return False


def test_4_trade_buy_without_kyc():
    """Test 4: POST /api/trade/buy without KYC -> EXPECT 403"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"symbol": "THYAO.IS", "units": 1}
    
    try:
        resp = requests.post(f"{BASE_URL}/trade/buy", json=payload, headers=headers, timeout=10)
        if resp.status_code == 403:
            error_msg = resp.json().get("detail", "")
            if "KYC" in error_msg or "kyc" in error_msg.lower():
                log_test("4. Trade buy without KYC returns 403", True, 
                        f"Correctly blocked: {error_msg}")
                return True
            else:
                log_test("4. Trade buy without KYC returns 403", False, 
                        f"403 but wrong message: {error_msg}")
                return False
        else:
            log_test("4. Trade buy without KYC returns 403", False, 
                    f"Expected 403, got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("4. Trade buy without KYC returns 403", False, f"Exception: {e}")
        return False


def test_5_kyc_status_none():
    """Test 5: GET /api/kyc/status -> verify status='none', has_documents=False"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/kyc/status", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            status = data.get("status")
            has_docs = data.get("has_documents")
            
            if status == "none" and has_docs == False:
                log_test("5. KYC status before submit", True, 
                        f"status='none', has_documents=False")
                return True
            else:
                log_test("5. KYC status before submit", False, 
                        f"Expected status='none' & has_documents=False, got status='{status}', has_documents={has_docs}")
                return False
        else:
            log_test("5. KYC status before submit", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("5. KYC status before submit", False, f"Exception: {e}")
        return False


def test_6_kyc_submit():
    """Test 6: POST /api/kyc/submit with base64 docs -> verify ok=True, status='pending'"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create realistic base64 strings (small but valid)
    selfie_b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/" + "A" * 1000
    id_doc_b64 = "data:image/jpeg;base64," + "B" * 2000
    
    payload = {
        "selfie_base64": selfie_b64,
        "id_doc_base64": id_doc_b64,
        "id_doc_type": "tc_kimlik",
        "id_doc_filename": "kimlik.jpg",
        "id_doc_mime": "image/jpeg"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/kyc/submit", json=payload, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            ok = data.get("ok")
            user = data.get("user", {})
            kyc_status = user.get("kyc_status")
            
            if ok and kyc_status == "pending":
                log_test("6. KYC submit sets status to pending", True, 
                        f"ok=True, kyc_status='pending'")
                return True
            else:
                log_test("6. KYC submit sets status to pending", False, 
                        f"Expected ok=True & status='pending', got ok={ok}, status='{kyc_status}'")
                return False
        else:
            log_test("6. KYC submit sets status to pending", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("6. KYC submit sets status to pending", False, f"Exception: {e}")
        return False


def test_7_kyc_status_pending():
    """Test 7: GET /api/kyc/status -> status='pending', has_documents=True"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/kyc/status", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            status = data.get("status")
            has_docs = data.get("has_documents")
            
            if status == "pending" and has_docs == True:
                log_test("7. KYC status after submit", True, 
                        f"status='pending', has_documents=True")
                return True
            else:
                log_test("7. KYC status after submit", False, 
                        f"Expected status='pending' & has_documents=True, got status='{status}', has_documents={has_docs}")
                return False
        else:
            log_test("7. KYC status after submit", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("7. KYC status after submit", False, f"Exception: {e}")
        return False


def test_8_trade_buy_pending_kyc():
    """Test 8: POST /api/trade/buy with pending KYC -> STILL 403"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"symbol": "THYAO.IS", "units": 1}
    
    try:
        resp = requests.post(f"{BASE_URL}/trade/buy", json=payload, headers=headers, timeout=10)
        if resp.status_code == 403:
            log_test("8. Trade buy with pending KYC returns 403", True, 
                    "Correctly blocked (pending != approved)")
            return True
        else:
            log_test("8. Trade buy with pending KYC returns 403", False, 
                    f"Expected 403, got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("8. Trade buy with pending KYC returns 403", False, f"Exception: {e}")
        return False


def test_9_kyc_demo_approve():
    """Test 9: POST /api/kyc/demo-approve -> verify status='approved'"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.post(f"{BASE_URL}/kyc/demo-approve", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            ok = data.get("ok")
            user = data.get("user", {})
            kyc_status = user.get("kyc_status")
            
            if ok and kyc_status == "approved":
                log_test("9. KYC demo-approve sets status to approved", True, 
                        f"ok=True, kyc_status='approved'")
                return True
            else:
                log_test("9. KYC demo-approve sets status to approved", False, 
                        f"Expected ok=True & status='approved', got ok={ok}, status='{kyc_status}'")
                return False
        else:
            log_test("9. KYC demo-approve sets status to approved", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("9. KYC demo-approve sets status to approved", False, f"Exception: {e}")
        return False


def test_10_trade_buy_approved_kyc():
    """Test 10: POST /api/trade/buy with approved KYC -> SUCCESS"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"symbol": "THYAO.IS", "units": 1}
    
    try:
        resp = requests.post(f"{BASE_URL}/trade/buy", json=payload, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            ok = data.get("ok")
            cash_balance = data.get("cash_balance")
            transaction = data.get("transaction", {})
            
            if ok and transaction.get("type") == "Alım":
                log_test("10. Trade buy with approved KYC succeeds", True, 
                        f"Bought 1 THYAO.IS, new balance={cash_balance}")
                return True
            else:
                log_test("10. Trade buy with approved KYC succeeds", False, 
                        f"Unexpected response: {data}")
                return False
        else:
            log_test("10. Trade buy with approved KYC succeeds", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("10. Trade buy with approved KYC succeeds", False, f"Exception: {e}")
        return False


def test_11_trade_buy_invalid_symbol():
    """Test 11: POST /api/trade/buy with invalid symbol -> 404"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"symbol": "INVALID.IS", "units": 1}
    
    try:
        resp = requests.post(f"{BASE_URL}/trade/buy", json=payload, headers=headers, timeout=10)
        if resp.status_code == 404:
            error_msg = resp.json().get("detail", "")
            if "Sembol bulunamadı" in error_msg or "işleme kapalı" in error_msg:
                log_test("11. Trade buy with invalid symbol returns 404", True, 
                        f"Correctly rejected: {error_msg}")
                return True
            else:
                log_test("11. Trade buy with invalid symbol returns 404", False, 
                        f"404 but unexpected message: {error_msg}")
                return False
        else:
            log_test("11. Trade buy with invalid symbol returns 404", False, 
                    f"Expected 404, got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("11. Trade buy with invalid symbol returns 404", False, f"Exception: {e}")
        return False


def test_12_trade_buy_old_format():
    """Test 12: POST /api/trade/buy with old {code, units} format -> 422 validation error"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"code": "FAH", "units": 1}  # Old format
    
    try:
        resp = requests.post(f"{BASE_URL}/trade/buy", json=payload, headers=headers, timeout=10)
        if resp.status_code == 422:
            log_test("12. Trade buy with old format returns 422", True, 
                    "Correctly rejected old {code, units} format")
            return True
        else:
            log_test("12. Trade buy with old format returns 422", False, 
                    f"Expected 422, got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("12. Trade buy with old format returns 422", False, f"Exception: {e}")
        return False


def test_13_trade_sell_partial():
    """Test 13: POST /api/trade/sell partial -> success"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"symbol": "THYAO.IS", "units": 0.5}
    
    try:
        resp = requests.post(f"{BASE_URL}/trade/sell", json=payload, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            ok = data.get("ok")
            cash_balance = data.get("cash_balance")
            transaction = data.get("transaction", {})
            
            if ok and transaction.get("type") == "Satım":
                log_test("13. Trade sell partial succeeds", True, 
                        f"Sold 0.5 THYAO.IS, new balance={cash_balance}")
                return True
            else:
                log_test("13. Trade sell partial succeeds", False, 
                        f"Unexpected response: {data}")
                return False
        else:
            log_test("13. Trade sell partial succeeds", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("13. Trade sell partial succeeds", False, f"Exception: {e}")
        return False


def test_14_trade_sell_no_holding():
    """Test 14: POST /api/trade/sell non-existent holding -> 400"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"symbol": "AKBNK.IS", "units": 1}  # We don't own this
    
    try:
        resp = requests.post(f"{BASE_URL}/trade/sell", json=payload, headers=headers, timeout=10)
        if resp.status_code == 400:
            error_msg = resp.json().get("detail", "")
            if "Yetersiz" in error_msg or "pay" in error_msg:
                log_test("14. Trade sell without holding returns 400", True, 
                        f"Correctly rejected: {error_msg}")
                return True
            else:
                log_test("14. Trade sell without holding returns 400", False, 
                        f"400 but unexpected message: {error_msg}")
                return False
        else:
            log_test("14. Trade sell without holding returns 400", False, 
                    f"Expected 400, got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("14. Trade sell without holding returns 400", False, f"Exception: {e}")
        return False


def test_15_portfolio_live_prices():
    """Test 15: GET /api/portfolio -> verify holdings with current_price > 0"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/portfolio", headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            holdings = data.get("holdings", [])
            
            if len(holdings) > 0:
                thyao_holding = next((h for h in holdings if h["code"] == "THYAO.IS"), None)
                if thyao_holding:
                    current_price = thyao_holding.get("current_price", 0)
                    name = thyao_holding.get("name", "")
                    market = thyao_holding.get("market", "")
                    
                    if current_price > 0 and "Türk Hava Yolları" in name and market == "BIST":
                        log_test("15. Portfolio shows live prices", True, 
                                f"THYAO.IS: price={current_price}, name='{name}', market='{market}'")
                        return True
                    else:
                        log_test("15. Portfolio shows live prices", False, 
                                f"THYAO.IS found but price={current_price}, name='{name}', market='{market}'")
                        return False
                else:
                    log_test("15. Portfolio shows live prices", False, 
                            "THYAO.IS holding not found in portfolio")
                    return False
            else:
                log_test("15. Portfolio shows live prices", False, 
                        "No holdings in portfolio")
                return False
        else:
            log_test("15. Portfolio shows live prices", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("15. Portfolio shows live prices", False, f"Exception: {e}")
        return False


def test_16_market_stocks():
    """Test 16: GET /api/market/stocks -> verify 20 BIST stocks with live prices"""
    try:
        resp = requests.get(f"{BASE_URL}/market/stocks", timeout=20)
        if resp.status_code == 200:
            stocks = resp.json()
            
            if len(stocks) == 20:
                # Check how many have prices > 0 (some stocks may not have data from yfinance)
                stocks_with_prices = [s for s in stocks if s.get("price", 0) > 0]
                # Check if all are BIST stocks
                all_bist = all(s.get("market") == "BIST" for s in stocks)
                
                # Accept if at least 18/20 (90%) have prices - some stocks may be delisted or have data issues
                if len(stocks_with_prices) >= 18 and all_bist:
                    log_test("16. Market stocks endpoint", True, 
                            f"20 BIST stocks, {len(stocks_with_prices)} with live prices")
                    return True
                else:
                    log_test("16. Market stocks endpoint", False, 
                            f"20 stocks but only {len(stocks_with_prices)} have prices, all_bist={all_bist}")
                    return False
            else:
                log_test("16. Market stocks endpoint", False, 
                        f"Expected 20 stocks, got {len(stocks)}")
                return False
        else:
            log_test("16. Market stocks endpoint", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("16. Market stocks endpoint", False, f"Exception: {e}")
        return False


def test_17_market_indices():
    """Test 17: GET /api/market/indices -> verify 11 indices"""
    try:
        resp = requests.get(f"{BASE_URL}/market/indices", timeout=20)
        if resp.status_code == 200:
            indices = resp.json()
            
            if len(indices) == 11:
                log_test("17. Market indices endpoint", True, 
                        f"11 indices returned")
                return True
            else:
                log_test("17. Market indices endpoint", False, 
                        f"Expected 11 indices, got {len(indices)}")
                return False
        else:
            log_test("17. Market indices endpoint", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("17. Market indices endpoint", False, f"Exception: {e}")
        return False


def test_18_kyc_submit_too_large():
    """Test 18: POST /api/kyc/submit with huge base64 -> EXPECT 413"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a base64 string that's > 5MB for selfie (limit is 5MB)
    # base64 is ~4/3 of binary, so 5MB binary = ~6.67MB base64
    # Let's create ~7MB base64 to exceed the limit
    huge_selfie = "data:image/jpeg;base64," + "A" * (7 * 1024 * 1024)
    id_doc_b64 = "data:image/jpeg;base64," + "B" * 2000
    
    payload = {
        "selfie_base64": huge_selfie,
        "id_doc_base64": id_doc_b64,
        "id_doc_type": "tc_kimlik",
        "id_doc_filename": "kimlik.jpg",
        "id_doc_mime": "image/jpeg"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/kyc/submit", json=payload, headers=headers, timeout=30)
        if resp.status_code == 413:
            error_msg = resp.json().get("detail", "")
            if "çok büyük" in error_msg or "Dosya" in error_msg:
                log_test("18. KYC submit with huge file returns 413", True, 
                        f"Correctly rejected: {error_msg}")
                return True
            else:
                log_test("18. KYC submit with huge file returns 413", False, 
                        f"413 but unexpected message: {error_msg}")
                return False
        else:
            log_test("18. KYC submit with huge file returns 413", False, 
                    f"Expected 413, got {resp.status_code}")
            return False
    except Exception as e:
        log_test("18. KYC submit with huge file returns 413", False, f"Exception: {e}")
        return False


def test_19_kyc_submit_no_auth():
    """Test 19: POST /api/kyc/submit without auth -> 401"""
    payload = {
        "selfie_base64": "data:image/jpeg;base64," + "A" * 100,
        "id_doc_base64": "data:image/jpeg;base64," + "B" * 100,
        "id_doc_type": "tc_kimlik"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/kyc/submit", json=payload, timeout=10)
        if resp.status_code == 401:
            log_test("19. KYC submit without auth returns 401", True, 
                    "Correctly requires authentication")
            return True
        else:
            log_test("19. KYC submit without auth returns 401", False, 
                    f"Expected 401, got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("19. KYC submit without auth returns 401", False, f"Exception: {e}")
        return False


def test_20_funds_endpoint_removed():
    """Test 20: GET /api/funds -> 404 (endpoint removed)"""
    try:
        resp = requests.get(f"{BASE_URL}/funds", timeout=10)
        if resp.status_code == 404:
            log_test("20. Funds endpoint removed (404)", True, 
                    "Funds endpoint correctly removed")
            return True
        else:
            log_test("20. Funds endpoint removed (404)", False, 
                    f"Expected 404, got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("20. Funds endpoint removed (404)", False, f"Exception: {e}")
        return False


def main():
    """Run all tests in sequence."""
    print("=" * 80)
    print("FonAkış Backend Test Suite - Post-Refactor Validation")
    print("=" * 80)
    print()
    
    # Run tests in order
    tests = [
        test_1_register_fresh_user,
        test_2_get_me_kyc_field,
        test_3_cash_deposit_no_kyc,
        test_4_trade_buy_without_kyc,
        test_5_kyc_status_none,
        test_6_kyc_submit,
        test_7_kyc_status_pending,
        test_8_trade_buy_pending_kyc,
        test_9_kyc_demo_approve,
        test_10_trade_buy_approved_kyc,
        test_11_trade_buy_invalid_symbol,
        test_12_trade_buy_old_format,
        test_13_trade_sell_partial,
        test_14_trade_sell_no_holding,
        test_15_portfolio_live_prices,
        test_16_market_stocks,
        test_17_market_indices,
        test_18_kyc_submit_too_large,
        test_19_kyc_submit_no_auth,
        test_20_funds_endpoint_removed,
    ]
    
    for test_fn in tests:
        test_fn()
        print()
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for t in test_results if t["passed"])
    failed = sum(1 for t in test_results if not t["passed"])
    total = len(test_results)
    
    print(f"Total: {total} | Passed: {passed} | Failed: {failed}")
    print()
    
    if failed > 0:
        print("FAILED TESTS:")
        for t in test_results:
            if not t["passed"]:
                print(f"  ❌ {t['name']}")
                if t["details"]:
                    print(f"     {t['details']}")
        print()
    
    # Exit code
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
