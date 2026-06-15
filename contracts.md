# FonAkış — Backend Contracts

## Goal
Replace frontend mock (data/mock.js + AuthContext localStorage state) with real REST APIs backed by MongoDB + JWT.

## Mocked data to replace
- `MOCK_USER` -> real user record returned by `/api/auth/me`
- `FUNDS` -> `/api/funds` (seeded on startup)
- `MOCK_HOLDINGS` -> `/api/portfolio/holdings`
- `MOCK_TRANSACTIONS` -> `/api/transactions`
- `MOCK_NEWS` -> `/api/news`
- localStorage cash / holdings / tx -> server-side per user

## Auth (JWT)
- `POST /api/auth/register` body: `{full_name, email, password, phone?, tckn?}` -> `{token, user}`
- `POST /api/auth/login` body: `{email, password}` -> `{token, user}`
- `GET  /api/auth/me` (Bearer) -> `{user}`
- `PATCH /api/auth/profile` (Bearer) body: partial user -> `{user}`
- `POST /api/auth/change-password` (Bearer) body: `{current, next}` -> `{ok}`

Token: HS256, exp 7d, payload `{sub: user_id}`. Header: `Authorization: Bearer <token>`.

## Funds (public, seeded)
- `GET  /api/funds` -> `[Fund]`
- `GET  /api/funds/{code}` -> `Fund`
Fund: `{code, name, category, category_label, price, change_24h, change_ytd, risk, aum, manager, min_buy, currency, series:[{d,v}], desc}`

## Portfolio (auth)
- `GET  /api/portfolio` -> `{cash_balance, holdings:[Holding], total_value, total_cost, total_pl, total_pl_pct}`
Holding: `{code, units, avg_cost, current_price}` (current_price joined live from fund)

## Trade (auth)
- `POST /api/trade/buy`  body: `{code, units}` -> `{ok, holding, cash_balance, transaction}`
- `POST /api/trade/sell` body: `{code, units}` -> same shape

## Cash (auth)
- `POST /api/cash/deposit`  body: `{amount}` -> `{cash_balance, transaction}`
- `POST /api/cash/withdraw` body: `{amount}` -> `{cash_balance, transaction}`

## Transactions (auth)
- `GET /api/transactions?type=&status=` -> `[Transaction]`
Transaction: `{id, date, type ('Alım'|'Satım'|'Para Yatırma'|'Para Çekme'), code, units, price, total, status}`

## News (public)
- `GET /api/news` -> `[News]`

## Frontend integration
- Add `/app/frontend/src/api/client.js` (axios instance with baseURL=`${REACT_APP_BACKEND_URL}/api`, attaches `Authorization` from localStorage).
- AuthContext.jsx: replace mock login/register/buy/sell/deposit/withdraw with API calls; remove localStorage for holdings/tx/cash; keep only `fonakis_token`.
- mock.js stays only for fallback constants (FUND_CATEGORIES, formatters). FUNDS/MOCK_* fetched from backend on mount.
- Pages fetch their own data via API (Dashboard, Funds, FundDetail, Portfolio, Transactions, AccountSummary, News).

## DB collections
- `users`     {_id, full_name, email(unique), password_hash, phone, tckn, iban_masked, cash_balance, created_at}
- `funds`     {_id=code, ...fund_fields}
- `holdings`  {_id, user_id, code, units, avg_cost} (unique user_id+code)
- `transactions` {_id, user_id, date, type, code, units, price, total, status}
- `news`      {_id, date, tag, title, summary}
