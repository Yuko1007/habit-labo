import pdfplumber
import json
from datetime import datetime

pdf_path = r"C:\Users\somey\Downloads\レディースU15 今後予定表 2026年4月15日更新(1).pdf"

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"\n=== ページ {i+1} ===")
        text = page.extract_text()
        print(text)
