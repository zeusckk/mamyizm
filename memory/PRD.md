# FonAkış — Product Requirements

## Original Problem Statement
Build a full-stack TR investment & portfolio management platform (React + FastAPI + MongoDB) named **FonAkış**.

## Implemented (latest)
- 2026-02 #4 (this session): **Global theme toggle (Açık/Koyu)** with localStorage persistence + Tema button in both admin & user sidebars; AdminUserDetail refactored to use the unified light theme that auto-flips to dark via CSS overrides.
- 2026-02 #3: AdminUserDetail page + admin balance/credit/info/password endpoints + bank logos (Clearbit + brand initials fallback) + bank_code roundtrip.
- 2026-02 #2: Payment Methods + Deposit Approval flow.
- 2026-02 #1: Admin Panel core (users, KYC, transactions, news, reports, admins, settings, audit log).
- Prior: full user flow (JWT auth, yfinance market data, KYC, trade, portfolio, framer-motion UI).

## Architecture
- Backend `/app/backend`: FastAPI + Motor + JWT. `server.py` user routes, `admin.py` admin factory routes, `market.py` yfinance, `models.py` Pydantic, `auth.py` bcrypt/jwt.
- Frontend `/app/frontend`: React + Tailwind + Shadcn/UI + Framer Motion.
  - Layouts: `DashboardLayout` (user), `AdminLayout` (admin) — both have Tema button in sidebar.
  - Theme: `ThemeContext` (localStorage `fonakis_theme`), `html.dark` class + CSS overrides in `index.css` flip the entire UI.

## Key Collections
- `users` {role, kyc_status, cash_balance, credit_balance, total_deposits, suspended, customer_no (FNK + sha256-derived 10 digits), tier, currency}
- `holdings`, `transactions` (Admin Bakiye / Admin Düzeltme entries on admin adjust)
- `kyc_documents`
- `payment_methods` {type:'bank'|'crypto', bank_code, label, iban|address, active, ...}
- `deposit_requests` {user_id, amount, status:pending|approved|rejected, ...}
- `settings`, `audit_log`, `news`

## Roadmap (P1 / Backlog)
- Enforce `settings.min_deposit` on /api/cash/deposit
- Withdraw approval flow (currently instant)
- Email/SMS notifications on deposit / balance changes
- CSV export for admin tables
- Mobile responsiveness pass for admin tables
- Atomic balance updates with Mongo `$inc`
- Self-hosted bank logo SVGs as Clearbit fallback
- EmailStr validation on AdminUserUpdateIn
- DialogDescription / aria-describedby on Radix dialogs (a11y)

## Test Credentials
- Admin: `admin@fonakis.com` / `admin1234`
- Users: register dynamically via `/api/auth/register`

## Notes
- yfinance 90 s in-memory cache (do not remove)
- customer_no: deterministic — sha256(user_id)[:12] → int → top-10 digits → `FNK<digits>`
- Routes (user): `/giris`, `/kayit`, `/panel`, `/piyasa`, `/portfoyum`, `/hesap-ozeti`
- Routes (admin): `/admin/panel`, `/admin/kullanicilar`, `/admin/kullanicilar/:id`, `/admin/kyc`, `/admin/yatirim-talepleri`, `/admin/odeme-yontemleri`, `/admin/islemler`, `/admin/haberler`, `/admin/raporlar`, `/admin/yoneticiler`, `/admin/ayarlar`, `/admin/log`
- Theme toggle data-testid: `theme-toggle-btn` (present in both layouts)
