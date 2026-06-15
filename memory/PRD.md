# FonAkış — Product Requirements

## Original Problem Statement
Build a full-stack TR investment & portfolio management platform (React + FastAPI + MongoDB) named **FonAkış** with:
- JWT user auth, KYC (selfie + ID) gating trading
- Real-time market data via yfinance (BIST stocks, indices, crypto, forex, commodities)
- Buy/sell, portfolio + transactions, mobile-responsive UI with Framer Motion
- Comprehensive Admin Panel with role-based access
- **Payment Methods & Deposit Approval** (2026-02): admin manages bank IBANs + crypto wallet addresses; users see them on Para Yatır; deposits are pending → admin approve credits balance + records "Para Yatırma" tx
- **Admin User Detail page** (2026-02): dark-themed `/admin/kullanicilar/{id}` matching reference screenshot — profile card, 4 stat boxes, 6 tabs (Açık Pozisyonlar/Kapanan/Yatırımlar/Çekimler/Hesap Hareketleri/KYC), 4 actions (Bakiye İşlemi, Kredi İşlemi, Bilgileri Düzenle, Şifre Değiştir)
- **Bank logos** in payment methods (Clearbit CDN + brand-color initials fallback)

## Architecture
- Backend `/app/backend`: FastAPI + Motor (async Mongo) + JWT. `server.py` user routes, `admin.py` admin routes (factory pattern), `market.py` yfinance, `models.py` Pydantic, `auth.py` bcrypt/jwt.
- Frontend `/app/frontend`: React + Tailwind + Shadcn/UI + Framer Motion. Two layouts: `DashboardLayout` (users), `AdminLayout` (admins). Route guards in `App.js`.

## Key Collections
- `users` {role, kyc_status, cash_balance, credit_balance, total_deposits, suspended, customer_no (FNK + 10 digits, sha256), tier}
- `holdings`, `transactions` (Para Yatırma auto-created on deposit approval; Admin Bakiye/Admin Düzeltme on admin adjust)
- `kyc_documents`
- `payment_methods` {type:'bank'|'crypto', label, bank_code, iban|address, active, ...}
- `deposit_requests` {user_id, amount, payment_method_id, status:'pending'|'approved'|'rejected', receipt_base64, tx_hash, rejection_reason}
- `settings`, `audit_log`, `news`

## Implemented (latest)
- 2026-02 #3 (this session): **Admin User Detail (dark page)** + admin actions (balance/credit/info/password endpoints) + **Bank logos** + payment-methods bank_code roundtrip — 39/39 backend + 10/10 UI ✅
- 2026-02 #2: Payment Methods + Deposit Approval (21/21 backend, 9/10 UI) ✅
- 2026-02 #1: Admin panel core (users/KYC/transactions/news/reports/admins/settings/audit log) ✅
- Prior: full user flow (auth, market data, KYC, trade, portfolio)

## Roadmap (P1 / Backlog)
- Enforce `settings.min_deposit` on `/api/cash/deposit`
- Withdraw approval flow (currently instant)
- Email/SMS notification when deposit approved/rejected, when admin adjusts balance
- CSV export for admin tables (transactions + deposit requests)
- Mobile responsiveness pass for admin tables
- Atomic balance updates with Mongo `$inc`
- Self-hosted bank logo SVGs (fallback for production envs that block Clearbit)
- EmailStr validation on AdminUserUpdateIn
- Add DialogDescription / aria-describedby to silence Radix a11y warnings

## Test Credentials
- Admin: `admin@fonakis.com` / `admin1234`
- Users: register dynamically via `/api/auth/register`

## Notes
- yfinance has 90 s in-memory cache (do not remove)
- customer_no: sha256(user_id)[:12] → int → top-10 digits, prefixed `FNK`
- Routes — user: `/giris`, `/kayit`, `/panel`, `/piyasa`, `/portfoyum`, `/hesap-ozeti`; admin: `/admin/panel`, `/admin/kullanicilar`, `/admin/kullanicilar/:id` (new), `/admin/kyc`, `/admin/yatirim-talepleri`, `/admin/odeme-yontemleri`, `/admin/islemler`, `/admin/haberler`, `/admin/raporlar`, `/admin/yoneticiler`, `/admin/ayarlar`, `/admin/log`
