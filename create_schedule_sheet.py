import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

# 認証
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
creds = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
gc = gspread.authorize(creds)

# スプレッドシート作成
title = f"VONDS市原 レディースU-15 スケジュール ({datetime.now().strftime('%Y年%m月%d日')})"
sh = gc.create(title)

# 権限設定（自分だけアクセス可能）
sh.share('', perm_type='anyone', role='reader', notify=False)

# ワークシート取得
ws = sh.sheet1

# ヘッダー
headers = ['📅 日付', '🏟️ リーグ', '種別', '⚽ 対戦相手', '⏰ KO時間', '📍 場所', '🚌 行きルート', '🚌 帰りルート', '📝 備考']
ws.append_row(headers)

# スケジュールデータ
data = [
    ['4月29日(水・祝)', '県L', '試合', 'なのはな', '10:00', '姉崎サッカー場', '7:30VGP→7:45八幡宿→8:00五井', '14:30頃現地解散', '12:00試合の本部・運営、その後13:45頃TRM30分1本vsINAC柏'],
    ['4月29日(水・祝)', '関東L', 'TRM', 'INAC柏', '13:45頃', '姉崎サッカー場', '12:45現地集合', '17:15頃姉崎サッカー場→五井→八幡宿', '30分1本、その後14:45頃KO A戦40分前後半程度'],
    ['5月2日(土)', '県L', '練習', '-', '-', '姉崎サッカー場', '9:15VGP→9:45八幡宿→10:00五井', '13:45頃姉崎サッカー場→姉ヶ崎駅', '-'],
    ['5月2日(土)', '関東L', '練習', '-', '-', '姉崎サッカー場', '14:00姉ヶ崎駅', '17:45頃姉崎サッカー場→五井→八幡宿', '-'],
    ['5月3日(日)', '関東L', '試合', 'ジェフ千葉', '11:00頃', 'ZAオリプリ', '8:00VGP→8:30八幡宿→8:45五井', '12:20頃ZA→五井', 'WEリーグ前座試合、25分程度前後半'],
    ['5月3日(日)', '県L', '試合', 'GUNNERS 2nd', '15:00', '姉崎サッカー場', '12:30五井', '17:45頃姉崎サッカー場→五井→八幡宿', '第4節、13:00KO試合の本部・運営'],
    ['5月5日(火・祝)', '県L', '練習', '-', '-', 'スポレク天然芝', '10:00VGP→10:20八幡宿', '13:45頃スポレク→八幡宿→五井', '-'],
    ['5月5日(火・祝)', '関東L', 'TRM', 'レディースTOP', '16:30', 'VONDSグリーンパーク', '14:00八幡宿→14:15五井', '18:30頃VGP→八幡宿→五井', '30分前後半、セットプレー'],
    ['5月6日(水・祝)', '県L', '試合', '暁星国際中', '10:00', '姉崎サッカー場', '7:30VGP→7:45八幡宿→8:00五井', '14:15頃姉崎サッカー場→五井→八幡宿', '第5節、12:00試合の本部・運営'],
    ['5月6日(水・祝)', '関東L', '練習', '-', '-', 'VONDSグリーンパーク', '15:30八幡宿→15:45五井', '19:45頃VGP→八幡宿→五井', '-'],
]

ws.append_rows(data)

# フォーマット
ws.format('A1:I1', {
    'backgroundColor': {'red': 0.1, 'green': 0.37, 'blue': 0.25},
    'textFormat': {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}, 'bold': True}
})

print(f"✅ スプレッドシート作成完了！")
print(f"📊 タイトル: {title}")
print(f"🔗 URL: {sh.url}")
