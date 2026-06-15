"""Real-time market data via yfinance with in-memory caching."""
import time
import logging
from typing import List, Dict, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

import yfinance as yf

logger = logging.getLogger('fonakis.market')
_executor = ThreadPoolExecutor(max_workers=4)

# Symbol catalogs ----------------------------------------------------------
INDICES = [
    {'symbol': 'XU100.IS', 'name': 'BIST 100', 'category': 'TR Endeks', 'currency': 'TRY'},
    {'symbol': 'XU030.IS', 'name': 'BIST 30', 'category': 'TR Endeks', 'currency': 'TRY'},
    {'symbol': 'XBANK.IS', 'name': 'BIST Bankacılık', 'category': 'TR Endeks', 'currency': 'TRY'},
    {'symbol': 'XUSIN.IS', 'name': 'BIST Sınai', 'category': 'TR Endeks', 'currency': 'TRY'},
    {'symbol': 'XUTEK.IS', 'name': 'BIST Teknoloji', 'category': 'TR Endeks', 'currency': 'TRY'},
    {'symbol': '^GSPC', 'name': 'S&P 500', 'category': 'Global Endeks', 'currency': 'USD'},
    {'symbol': '^IXIC', 'name': 'NASDAQ Composite', 'category': 'Global Endeks', 'currency': 'USD'},
    {'symbol': '^DJI', 'name': 'Dow Jones', 'category': 'Global Endeks', 'currency': 'USD'},
    {'symbol': '^GDAXI', 'name': 'DAX (Almanya)', 'category': 'Global Endeks', 'currency': 'EUR'},
    {'symbol': '^FTSE', 'name': 'FTSE 100 (UK)', 'category': 'Global Endeks', 'currency': 'GBP'},
    {'symbol': '^N225', 'name': 'Nikkei 225 (Japonya)', 'category': 'Global Endeks', 'currency': 'JPY'},
]

BIST_STOCKS = [
    ('THYAO.IS', 'Türk Hava Yolları', 'Ulaştırma'),
    ('ASELS.IS', 'Aselsan', 'Savunma'),
    ('AKBNK.IS', 'Akbank', 'Bankacılık'),
    ('GARAN.IS', 'Garanti BBVA', 'Bankacılık'),
    ('ISCTR.IS', 'İş Bankası', 'Bankacılık'),
    ('YKBNK.IS', 'Yapı Kredi', 'Bankacılık'),
    ('KCHOL.IS', 'Koç Holding', 'Holding'),
    ('SAHOL.IS', 'Sabancı Holding', 'Holding'),
    ('BIMAS.IS', 'BİM Mağazaları', 'Perakende'),
    ('MGROS.IS', 'Migros', 'Perakende'),
    ('EREGL.IS', 'Ereğli Demir Çelik', 'Metal'),
    ('TUPRS.IS', 'Tüpraş', 'Enerji'),
    ('FROTO.IS', 'Ford Otosan', 'Otomotiv'),
    ('TOASO.IS', 'Tofaş', 'Otomotiv'),
    ('SISE.IS', 'Şişe Cam', 'Sanayi'),
    ('TCELL.IS', 'Turkcell', 'Telekom'),
    ('PETKM.IS', 'Petkim', 'Petrokimya'),
    ('ARCLK.IS', 'Arçelik', 'Beyaz Eşya'),
    ('LOGO.IS', 'Logo Yazılım', 'Teknoloji'),
    ('KOZAL.IS', 'Koza Altın', 'Madencilik'),
]

COMMODITIES = [
    {'symbol': 'GC=F', 'name': 'Altın (Ons)', 'category': 'Kıymetli Maden', 'currency': 'USD', 'unit': 'ons'},
    {'symbol': 'SI=F', 'name': 'Gümüş (Ons)', 'category': 'Kıymetli Maden', 'currency': 'USD', 'unit': 'ons'},
    {'symbol': 'PL=F', 'name': 'Platin (Ons)', 'category': 'Kıymetli Maden', 'currency': 'USD', 'unit': 'ons'},
    {'symbol': 'PA=F', 'name': 'Paladyum (Ons)', 'category': 'Kıymetli Maden', 'currency': 'USD', 'unit': 'ons'},
    {'symbol': 'HG=F', 'name': 'Bakır', 'category': 'Endüstriyel Metal', 'currency': 'USD', 'unit': 'lb'},
    {'symbol': 'CL=F', 'name': 'Brent Petrol', 'category': 'Enerji', 'currency': 'USD', 'unit': 'varil'},
    {'symbol': 'NG=F', 'name': 'Doğalgaz', 'category': 'Enerji', 'currency': 'USD', 'unit': 'MMBtu'},
    {'symbol': 'ZW=F', 'name': 'Buğday', 'category': 'Tarım', 'currency': 'USD', 'unit': 'bushel'},
    {'symbol': 'ZC=F', 'name': 'Mısır', 'category': 'Tarım', 'currency': 'USD', 'unit': 'bushel'},
    {'symbol': 'KC=F', 'name': 'Kahve', 'category': 'Tarım', 'currency': 'USD', 'unit': 'lb'},
]

FX_PAIRS = [
    {'symbol': 'TRY=X', 'name': 'USD / TRY', 'category': 'TL Parite', 'base': 'USD', 'quote': 'TRY'},
    {'symbol': 'EURTRY=X', 'name': 'EUR / TRY', 'category': 'TL Parite', 'base': 'EUR', 'quote': 'TRY'},
    {'symbol': 'GBPTRY=X', 'name': 'GBP / TRY', 'category': 'TL Parite', 'base': 'GBP', 'quote': 'TRY'},
    {'symbol': 'CHFTRY=X', 'name': 'CHF / TRY', 'category': 'TL Parite', 'base': 'CHF', 'quote': 'TRY'},
    {'symbol': 'JPYTRY=X', 'name': 'JPY / TRY', 'category': 'TL Parite', 'base': 'JPY', 'quote': 'TRY'},
    {'symbol': 'EURUSD=X', 'name': 'EUR / USD', 'category': 'Çapraz Parite', 'base': 'EUR', 'quote': 'USD'},
    {'symbol': 'GBPUSD=X', 'name': 'GBP / USD', 'category': 'Çapraz Parite', 'base': 'GBP', 'quote': 'USD'},
    {'symbol': 'USDJPY=X', 'name': 'USD / JPY', 'category': 'Çapraz Parite', 'base': 'USD', 'quote': 'JPY'},
    {'symbol': 'AUDUSD=X', 'name': 'AUD / USD', 'category': 'Çapraz Parite', 'base': 'AUD', 'quote': 'USD'},
    {'symbol': 'USDCNY=X', 'name': 'USD / CNY', 'category': 'Çapraz Parite', 'base': 'USD', 'quote': 'CNY'},
]

CRYPTO = [
    {'symbol': 'BTC-USD', 'name': 'Bitcoin', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'ETH-USD', 'name': 'Ethereum', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'BNB-USD', 'name': 'BNB', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'SOL-USD', 'name': 'Solana', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'XRP-USD', 'name': 'XRP', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'ADA-USD', 'name': 'Cardano', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'DOGE-USD', 'name': 'Dogecoin', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'AVAX-USD', 'name': 'Avalanche', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'DOT-USD', 'name': 'Polkadot', 'category': 'Kripto Para', 'currency': 'USD'},
    {'symbol': 'MATIC-USD', 'name': 'Polygon', 'category': 'Kripto Para', 'currency': 'USD'},
]


# Cache --------------------------------------------------------------------
_cache: Dict[str, Dict] = {}
CACHE_TTL_SECONDS = 90  # 90s for list, 300s for series


def _get_cache(key: str, ttl: int = CACHE_TTL_SECONDS) -> Optional[Dict]:
    item = _cache.get(key)
    if item and (time.time() - item['ts'] < ttl):
        return item['data']
    return None


def _set_cache(key: str, data) -> None:
    _cache[key] = {'data': data, 'ts': time.time()}


# Sync fetchers ------------------------------------------------------------
def _fetch_quotes_sync(symbols: List[str]) -> Dict[str, Dict]:
    """Fetch quote info for a list of symbols using yf.download (efficient batch)."""
    try:
        data = yf.download(
            tickers=' '.join(symbols),
            period='5d', interval='1d',
            group_by='ticker', auto_adjust=False, progress=False, threads=True,
        )
    except Exception as e:
        logger.warning('yf.download failed: %s', e)
        return {}

    out: Dict[str, Dict] = {}
    for sym in symbols:
        try:
            if len(symbols) == 1:
                df = data
            else:
                df = data[sym] if sym in data.columns.get_level_values(0) else None
            if df is None or df.empty:
                continue
            df = df.dropna()
            if df.empty:
                continue
            last = df['Close'].iloc[-1]
            prev = df['Close'].iloc[-2] if len(df) > 1 else last
            change = float(last - prev)
            change_pct = float((change / prev * 100) if prev else 0)
            out[sym] = {
                'price': float(last),
                'change': change,
                'change_pct': change_pct,
                'high': float(df['High'].iloc[-1]),
                'low': float(df['Low'].iloc[-1]),
                'volume': float(df['Volume'].iloc[-1]) if 'Volume' in df else 0,
            }
        except Exception as e:
            logger.debug('parse fail %s: %s', sym, e)
            continue
    return out


def _fetch_series_sync(symbol: str, period: str = '1mo') -> List[Dict]:
    try:
        t = yf.Ticker(symbol)
        df = t.history(period=period, interval='1d', auto_adjust=False)
        if df is None or df.empty:
            return []
        df = df.dropna()
        out = []
        for i, (idx, row) in enumerate(df.iterrows()):
            out.append({'d': i + 1, 'v': round(float(row['Close']), 4), 'date': idx.strftime('%Y-%m-%d')})
        return out
    except Exception as e:
        logger.warning('series fail %s: %s', symbol, e)
        return []


# Async wrappers -----------------------------------------------------------
async def _run(fn, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, fn, *args)


async def get_market_group(group: str) -> List[Dict]:
    """group in: indices, stocks, commodities, fx, crypto"""
    cached = _get_cache(group)
    if cached is not None:
        return cached

    if group == 'indices':
        meta = INDICES
        symbols = [m['symbol'] for m in meta]
    elif group == 'stocks':
        meta = [{'symbol': s, 'name': n, 'category': c, 'currency': 'TRY'} for (s, n, c) in BIST_STOCKS]
        symbols = [m['symbol'] for m in meta]
    elif group == 'commodities':
        meta = COMMODITIES
        symbols = [m['symbol'] for m in meta]
    elif group == 'fx':
        meta = FX_PAIRS
        symbols = [m['symbol'] for m in meta]
    elif group == 'crypto':
        meta = CRYPTO
        symbols = [m['symbol'] for m in meta]
    else:
        return []

    quotes = await _run(_fetch_quotes_sync, symbols)
    items = []
    for m in meta:
        q = quotes.get(m['symbol'], {})
        items.append({
            **m,
            'price': q.get('price', 0),
            'change': q.get('change', 0),
            'change_pct': q.get('change_pct', 0),
            'high': q.get('high', 0),
            'low': q.get('low', 0),
            'volume': q.get('volume', 0),
        })
    _set_cache(group, items)
    return items


async def get_symbol_detail(symbol: str) -> Optional[Dict]:
    """Return detail with metadata + series."""
    cache_key = f'detail:{symbol}'
    cached = _get_cache(cache_key, ttl=300)
    if cached is not None:
        return cached

    # find metadata
    meta = None
    for m in INDICES + COMMODITIES + FX_PAIRS + CRYPTO:
        if m['symbol'] == symbol:
            meta = m; break
    if not meta:
        for (s, n, c) in BIST_STOCKS:
            if s == symbol:
                meta = {'symbol': s, 'name': n, 'category': c, 'currency': 'TRY'}
                break
    if not meta:
        meta = {'symbol': symbol, 'name': symbol, 'category': 'Diğer', 'currency': 'USD'}

    quotes, series = await asyncio.gather(
        _run(_fetch_quotes_sync, [symbol]),
        _run(_fetch_series_sync, symbol, '1mo'),
    )
    q = quotes.get(symbol, {})
    out = {
        **meta,
        'price': q.get('price', 0),
        'change': q.get('change', 0),
        'change_pct': q.get('change_pct', 0),
        'high': q.get('high', 0),
        'low': q.get('low', 0),
        'volume': q.get('volume', 0),
        'series': series,
    }
    _set_cache(cache_key, out)
    return out
