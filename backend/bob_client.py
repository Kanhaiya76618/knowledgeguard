"""
Bob CLI Client — wraps IBM BobShell for all AI interactions.
Supports CLI (primary) and REST API (fallback when BOB_API_KEY is set).
"""
import subprocess
import re
import time
import requests
from config import BOB_CMD, BOB_API_KEY, BOB_API_URL, BOB_TIMEOUT

_bob_cache = {"result": None, "checked_at": 0}


def is_bob_available() -> bool:
    global _bob_cache
    now = time.time()
    if now - _bob_cache["checked_at"] < 30:
        return _bob_cache["result"] if _bob_cache["result"] is not None else False
    try:
        result = subprocess.run(
            f'"{BOB_CMD}" --version',
            capture_output=True, text=True,
            timeout=10, shell=True
        )
        _bob_cache["result"] = result.returncode == 0
        _bob_cache["checked_at"] = time.time()
        return _bob_cache["result"]
    except Exception:
        _bob_cache["result"] = False
        _bob_cache["checked_at"] = time.time()
        return False


def is_bob_cli_available() -> bool:
    return is_bob_available()


def clean_bob_output(output: str) -> str:
    completion_parts = re.split(
        r'\[using tool attempt_completion[^\]]*\]',
        output
    )
    if len(completion_parts) > 1:
        after = completion_parts[-1]
        after = after.replace('---output---', '').strip()
        if after:
            return after

    clean = re.sub(r'<thinking>.*?</thinking>', '', output, flags=re.DOTALL)
    clean = re.sub(r'\[using tool[^\]]*\]', '', clean)
    clean = clean.replace('---output---', '')
    lines = [l for l in clean.split('\n') if l.strip()]
    return '\n'.join(lines).strip()


def ask_bob_cli(question: str, repo_path: str) -> dict:
    try:
        safe_question = question.replace('"', "'")
        cmd = f'"{BOB_CMD}" -p "{safe_question}"'
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=BOB_TIMEOUT,
            cwd=repo_path,
            shell=True,
            encoding='utf-8',
            errors='replace'
        )
        output = (result.stdout or '').strip() or (result.stderr or '').strip()
        if output:
            clean = clean_bob_output(output)
            if clean:
                return {"answer": clean, "connected": True, "error": None}
        return {"answer": None, "error": "Bob CLI returned no output.", "connected": True}
    except subprocess.TimeoutExpired:
        return {"answer": None, "error": "Bob CLI timed out.", "connected": True}
    except Exception as e:
        return {"answer": None, "error": str(e), "connected": False}


def ask_bob_api(question: str, repo_path: str) -> dict:
    try:
        headers = {
            "Authorization": f"Bearer {BOB_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "message": question,
            "context": {"repo_path": repo_path}
        }
        response = requests.post(
            f"{BOB_API_URL}/v1/chat",
            json=payload,
            headers=headers,
            timeout=BOB_TIMEOUT
        )
        if response.status_code == 200:
            data = response.json()
            answer = data.get('response') or data.get('answer') or data.get('content', '')
            if answer:
                return {"answer": answer, "connected": True, "error": None}
        return {"answer": None, "error": f"Bob API error: {response.status_code}", "connected": True}
    except Exception as e:
        return {"answer": None, "error": f"Bob API failed: {str(e)}", "connected": False}


def ask_bob(question: str, repo_path: str) -> dict:
    if is_bob_cli_available():
        result = ask_bob_cli(question, repo_path)
        if result.get('answer'):
            return result

    if BOB_API_KEY:
        return ask_bob_api(question, repo_path)

    return {
        "answer": None,
        "error": "IBM Bob not available. Check CLI or API key.",
        "connected": False
    }


def generate_knowledge_doc(file_path: str, repo_path: str) -> dict:
    question = f"Analyze @{file_path} and generate a knowledge transfer document. Include: what this file does, why it exists, what is dangerous to change, critical dependencies, and what a new developer must know before touching it."
    return ask_bob(question, repo_path)


def ghost_developer(question: str, file_path: str, repo_path: str, author: str) -> dict:
    prompt = f"You are {author}, the original author of @{file_path}. Answer this as the developer who wrote it: {question}"
    return ask_bob(prompt, repo_path)


def explain_arch_issue(issue_title: str, files: list, repo_path: str) -> dict:
    file_refs = ' '.join([f'@{f}' for f in files[:2]])
    prompt = f"Explain this architectural issue: {issue_title}. Read these files: {file_refs}. Why is it dangerous and how should it be fixed?"
    return ask_bob(prompt, repo_path)
