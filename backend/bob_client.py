"""
Bob CLI Client — wraps IBM BobShell for all AI interactions.
During hackathon: replace BOB_CMD with the exact BobShell command syntax.
"""
import subprocess
import os

# ── Bob command — update this on hackathon day once you confirm syntax ──
BOB_CMD = "bob"  # or full path like "C:/Users/.../bob.exe"

def is_bob_available() -> bool:
    try:
        result = subprocess.run(
            [BOB_CMD, "--version"],
            capture_output=True, text=True, timeout=10
        )
        return result.returncode == 0
    except Exception:
        return False

def ask_bob(question: str, repo_path: str, mode: str = "ask") -> dict:
    """Ask Bob a question about a repository."""
    if not is_bob_available():
        return {
            "answer": None,
            "error": "IBM Bob CLI not connected. Run 'bob --version' to verify installation.",
            "connected": False
        }
    try:
        result = subprocess.run(
            [BOB_CMD, "--mode", mode, "--repo", repo_path, "--query", question],
            capture_output=True, text=True, timeout=120, cwd=repo_path
        )
        if result.returncode == 0:
            return {"answer": result.stdout.strip(), "connected": True, "error": None}
        else:
            return {"answer": None, "error": result.stderr.strip(), "connected": True}
    except subprocess.TimeoutExpired:
        return {"answer": None, "error": "Bob timed out. Try a more specific question.", "connected": True}
    except Exception as e:
        return {"answer": None, "error": str(e), "connected": False}

def generate_knowledge_doc(file_path: str, repo_path: str) -> dict:
    """Generate a knowledge transfer document for a file using Bob."""
    question = f"""Using the @knowledge-audit skill, analyze {file_path} and generate a complete knowledge transfer document.
Include: WHAT THIS FILE DOES, WHY IT EXISTS, CRITICAL DEPENDENCIES, THE TRICKY PARTS, SAFE TO CHANGE, DO NOT TOUCH, and 3 QUESTIONS TO ASK before modifying."""
    return ask_bob(question, repo_path, mode="ask")

def ghost_developer(question: str, file_path: str, repo_path: str, author: str) -> dict:
    """Answer as if the original author is responding — Ghost Developer mode."""
    prompt = f"""You are acting as the original author of {file_path} in this repository ({author}).
A new developer is asking you a question about your code. Answer from your perspective as the person who wrote it.
Use the full repository context to give a deeply informed answer.
Question: {question}"""
    return ask_bob(prompt, repo_path, mode="ask")

def explain_arch_issue(issue_title: str, files: list, repo_path: str) -> dict:
    """Ask Bob to explain an architectural issue and suggest a fix."""
    files_str = ', '.join(files[:5])
    question = f"""Analyze this architectural issue in the codebase: "{issue_title}".
Files involved: {files_str}.
Explain WHY this is dangerous with specific reference to these files, and provide a concrete step-by-step refactoring plan to fix it."""
    return ask_bob(question, repo_path, mode="plan")