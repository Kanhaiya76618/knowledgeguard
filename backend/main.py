"""
KnowledgeGuard Backend — FastAPI
Run: uvicorn main:app --reload --port 8000
"""
import subprocess, os, sys, json
from collections import defaultdict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.dirname(__file__))
from sentinel import analyze_architecture_debt
from bob_client import ask_bob, generate_knowledge_doc, ghost_developer, explain_arch_issue, is_bob_available

app = FastAPI(title="KnowledgeGuard API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_file_authors(repo_path):
    result = subprocess.run(
        ['git','log','--pretty=format:%ae','--name-only','--diff-filter=AM'],
        cwd=repo_path, capture_output=True, text=True
    )
    file_authors = defaultdict(set)
    current_author = None
    for line in result.stdout.split('\n'):
        line = line.strip()
        if '@' in line and '/' not in line and len(line)<80:
            current_author = line
        elif line and current_author and '.' in line:
            file_authors[line].add(current_author)
    return file_authors

def get_commit_count(repo_path, filepath):
    result = subprocess.run(
        ['git','log','--oneline','--',filepath],
        cwd=repo_path, capture_output=True, text=True
    )
    return len([l for l in result.stdout.strip().split('\n') if l])

def get_git_authors_summary(repo_path):
    """Get all contributors and their commit counts."""
    result = subprocess.run(
        ['git','log','--pretty=format:%ae'],
        cwd=repo_path, capture_output=True, text=True
    )
    counts = defaultdict(int)
    for email in result.stdout.strip().split('\n'):
        if email.strip():
            counts[email.strip()] += 1
    return dict(sorted(counts.items(), key=lambda x:-x[1])[:20])

def run_bus_factor(repo_path):
    file_authors = get_file_authors(repo_path)
    risky = []
    code_exts = {'.py','.js','.ts','.jsx','.tsx','.java','.go'}
    for fp, authors in file_authors.items():
        if not any(fp.endswith(e) for e in code_exts):
            continue
        commits = get_commit_count(repo_path, fp)
        if commits < 8:
            continue
        risk = round(min((1/len(authors))*(commits/5),10),1)
        risky.append({
            'file': fp, 'authors': list(authors),
            'author_count': len(authors), 'commits': commits,
            'bus_factor': len(authors), 'risk_score': risk,
            'is_critical': len(authors)==1 and commits>10
        })
    risky.sort(key=lambda x:(x['bus_factor'],-x['commits']))
    critical = [f for f in risky if f['is_critical']]
    total = len(risky)
    avg_bf = round(sum(f['bus_factor'] for f in risky)/total,1) if total else 0
    health = max(0, min(100, 100-len(critical)*15-len([f for f in risky if not f['is_critical'] and f['bus_factor']<=2])*3))
    return {
        'health_score': health,
        'total_files': total,
        'critical_count': len(critical),
        'avg_bus_factor': avg_bf,
        'critical_files': critical[:10],
        'all_risky_files': risky[:20],
        'contributors': get_git_authors_summary(repo_path)
    }

def validate_repo(repo_path):
    if not repo_path:
        return False, "Repository path is required"
    if not os.path.exists(repo_path):
        return False, f"Path does not exist: {repo_path}"
    if not os.path.isdir(repo_path):
        return False, f"Path is not a directory: {repo_path}"
    git_dir = os.path.join(repo_path, '.git')
    if not os.path.exists(git_dir):
        return False, "Not a git repository (no .git folder found)"
    return True, None

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/status")
async def status():
    return {
        "status": "ok",
        "bob_connected": is_bob_available(),
        "version": "1.0.0",
        "features": ["bus-factor","sentinel","qa","map","ghost-developer"]
    }

@app.post("/api/analyze/bus-factor")
async def bus_factor(body: dict):
    repo_path = body.get("repo_path","").strip()
    valid, err = validate_repo(repo_path)
    if not valid:
        return {"error": err}
    try:
        return run_bus_factor(repo_path)
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/analyze/sentinel")
async def sentinel(body: dict):
    repo_path = body.get("repo_path","").strip()
    valid, err = validate_repo(repo_path)
    if not valid:
        return {"error": err}
    try:
        return analyze_architecture_debt(repo_path)
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ask")
async def ask(body: dict):
    question = body.get("question","").strip()
    repo_path = body.get("repo_path","").strip()
    if not question:
        return {"error": "Question is required"}
    valid, err = validate_repo(repo_path)
    if not valid:
        return {"error": f"Repo not loaded: {err}"}
    return ask_bob(question, repo_path)

@app.post("/api/generate-doc")
async def generate_doc(body: dict):
    file_path = body.get("file_path","").strip()
    repo_path = body.get("repo_path","").strip()
    if not file_path:
        return {"error": "File path is required"}
    valid, err = validate_repo(repo_path)
    if not valid:
        return {"error": err}
    return generate_knowledge_doc(file_path, repo_path)

@app.post("/api/ghost-developer")
async def ghost(body: dict):
    question = body.get("question","").strip()
    file_path = body.get("file_path","").strip()
    repo_path = body.get("repo_path","").strip()
    author = body.get("author","unknown author")
    if not question or not file_path:
        return {"error": "Question and file_path are required"}
    valid, err = validate_repo(repo_path)
    if not valid:
        return {"error": err}
    return ghost_developer(question, file_path, repo_path, author)

@app.post("/api/explain-issue")
async def explain_issue(body: dict):
    title = body.get("title","").strip()
    files = body.get("files",[])
    repo_path = body.get("repo_path","").strip()
    if not title:
        return {"error": "Issue title is required"}
    valid, err = validate_repo(repo_path)
    if not valid:
        return {"error": err}
    return explain_arch_issue(title, files, repo_path)