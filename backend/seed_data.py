import random
from typing import List, Dict

FUND_CATEGORIES = [
    ('para-piyasasi', 'Para Piyasası'),
    ('hisse', 'Hisse Senedi'),
    ('borclanma', 'Borçlanma Araçları'),
    ('altin', 'Kıymetli Maden'),
    ('bes', 'BES'),
    ('karma', 'Karma'),
    ('yabanci', 'Yabancı Menkul'),
]


def gen_series(base: float, vol: float = 0.02, days: int = 30) -> List[Dict]:
    out = []
    v = base
    for i in range(days):
        v = v * (1 + (random.random() - 0.48) * vol)
        out.append({'d': i + 1, 'v': round(v, 4)})
    return out


FUND_DEFS = [
    ('FAH', 'FonAkış Hisse Yoğun Fon', 'hisse', 12.4581, 1.84, 28.42, 6, 412_500_000, 0.025, 'BIST 100 endeksindeki yüksek likiditeli hisselere odaklı, aktif yönetilen büyüme fonu.'),
    ('FPL', 'FonAkış Para Piyasası Likit Fon', 'para-piyasasi', 1.8423, 0.12, 41.85, 1, 1_240_000_000, 0.003, 'Düşük riskli, günlük likidite sağlayan kısa vadeli mevduat ve repo fonu.'),
    ('FBO', 'FonAkış Devlet İç Borçlanma Fonu', 'borclanma', 3.2014, 0.34, 38.21, 2, 678_000_000, 0.006, 'Devlet iç borçlanma senetlerine yatırım yapan orta vadeli sabit getirili fon.'),
    ('FAL', 'FonAkış Altın Fonu', 'altin', 5.7290, -0.42, 52.14, 4, 322_000_000, 0.018, 'Fiziki altın ve altına dayalı yatırım araçlarına yatırım yapan koruyucu fon.'),
    ('FKM', 'FonAkış Karma Dengeli Fon', 'karma', 4.1208, 0.68, 32.91, 4, 198_000_000, 0.015, 'Hisse, tahvil ve para piyasası araçlarını dengeli oranda barındıran çok varlıklı fon.'),
    ('FBE', 'FonAkış BES Atak Büyüme Fonu', 'bes', 6.8932, 1.21, 35.78, 5, 540_000_000, 0.02, 'Bireysel emeklilik sistemine özel, uzun vadeli büyüme odaklı agresif fon.'),
    ('FBM', 'FonAkış BES Muhafazakar Fonu', 'bes', 2.4571, 0.18, 31.20, 2, 412_000_000, 0.005, 'BES katılımcıları için düşük riskli, sabit getirili ağırlıklı muhafazakar fon.'),
    ('FYH', 'FonAkış Yabancı Hisse Fonu', 'yabanci', 9.1284, -0.91, 24.65, 6, 154_000_000, 0.022, 'Global teknoloji ve büyüme hisselerine yatırım yapan döviz hassasiyetli fon.'),
    ('FTK', 'FonAkış Teknoloji Sektörü Fonu', 'hisse', 14.7821, 2.45, 47.32, 7, 89_000_000, 0.03, 'BIST teknoloji sektörü hisselerine yoğunlaşan, yüksek riskli tematik fon.'),
    ('FED', 'FonAkış Eurobond Fonu', 'borclanma', 7.4012, 0.05, 29.18, 3, 245_000_000, 0.009, 'TL bazında getiri sağlayan, USD cinsi devlet eurobondlarına yatırım yapan fon.'),
    ('FGM', 'FonAkış Gümüş ve Kıymetli Maden Fonu', 'altin', 3.5891, -1.12, 44.78, 5, 76_000_000, 0.025, 'Gümüş ve diğer kıymetli madenlere yatırım yapan tematik enstrüman.'),
    ('FBL', 'FonAkış BIST 30 Endeks Fonu', 'hisse', 8.2941, 1.32, 26.84, 5, 312_000_000, 0.02, 'BIST 30 endeksini pasif olarak takip eden, düşük maliyetli endeks fonu.'),
]

CAT_LABEL_MAP = dict(FUND_CATEGORIES)
CAT_LABEL_MAP.update({'altin': 'Altın', 'borclanma': 'Borçlanma', 'yabanci': 'Yabancı'})


def seed_funds():
    funds = []
    for (code, name, cat, price, c24, cytd, risk, aum, vol, desc) in FUND_DEFS:
        funds.append({
            '_id': code,
            'code': code, 'name': name, 'category': cat,
            'category_label': CAT_LABEL_MAP.get(cat, cat),
            'price': price, 'change_24h': c24, 'change_ytd': cytd, 'risk': risk,
            'aum': aum, 'manager': 'FonAkış Portföy' if cat != 'bes' else 'FonAkış Emeklilik',
            'min_buy': 1.0, 'currency': 'TRY',
            'series': gen_series(price * 0.85, vol),
            'desc': desc,
        })
    return funds


SEED_NEWS = [
    {'_id': 'n1', 'date': '2025-07-09', 'tag': 'Piyasa', 'title': 'BIST 100 günü yükselişle kapattı, bankacılık endeksi öne çıktı', 'summary': 'Endeks gün içinde %2.1 değer kazanırken, bankacılık endeksi %3.4 yükseldi. Yabancı yatırımcı girişi 142M USD oldu.'},
    {'_id': 'n2', 'date': '2025-07-09', 'tag': 'Duyuru', 'title': 'FonAkış BES Atak Büyüme Fonu yönetim ücretinde indirim', 'summary': 'FBE fonunun yıllık yönetim ücreti 1 Ağustos itibarıyla %1.91\'den %1.65\'e düşürülecektir.'},
    {'_id': 'n3', 'date': '2025-07-08', 'tag': 'Analiz', 'title': 'TCMB faiz kararı sonrası tahvil piyasası görünümü', 'summary': 'Politika faizinin sabit tutulmasıyla 10 yıllık tahvil getirisi 35 baz puan geriledi. Tahvil fonları için olumlu sinyal.'},
    {'_id': 'n4', 'date': '2025-07-07', 'tag': 'Emtia', 'title': 'Altın ons fiyatı 2,420 USD seviyesinde yatay seyrediyor', 'summary': 'Jeopolitik gerilimler altına talebi destekliyor; gram altın TL bazında haftalık %1.8 değerlendi.'},
    {'_id': 'n5', 'date': '2025-07-05', 'tag': 'Duyuru', 'title': 'Yeni mobil uygulama 2.4 sürümü yayında', 'summary': 'Biyometrik giriş, hızlı işlem ekranı ve özelleştirilebilir kontrol panelleri eklendi.'},
    {'_id': 'n6', 'date': '2025-07-04', 'tag': 'Strateji', 'title': 'Üçüncü çeyrek varlık dağılım önerimiz: dengeli portföy', 'summary': 'Hisse %40, tahvil %35, kıymetli maden %15, para piyasası %10 ağırlıklı bir dağılım öneriyoruz.'},
]
