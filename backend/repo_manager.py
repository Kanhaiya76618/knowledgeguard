import os
import shutil
import subprocess
import hashlib
import time
from config import TEMP_DIR, CLONE_TIMEOUT, MAX_CLONE_SIZE_MB


def is_github_url(path: str) -> bool:
    return (path.startswith('https://github.com/') or
            path.startswith('http://github.com/') or
            path.startswith('git@github.com:'))


def get_clone_path(url: str) -> str:
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
    repo_name = url.rstrip('/').split('/')[-1].replace('.git', '')
    return os.path.join(TEMP_DIR, f"{repo_name}_{url_hash}")


def clone_repo(url: str) -> dict:
    clone_path = get_clone_path(url)

    if os.path.exists(clone_path):
        if time.time() - os.stat(clone_path).st_mtime < 3600:
            return {"path": clone_path, "error": None, "cached": True}
        shutil.rmtree(clone_path, ignore_errors=True)

    try:
        os.makedirs(TEMP_DIR, exist_ok=True)
        result = subprocess.run(
            ['git', 'clone', '--depth=50', url, clone_path],
            capture_output=True,
            text=True,
            timeout=CLONE_TIMEOUT
        )
        if result.returncode == 0:
            return {"path": clone_path, "error": None, "cached": False}
        error = result.stderr.strip() or "Clone failed"
        return {"path": None, "error": error, "cached": False}
    except subprocess.TimeoutExpired:
        shutil.rmtree(clone_path, ignore_errors=True)
        return {"path": None, "error": "Repository clone timed out (120s)", "cached": False}
    except Exception as e:
        return {"path": None, "error": str(e), "cached": False}


def resolve_repo_path(input_path: str) -> dict:
    input_path = input_path.strip()

    if is_github_url(input_path):
        result = clone_repo(input_path)
        if result['error']:
            return {"path": None, "error": result['error'], "is_url": True}
        return {
            "path": result['path'],
            "error": None,
            "is_url": True,
            "cached": result['cached']
        }

    if not os.path.exists(input_path):
        return {"path": None, "error": f"Path not found: {input_path}", "is_url": False}
    if not os.path.isdir(input_path):
        return {"path": None, "error": "Path is not a directory", "is_url": False}
    if not os.path.exists(os.path.join(input_path, '.git')):
        return {"path": None, "error": "Not a git repository", "is_url": False}
    return {"path": input_path, "error": None, "is_url": False}
