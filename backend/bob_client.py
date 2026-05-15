"""
Bob CLI Client — wraps IBM BobShell for all AI interactions.
During hackathon: replace BOB_CMD with the exact BobShell command syntax.
"""
import subprocess
import re
import time

# ── Bob command — update this on hackathon day once you confirm syntax ──
BOB_CMD = r"C:\Users\Kanhaiya\AppData\Roaming\npm\bob.cmd"

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

def ask_bob(question: str, repo_path: str) -> dict:
    if not is_bob_available():
        return {
            "answer": None,
            "error": "IBM Bob CLI not connected.",
            "connected": False
        }
    try:
        safe_question = question.replace('"', "'")
        cmd = f'"{BOB_CMD}" -p "{safe_question}"'

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180,
            cwd=repo_path,
            shell=True,
            encoding='utf-8',
            errors='replace'
        )

        output = (result.stdout or '').strip()
        if not output:
            output = (result.stderr or '').strip()

        if output:
            completion_parts = re.split(
                r'\[using tool attempt_completion[^\]]*\]',
                output
            )

            if len(completion_parts) > 1:
                after = completion_parts[-1]
                after = after.replace('---output---', '').strip()
                if after:
                    return {"answer": after, "connected": True, "error": None}

            clean = re.sub(r'<thinking>.*?</thinking>', '', output, flags=re.DOTALL)
            clean = re.sub(r'\[using tool[^\]]*\]', '', clean)
            clean = clean.replace('---output---', '')
            lines = [l for l in clean.split('\n') if l.strip()]
            clean = '\n'.join(lines).strip()
            if clean:
                return {"answer": clean, "connected": True, "error": None}

        return {
            "answer": None,
            "error": "Bob returned no output. Try again.",
            "connected": True
        }
    except subprocess.TimeoutExpired:
        return {
            "answer": None,
            "error": "Bob timed out after 3 minutes. Try a shorter question.",
            "connected": True
        }
    except Exception as e:
        return {"answer": None, "error": str(e), "connected": False}

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