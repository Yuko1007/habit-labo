from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import os

SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive'
]

credentials_path = os.path.join(os.environ['APPDATA'], 'gogcli', 'credentials.json')

try:
    from google.auth import default
    credentials, _ = default(scopes=SCOPES)
except:
    print("デフォルト認証が利用できません")

docs_service = build('docs', 'v1', credentials=credentials)
drive_service = build('drive', 'v3', credentials=credentials)

body = {'title': 'English Numbers 1-10'}
doc = drive_service.files().create(body=body, fields='id').execute()
doc_id = doc.get('id')
print(f"ドキュメント作成: {doc_id}")

numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
requests = []

for i, number in enumerate(numbers):
    text = number + ('\n' if i < len(numbers) - 1 else '')
    requests.append({'insertText': {'text': text}})

docs_service.documents().batchUpdate(
    documentId=doc_id,
    body={'requests': requests}
).execute()

print("英単語を追加しました")
print(f"https://docs.google.com/document/d/{doc_id}/edit")
