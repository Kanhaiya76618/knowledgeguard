"""
KnowledgeGuard Backend — FastAPI
Run: uvicorn main:app --reload --port 8000
"""
import subprocess, os, sys, asyncio
from collections import defaultdict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.dirname(__file__))
from sentinel import analyze_architecture_debt
from dead_code import find_dead_code
from bob_client import ask_bob, generate_knowledge_doc, ghost_developer, explain_arch_issue, is_bob_available
from repo_manager import resolve_repo_path, is_github_url

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
        full_path = os.path.join(repo_path, fp.replace('/', os.sep))
        if not os.path.exists(full_path):
            continue
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

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/status")
async def status():
    return {
        "status": "ok",
        "bob_connected": is_bob_available(),
        "version": "1.0.0",
        "features": ["bus-factor","sentinel","qa","map","ghost-developer"]
    }

@app.post("/api/validate-repo")
async def validate_repo_endpoint(body: dict):
    repo_input = body.get("repo_path", "").strip()
    if not repo_input:
        return {"valid": False, "error": "No path provided"}
    if is_github_url(repo_input):
        return {
            "valid": True,
            "is_url": True,
            "message": "GitHub URL detected — will clone automatically"
        }
    if not os.path.exists(repo_input):
        return {"valid": False, "error": "Path not found", "is_url": False}
    return {"valid": True, "is_url": False, "message": "Local path ready"}

@app.post("/api/analyze/bus-factor")
async def bus_factor(body: dict):
    repo_input = body.get("repo_path", "").strip()
    resolved = resolve_repo_path(repo_input)
    if resolved['error']:
        return {"error": resolved['error']}
    repo_path = resolved['path']
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, run_bus_factor, repo_path)
    if resolved.get('is_url'):
        result['source'] = 'github'
        result['cached'] = resolved.get('cached', False)
    return result

@app.post("/api/analyze/sentinel")
async def sentinel(body: dict):
    repo_input = body.get("repo_path", "").strip()
    resolved = resolve_repo_path(repo_input)
    if resolved['error']:
        return {"error": resolved['error']}
    repo_path = resolved['path']
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, analyze_architecture_debt, repo_path)
    if resolved.get('is_url'):
        result['source'] = 'github'
        result['cached'] = resolved.get('cached', False)
    return result

@app.post("/api/analyze/dead-code")
async def dead_code_endpoint(body: dict):
    repo_input = body.get("repo_path", "").strip()
    resolved = resolve_repo_path(repo_input)
    if resolved['error']:
        return {"error": resolved['error']}
    repo_path = resolved['path']
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, find_dead_code, repo_path)
    if resolved.get('is_url'):
        result['source'] = 'github'
        result['cached'] = resolved.get('cached', False)
    return result

@app.post("/api/ask")
async def ask(body: dict):
    question = body.get("question","").strip()
    repo_input = body.get("repo_path","").strip()
    if not question:
        return {"error": "Question is required"}
    resolved = resolve_repo_path(repo_input)
    if resolved['error']:
        return {"error": f"Repo not loaded: {resolved['error']}"}
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, ask_bob, question, resolved['path'])

@app.post("/api/generate-doc")
async def generate_doc(body: dict):
    file_path = body.get("file_path","").strip()
    repo_input = body.get("repo_path","").strip()
    if not file_path:
        return {"error": "File path is required"}
    resolved = resolve_repo_path(repo_input)
    if resolved['error']:
        return {"error": resolved['error']}
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, generate_knowledge_doc, file_path, resolved['path'])

@app.post("/api/ghost-developer")
async def ghost(body: dict):
    question = body.get("question","").strip()
    file_path = body.get("file_path","").strip()
    repo_input = body.get("repo_path","").strip()
    author = body.get("author","unknown author")
    if not question or not file_path:
        return {"error": "Question and file_path are required"}
    resolved = resolve_repo_path(repo_input)
    if resolved['error']:
        return {"error": resolved['error']}
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, ghost_developer, question, file_path, resolved['path'], author)

@app.post("/api/onboarding")
async def onboarding(body: dict):
    role = body.get("role", "fullstack").strip()
    repo_path = body.get("repo_path", "").strip()

    resolved = resolve_repo_path(repo_path)
    if resolved['error']:
        return {"error": resolved['error']}

    local_path = resolved['path']

    # Build a SHORT file list — only top 20 most important files
    file_list = []
    skip = {'.git','__pycache__','node_modules',
            '.venv','venv','dist','build'}
    valid_ext = {'.py','.js','.ts','.jsx','.tsx','.md'}

    for root, dirs, files in os.walk(local_path):
        dirs[:] = [d for d in dirs if d not in skip]
        for f in files:
            if any(f.endswith(e) for e in valid_ext):
                rel = os.path.relpath(
                    os.path.join(root, f), local_path
                ).replace('\\','/')
                file_list.append(rel)
        if len(file_list) >= 20:
            break

    files_str = '\n'.join(file_list[:20])

    role_map = {
        'fullstack': 'Full Stack Developer',
        'backend':   'Backend Developer',
        'frontend':  'Frontend Developer',
        'devops':    'DevOps Engineer',
        'qa':        'QA Engineer',
        'aiml':      'AI/ML Engineer',
    }
    role_label = role_map.get(role, 'Developer')

    # SHORT focused prompt — phrased as Q&A to avoid Bob creating files
    question = f"""A new {role_label} is joining this project. Answer with the onboarding info below. Do not create any files — just reply with the text.

Repo files:
{files_str}

Reply in this exact format, one sentence per item:

OVERVIEW: [what this codebase does in 2 sentences]

START HERE:
1. [filename] - [why read this first]
2. [filename] - [what you learn]
3. [filename] - [what you learn]
4. [filename] - [what you learn]
5. [filename] - [what you learn]

KEY CONCEPTS:
- [concept]: [one line]
- [concept]: [one line]
- [concept]: [one line]

FIRST TASK: [one concrete task for week 1]

Use only files from the list above. Keep answers brief."""

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, ask_bob, question, local_path
    )

    if result.get('answer'):
        return {
            "onboarding_path": result['answer'],
            "role": role,
            "total_files": len(file_list),
            "error": None
        }
    return {
        "error": result.get('error', 'Bob returned no output. Try again.')
    }

@app.post("/api/explain-issue")
async def explain_issue(body: dict):
    title = body.get("title","").strip()
    files = body.get("files",[])
    repo_input = body.get("repo_path","").strip()
    if not title:
        return {"error": "Issue title is required"}
    resolved = resolve_repo_path(repo_input)
    if resolved['error']:
        return {"error": resolved['error']}
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, explain_arch_issue, title, files, resolved['path'])
