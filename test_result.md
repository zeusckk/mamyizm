#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build FonAkış - a Turkish investment/portfolio management platform inspired by ÖYAK Portföy.
  Full-stack app with JWT auth + MongoDB. Features: register/login, dashboard, fund browsing,
  buy/sell trades, portfolio tracking, cash deposit/withdraw, transaction history, news, profile.

backend:
  - task: "JWT Auth (register/login/me/profile/password) with KYC fields"
    implemented: true
    working: true
    file: "/app/backend/server.py, /app/backend/auth.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented register, login, /me, PATCH profile, change-password. JWT HS256 7d. bcrypt for passwords. Email unique index."
      - working: true
        agent: "testing"
        comment: "✓ All auth endpoints working correctly. Register creates user with JWT token. Login validates credentials (401 on wrong password). GET /me requires Bearer token (401 without). PATCH /profile updates user fields. Change-password validates current password (400 on wrong), updates hash, new password login works."
      - working: true
        agent: "testing"
        comment: "✓ POST-REFACTOR: Auth working with KYC fields. Register creates user with kyc_status='none'. GET /me returns kyc_status field. All auth flows validated."

  - task: "KYC document submission and approval flow"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/kyc/submit accepts selfie_base64 + id_doc_base64, validates size (<5MB selfie, <8MB ID), stores in kyc_documents collection, sets user.kyc_status='pending'. GET /api/kyc/status returns status + has_documents. POST /api/kyc/demo-approve instantly approves for testing."
      - working: true
        agent: "testing"
        comment: "✓ KYC flow working perfectly. Submit validates file sizes (413 for >5MB selfie). Status endpoint returns correct state. Demo-approve transitions pending->approved. Auth required (401 without token)."

  - task: "BIST stock trading with KYC enforcement"
    implemented: true
    working: true
    file: "/app/backend/server.py, /app/backend/market.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/trade/buy & /api/trade/sell now use {symbol, units} body (not {code, units}). Validates KYC status (403 if not approved). Fetches live prices from yfinance. Validates symbol exists in TRADABLE registry. Weighted avg cost calculation. Records transactions."
      - working: true
        agent: "testing"
        comment: "✓ Trading working with KYC enforcement. Buy/sell blocked with 403 if kyc_status != 'approved'. Old {code, units} format correctly rejected (422). Valid BIST symbols (THYAO.IS) work after KYC approval. Invalid symbols return 404. Partial sells work. Insufficient balance/units validated. CRITICAL BUG FIXED: Single-symbol yfinance fetch was returning price=0 due to MultiIndex DataFrame handling - fixed in market.py line 127."

  - task: "Portfolio with live BIST stock prices"
    implemented: true
    working: true
    file: "/app/backend/server.py, /app/backend/market.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/portfolio returns cash_balance + holdings with live prices from yfinance. Holdings show symbol, name, market='BIST', current_price, avg_cost, P/L calculations."
      - working: true
        agent: "testing"
        comment: "✓ Portfolio working with live prices. Holdings show correct BIST stock data (THYAO.IS: name='Türk Hava Yolları', market='BIST', current_price>0). P/L calculations accurate."

  - task: "Market data endpoints (stocks/indices/commodities/fx/crypto)"
    implemented: true
    working: true
    file: "/app/backend/server.py, /app/backend/market.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/market/{group} returns live data from yfinance. Stocks: 20 BIST stocks. Indices: 11 (BIST + global). Commodities, FX, Crypto also available. 90s cache TTL."
      - working: true
        agent: "testing"
        comment: "✓ Market endpoints working. Stocks: 20 BIST stocks, 19/20 with live prices (KOZAL.IS delisted per yfinance). Indices: 11 returned. All public endpoints, no auth required."

  - task: "Funds endpoints removed"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Funds collection dropped on startup. /api/funds endpoint removed (404). Old fund-based trading no longer supported."
      - working: true
        agent: "testing"
        comment: "✓ Funds correctly removed. GET /api/funds returns 404. Old fund codes rejected in trade endpoints."

  - task: "Cash deposit/withdraw"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/cash/deposit & withdraw. Updates user cash_balance and records transaction. Withdraw validates balance."
      - working: true
        agent: "testing"
        comment: "✓ Cash operations working. Deposit: adds amount to cash_balance, records transaction. Withdraw: validates balance (400 on insufficient), deducts amount, records transaction. Both return updated cash_balance and transaction details."
      - working: true
        agent: "testing"
        comment: "✓ POST-REFACTOR: Cash deposit works without KYC (as expected). Tested with 50000 TRY deposit."

  - task: "Transactions list with filters"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/transactions with optional type/status query filters, sorted by date desc."
      - working: true
        agent: "testing"
        comment: "✓ Transactions endpoint working. GET /api/transactions returns all user transactions sorted by date desc. Filter by type works correctly (tested with type=Alım, returned only buy transactions). All transaction fields present (id, date, type, code, units, price, total, status)."

  - task: "News endpoint (seeded)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Public GET /api/news returning 6 seeded items."
      - working: true
        agent: "testing"
        comment: "✓ News endpoint working. GET /api/news returns 6 seeded news items with all required fields (id, date, tag, title, summary). Public endpoint, no auth required."

frontend:
  - task: "Auth context wired to backend"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/context/AuthContext.jsx, /app/frontend/src/api/client.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "axios client with Bearer interceptor + 401 redirect. AuthContext uses real API for login/register/buy/sell/deposit/withdraw."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      MAJOR REFACTOR: Funds removed entirely. Trading now uses BIST stocks with live yfinance prices.
      Added KYC module (selfie + ID doc upload, base64 in MongoDB).
      Test new flows:
      1. Register -> kyc_status should be 'none'
      2. POST /api/cash/deposit works (no KYC needed)
      3. POST /api/trade/buy with valid BIST symbol (e.g. 'THYAO.IS') and units -> should fail 403 'KYC onayı gereklidir' if kyc_status != approved
      4. POST /api/kyc/submit with selfie_base64 + id_doc_base64 (small base64 strings ok) -> status -> 'pending'
      5. POST /api/kyc/demo-approve -> status -> 'approved'
      6. POST /api/trade/buy with THYAO.IS units=1 after KYC approved -> success
      7. POST /api/trade/sell with same symbol works
      8. GET /api/portfolio shows holdings with live prices (current_price > 0)
      9. GET /api/market/stocks returns BIST stocks with live prices
      10. GET /api/funds should return 404 or empty (funds removed); /api/trade/buy with old fund code like 'FAH' should return 404 'Sembol bulunamadı'.
      11. KYC validation: too-large base64 (e.g. selfie > 5MB equivalent) should return 413.
      12. POST /api/kyc/submit without auth -> 401.
      Backend uses live Yahoo Finance data so prices vary. Use any one BIST stock symbol that exists in market.TRADABLE list (THYAO.IS, AKBNK.IS, GARAN.IS, KCHOL.IS, etc).
  - agent: "testing"
    message: |
      ✅ BACKEND TESTING COMPLETE - ALL 24 TESTS PASSED
      
      Tested full lifecycle scenario:
      1. Auth: register, login (correct/wrong password), /me (with/without token), profile update, password change
      2. Funds: list 12 funds, get single fund, 404 for non-existent
      3. Portfolio: initial state, holdings with P/L calculations
      4. Trading: buy (single/multiple/insufficient), sell (success/insufficient/no holding), weighted avg cost
      5. Cash: deposit, withdraw (success/insufficient)
      6. Transactions: list all, filter by type, sorted desc
      7. News: list 6 items
      
      All endpoints return correct status codes, response shapes, and data.
      Validations working (insufficient balance, wrong password, missing holdings).
      Weighted average cost calculation verified.
      Transaction recording confirmed.
      
      Backend is production-ready. No issues found.
  - agent: "testing"
    message: |
      ✅ POST-REFACTOR TESTING COMPLETE - ALL 20 TESTS PASSED
      
      Comprehensive validation of major refactor (funds→BIST stocks + KYC):
      
      ✅ PASSED (20/20):
      1. Register user with kyc_status='none' ✓
      2. GET /me has kyc_status field ✓
      3. Cash deposit without KYC ✓
      4. Trade buy without KYC returns 403 ✓
      5. KYC status before submit (none, no docs) ✓
      6. KYC submit sets status to pending ✓
      7. KYC status after submit (pending, has docs) ✓
      8. Trade buy with pending KYC returns 403 ✓
      9. KYC demo-approve sets status to approved ✓
      10. Trade buy with approved KYC succeeds ✓
      11. Trade buy with invalid symbol returns 404 ✓
      12. Trade buy with old {code, units} format returns 422 ✓
      13. Trade sell partial succeeds ✓
      14. Trade sell without holding returns 400 ✓
      15. Portfolio shows live prices (THYAO.IS with yfinance data) ✓
      16. Market stocks endpoint (20 BIST stocks, 19/20 with prices) ✓
      17. Market indices endpoint (11 indices) ✓
      18. KYC submit with huge file returns 413 ✓
      19. KYC submit without auth returns 401 ✓
      20. Funds endpoint removed (404) ✓
      
      🐛 CRITICAL BUG FIXED:
      - market.py line 127: Single-symbol yfinance fetch was returning price=0 due to incorrect MultiIndex DataFrame handling. When fetching one symbol, yfinance returns columns like ('THYAO.IS', 'Close') but code was trying to access df['Close'] directly. Fixed by extracting the symbol-specific sub-dataframe first.
      
      📊 KEY VALIDATIONS:
      - KYC enforcement: Trade endpoints correctly block with 403 if kyc_status != 'approved'
      - Body format change: Old {code, units} correctly rejected with 422, new {symbol, units} works
      - Live prices: yfinance integration working (19/20 BIST stocks have data; KOZAL.IS delisted)
      - File size limits: KYC submit correctly rejects >5MB selfie with 413
      - Auth required: KYC endpoints return 401 without token
      - Funds removed: /api/funds returns 404, old fund codes rejected
      
      Backend refactor is production-ready. All critical flows validated.
