"""Test API endpoints directly"""

import requests
import json

base_url = 'https://frontend-two-lake-705kqnp9pm.vercel.app'

print("🧪 Testing API endpoints...")

# Test 1: Check if brain endpoint works
print("\n1. Testing /api/brain...")
try:
    res = requests.get(f'{base_url}/api/brain', timeout=10)
    print(f"   Status: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"   ✅ Brain data: {json.dumps(data, indent=2)[:200]}...")
    else:
        print(f"   ❌ Error: {res.text[:200]}")
except Exception as e:
    print(f"   ❌ Exception: {e}")

# Test 2: Check if drafts list endpoint works
print("\n2. Testing /api/drafts...")
try:
    res = requests.get(f'{base_url}/api/drafts?limit=5', timeout=10)
    print(f"   Status: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"   ✅ Drafts: {len(data.get('drafts', []))} found")
        print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
    else:
        print(f"   ❌ Error: {res.text[:200]}")
except Exception as e:
    print(f"   ❌ Exception: {e}")

# Test 3: Try to generate a draft
print("\n3. Testing /api/drafts/generate...")
try:
    payload = {
        'topic': 'Test draft generation',
        'channel': 'twitter',
        'format': 'post'
    }
    print(f"   Payload: {payload}")
    res = requests.post(
        f'{base_url}/api/drafts/generate',
        json=payload,
        timeout=30
    )
    print(f"   Status: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"   ✅ Draft generated!")
        print(f"   Draft ID: {data.get('draft', {}).get('id', 'N/A')}")
        print(f"   Content preview: {data.get('draft', {}).get('content', '')[:100]}...")
    else:
        print(f"   ❌ Error: {res.text[:500]}")
except Exception as e:
    print(f"   ❌ Exception: {e}")

print("\n✅ API test complete")
