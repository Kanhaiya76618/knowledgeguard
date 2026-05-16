import requests
import json

BASE = "http://localhost:8000"

# Test 1: Missing repo_path
print("Test 1: Missing repo_path")
r = requests.post(f"{BASE}/api/onboarding", json={"role":"fullstack","repo_path":""})
data = r.json()
print("Status:", r.status_code)
print("Has error field:", "error" in data)
assert r.status_code == 200
assert "error" in data
print("PASS\n")

# Test 2: Invalid path
print("Test 2: Invalid path")
r = requests.post(f"{BASE}/api/onboarding",
    json={"role":"fullstack","repo_path":"C:\\invalid\\path\\xyz"})
data = r.json()
print("Status:", r.status_code)
print("Response:", json.dumps(data, indent=2)[:200])
assert r.status_code == 200
assert "error" in data
print("PASS\n")

# Test 3: Valid local path
print("Test 3: Valid local path — bottle repo")
r = requests.post(f"{BASE}/api/onboarding",
    json={
        "role": "backend",
        "repo_path": r"C:\Users\Kanhaiya\OneDrive\Ai-Agents\bottle"
    },
    timeout=500
)
data = r.json()
print("Status:", r.status_code)
print("Has onboarding_path:", "onboarding_path" in data)
print("Has role:", "role" in data)
print("Has total_files:", "total_files" in data)
if "onboarding_path" in data:
    path_text = data["onboarding_path"]
    safe_preview = path_text[:300].encode('ascii','replace').decode()
    print("Answer length:", len(path_text))
    print("Answer preview:", safe_preview)
    assert len(path_text) > 100, "Answer too short"
    assert "WEEK" in path_text or "week" in path_text.lower(), \
           "Missing week structure"
    print("PASS\n")
else:
    print("FAIL — error:", data.get("error"))

# Test 4: AI/ML role specifically
print("Test 4: AI/ML role")
r = requests.post(f"{BASE}/api/onboarding",
    json={
        "role": "aiml",
        "repo_path": r"C:\Users\Kanhaiya\OneDrive\Ai-Agents\bottle"
    },
    timeout=500
)
data = r.json()
print("Status:", r.status_code)
if "onboarding_path" in data:
    path_text = data["onboarding_path"]
    print("Answer length:", len(path_text))
    print("Role in response:", data.get("role"))
    print("PASS\n")
else:
    print("FAIL — error:", data.get("error"))

# Test 5: GitHub URL
print("Test 5: GitHub URL")
r = requests.post(f"{BASE}/api/onboarding",
    json={
        "role": "fullstack",
        "repo_path": "https://github.com/pallets/flask.git"
    },
    timeout=300
)
data = r.json()
print("Status:", r.status_code)
if "onboarding_path" in data:
    path_text = data["onboarding_path"]
    print("GitHub URL works:", True)
    print("Answer length:", len(path_text))
    print("PASS\n")
else:
    safe_result = json.dumps(data, indent=2)[:300].encode('ascii','replace').decode()
    print("Result:", safe_result)

print("All backend tests complete.")
