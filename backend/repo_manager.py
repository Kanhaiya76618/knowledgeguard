import os
import stat
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


def _force_rmtree(path: str) -> bool:
    """Remove a directory tree on Windows, clearing read-only bits first."""
    def _on_error(func, fpath, exc_info):
        try:
            os.chmod(fpath, stat.S_IWRITE)
            func(fpath)
        except Exception:
            pass
    try:
        shutil.rmtree(path, onerror=_on_error)
        return not os.path.exists(path)
    except Exception:
        return False


def _has_source_files(clone_path: str) -> bool:
    """Return True if the clone contains at least one non-.git source file."""
    source_exts = {'.py', '.js', '.ts', '.jsx', '.tsx', '.rb', '.go',
                   '.java', '.c', '.cpp', '.h', '.rs', '.md'}
    for root, dirs, files in os.walk(clone_path):
        dirs[:] = [d for d in dirs
                   if d not in {'.git', '__pycache__', 'node_modules'}]
        for f in files:
            if any(f.endswith(ext) for ext in source_exts):
                return True
    return False


def clone_repo(url: str) -> dict:
    clone_path = get_clone_path(url)

    # Validate any existing clone: needs .git AND actual source files
    git_dir = os.path.join(clone_path, '.git')
    if os.path.exists(clone_path):
        if os.path.exists(git_dir) and _has_source_files(clone_path):
            return {"path": clone_path, "error": None, "cached": True}
        # Corrupt/partial/empty clone — force-remove it
        removed = _force_rmtree(clone_path)
        if not removed:
            # If rmtree failed, clone to a timestamped sibling path
            clone_path = clone_path + f"_{int(time.time())}"

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
        _force_rmtree(clone_path)
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
