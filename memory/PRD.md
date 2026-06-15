# FonAkış — Product Requirements

## Original Problem Statement
Build a full-stack TR investment & portfolio management platform (React + FastAPI + MongoDB) named **FonAkış** with:
- JWT user auth, KYC (selfie + ID) gating trading
- Real-time market data (BIST stocks, indices, crypto, forex, commodities) via yfinance
- Buy/sell, portfolio + transactions, mobile-responsive UI with Framer Motion
- Comprehensive **Admin Panel** with role-based access (`admin` vs `user`)
- **Payment Methods & Deposit-Approval flow** (Feb 2026 addition):
  - Admin can manage bank accounts (IBAN) + crypto wallet addresses
  - Users see them on the Deposit page
  - "Para Yatır" creates a pending request → admin approves/rejects → only approval credits balance

## Architecture
- Backend `/app/backend`: FastAPI + Motor (async Mongo) + JWT. `server.py` user routes, `admin.py` admin routes (factory pattern), `market.py` yfinance, `models.py` Pydantic, `auth.py` bcrypt/jwt.
- Frontend `/app/frontend`: React + Tailwind + Shadcn/UI + Framer Motion. Two layouts: `DashboardLayout` (users), `AdminLayout` (admins). Route guards in `App.js`.

## Key Collections
- `users` {role, kyc_status, cash_balance, total_deposits, suspended}
- `holdings`, `transactions` (with `Para Yatırma` entries auto-created on deposit approval)
- `kyc_documents`
- `payment_methods` {type:'bank'|'crypto', label, iban|address, active, ...}
- `deposit_requests` {user_id, amount, payment_method_id, status:'pending'|'approved'|'rejected', receipt_base64, tx_hash, rejection_reason}
- `settings`, `audit_log`, `news`

## Implemented (latest)
- 2026-02 (this session): **Payment Methods + Deposit Approval flow** (backend + frontend + admin UI + dashboard alert) ✅ tested (21/21 backend, 9/10 frontend)
- Prior sessions: full user flow, admin panel core (users, KYC, transactions, news, reports, admins, settings, audit log) ✅

## Roadmap (P1 / Backlog)
- Enforce `settings.min_deposit` on `/api/cash/deposit`
- Withdraw approval flow (currently instant)
- Email/SMS notification when deposit is approved/rejected
- Per-user audit timeline on `/admin/users/{id}` detail page
- Admin UI export (CSV) for transactions + deposit requests
- Concurrent-update locking on balance updates (Mongo $inc instead of read-modify-write)
- Mobile responsiveness pass for admin panel tables

## Test Credentials
- Admin: `admin@fonakis.com` / `admin1234`
- Users: register dynamically via `/api/auth/register`

## Notes
- yfinance has 90 s in-memory cache (do not remove)
- Routes: user `/kayit`, `/giris`, `/panel`, `/piyasa`, `/portfoyum`, `/hesap-ozeti`; admin `/admin/panel`, `/admin/kullanicilar`, `/admin/kyc`, `/admin/yatirim-talepleri` (new), `/admin/odeme-yontemleri` (new), `/admin/islemler`, `/admin/haberler`, `/admin/raporlar`, `/admin/yoneticiler`, `/admin/ayarlar`, `/admin/log`
