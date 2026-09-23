import urllib.request
import urllib.parse
import json
import io
from PIL import Image, ImageDraw, ImageFont

# 1. Create a synthetic test passport image
img = Image.new('RGB', (600, 380), color=(240, 245, 250))
draw = ImageDraw.Draw(img)

# Header
draw.text((30, 30), "REPUBLIC OF INDIA / PASSPORT", fill=(20, 30, 50))
draw.text((30, 70), "SURNAME: SHARMA", fill=(20, 30, 50))
draw.text((30, 100), "GIVEN NAME: AARAV", fill=(20, 30, 50))
draw.text((30, 130), "PASSPORT NO: L8374619", fill=(20, 30, 50))
draw.text((30, 160), "DOB: 15/08/1998", fill=(20, 30, 50))
draw.text((30, 190), "EXPIRY: 14/08/2030", fill=(20, 30, 50))

# MRZ
draw.text((30, 260), "P<INDSHARMA<<AARAV<<<<<<<<<<<<<<<<<<<<<<<<<<", fill=(10, 10, 10))
draw.text((30, 290), "L8374619<2IND9808154M3008144<<<<<<<<<<<<<<<2", fill=(10, 10, 10))

buf = io.BytesIO()
img.save(buf, format='JPEG')
img_bytes = buf.getvalue()

# 2. Post to FastAPI /api/screen-document
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = bytearray()
body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="file"; filename="test_passport.jpg"\r\n')
body.extend(b'Content-Type: image/jpeg\r\n\r\n')
body.extend(img_bytes)
body.extend(b'\r\n')
body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="category"\r\n\r\n')
body.extend(b'Passport\r\n')
body.extend(f'--{boundary}--\r\n'.encode('utf-8'))

req = urllib.request.Request(
    'http://localhost:8000/api/screen-document',
    data=bytes(body),
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
    method='POST'
)

with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    print("API Response:")
    print(json.dumps(res, indent=2))
