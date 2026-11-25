"""Start LitLens: the backend (FastAPI on :8000) and the frontend (Vite on :5173) together.

Works on Windows and macOS and uses only the Python standard library, so any
Python 3 can run it. The backend itself runs in backend/.venv (Python 3.14).

    py start.py              # Windows
    python3 start.py         # macOS

On the first run (or after deleting backend/.venv or frontend/node_modules) it
installs what's missing, and it reinstalls automatically when requirements.txt
or package-lock.json change. Press Ctrl+C once to stop both servers.

Options:
    --install      reinstall the backend and frontend dependencies first
    --reload       restart the backend automatically when Python files change
    --no-browser   don't open the browser when the app is ready
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV = BACKEND / ".venv"
IS_WINDOWS = os.name == "nt"
VENV_PY = VENV / "Scripts" / "python.exe" if IS_WINDOWS else VENV / "bin" / "python"

# Markers that record which dependency files were installed successfully.
BACKEND_MARKER = VENV / ".litlens-installed"
FRONTEND_MARKER = FRONTEND / "node_modules" / ".litlens-installed"

BACKEND_PORT = 8000
FRONTEND_PORT = 5173  # fixed in frontend/vite.config.ts (strictPort)
HEALTH_URL = f"http://127.0.0.1:{BACKEND_PORT}/api/health"
APP_URL = f"http://localhost:{FRONTEND_PORT}"

# --- output -----------------------------------------------------------------

_COLOR = sys.stdout.isatty()
if IS_WINDOWS and _COLOR:
    os.system("")  # turns on ANSI colours in the Windows console

_RESET, _BOLD = ("\033[0m", "\033[1m") if _COLOR else ("", "")
_TAGS = {
    "start": "\033[33m" if _COLOR else "",  # yellow
    "backend": "\033[36m" if _COLOR else "",  # cyan
    "frontend": "\033[35m" if _COLOR else "",  # magenta
}
_print_lock = threading.Lock()


def log(tag: str, msg: str) -> None:
    with _print_lock:
        print(f"{_TAGS[tag]}{_BOLD}[{tag:<8}]{_RESET} {msg}", flush=True)


def say(msg: str) -> None:
    log("start", msg)


def die(msg: str) -> NoReturn:
    say(msg)
    sys.exit(1)


# --- setup ------------------------------------------------------------------


def fingerprint(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(cmd: list[str], cwd: Path = ROOT) -> None:
    """Run a setup command with its output shown directly; stop if it fails."""
    if subprocess.run(cmd, cwd=cwd, check=False).returncode != 0:
        die(f"This command failed: {' '.join(cmd)}")


def find_python_314() -> list[str]:
    """The backend pins packages for Python 3.14, so the venv must use it."""
    if sys.version_info[:2] == (3, 14):
        return [sys.executable]
    candidate = ["py", "-3.14"] if IS_WINDOWS else ["python3.14"]
    if shutil.which(candidate[0]):
        check = subprocess.run(
            [*candidate, "-c", "import sys; print(sys.version_info[:2] == (3, 14))"],
            capture_output=True,
            text=True,
            check=False,
        )
        if check.returncode == 0 and check.stdout.strip() == "True":
            return candidate
    die(
        "Python 3.14 is needed for the backend. Install it (README: Prerequisites), then run this again."
    )


def ensure_backend(force: bool) -> None:
    requirements = BACKEND / "requirements.txt"
    wanted = fingerprint(requirements)
    installed = BACKEND_MARKER.read_text().strip() if BACKEND_MARKER.exists() else ""
    if not force and VENV_PY.exists() and installed == wanted:
        return
    if not VENV_PY.exists():
        say("Creating the backend Python environment (backend/.venv)...")
        run([*find_python_314(), "-m", "venv", str(VENV)])
    say(
        "Installing backend packages. The first time takes a few minutes (PyTorch is large)."
    )
    run([str(VENV_PY), "-m", "pip", "install", "--upgrade", "pip"])
    run([str(VENV_PY), "-m", "pip", "install", "-r", str(requirements)])
    BACKEND_MARKER.write_text(wanted)


def ensure_frontend(npm: str, force: bool) -> None:
    lockfile = FRONTEND / "package-lock.json"
    wanted = fingerprint(lockfile)
    if (
        not force
        and FRONTEND_MARKER.exists()
        and FRONTEND_MARKER.read_text().strip() == wanted
    ):
        return
    say("Installing frontend packages (npm install)...")
    run([npm, "install"], cwd=FRONTEND)
    FRONTEND_MARKER.write_text(wanted)


def port_in_use(port: int) -> bool:
    # "localhost" tries both 127.0.0.1 and ::1 (Vite may listen on either).
    try:
        with socket.create_connection(("localhost", port), timeout=0.5):
            return True
    except OSError:
        return False


# --- running the servers ----------------------------------------------------


def spawn(
    tag: str, cmd: list[str], cwd: Path, env: dict[str, str] | None = None
) -> subprocess.Popen[str]:
    """Start a server in its own process group and prefix its output with [tag]."""
    group = (
        {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP}
        if IS_WINDOWS
        else {"start_new_session": True}
    )
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        **group,
    )

    def pump() -> None:
        assert proc.stdout is not None
        for line in proc.stdout:
            log(tag, line.rstrip())

    threading.Thread(target=pump, daemon=True).start()
    return proc


def stop(proc: subprocess.Popen[str] | None) -> None:
    """Stop a server and everything it started (uvicorn workers, Vite's esbuild)."""
    if proc is None or proc.poll() is not None:
        return
    if IS_WINDOWS:
        subprocess.run(
            ["taskkill", "/T", "/F", "/PID", str(proc.pid)],
            capture_output=True,
            check=False,
        )
    else:
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        if not IS_WINDOWS:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        proc.wait()


def wait_until_up(
    url: str, procs: list[subprocess.Popen[str]], timeout_s: float
) -> bytes | None:
    """Poll `url` until it answers 200. Returns the body, or None on timeout or a crash."""
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        if any(p.poll() is not None for p in procs):
            return None
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status == 200:
                    return resp.read()
        except OSError:
            pass
        time.sleep(1)
    return None


def report_health(body: bytes) -> None:
    try:
        health = json.loads(body)
    except ValueError:
        return
    providers = health.get("providers", {})
    if health.get("demo_mode"):
        say(
            "Demo mode is ON: only the pre-warmed topics work, and no network calls are made."
        )
    elif not providers.get("groq") and not providers.get("gemini"):
        say(
            "WARNING: no LLM key set, so live reviews will fail. Add GROQ_API_KEY to .env and restart."
        )


def _interrupt(*_: object) -> None:
    raise KeyboardInterrupt


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Start the LitLens backend and frontend together."
    )
    parser.add_argument(
        "--install", action="store_true", help="reinstall dependencies first"
    )
    parser.add_argument(
        "--reload", action="store_true", help="auto-restart the backend on code changes"
    )
    parser.add_argument(
        "--no-browser", action="store_true", help="don't open the browser"
    )
    args = parser.parse_args()

    npm = shutil.which("npm")
    if npm is None:
        die(
            "Node.js (npm) is needed for the frontend. Install Node.js LTS, then run this again."
        )
    if not (ROOT / ".env").exists():
        say(
            "No .env file yet: copy .env.example to .env and add your keys (README step 1)."
        )

    for port, name in ((BACKEND_PORT, "backend"), (FRONTEND_PORT, "frontend")):
        if port_in_use(port):
            die(
                f"Port {port} ({name}) is already in use. Is LitLens already running? Stop it first."
            )

    ensure_backend(args.install)
    ensure_frontend(npm, args.install)

    # Closing the terminal or a plain `kill` stops both servers cleanly too.
    for name in ("SIGTERM", "SIGHUP"):
        if hasattr(signal, name):
            signal.signal(getattr(signal, name), _interrupt)

    backend_cmd = [
        str(VENV_PY), "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1", "--port", str(BACKEND_PORT),
    ]  # fmt: skip
    if args.reload:
        backend_cmd.append("--reload")
    backend_env = {**os.environ, "PYTHONUNBUFFERED": "1"}

    backend = frontend = None
    try:
        say("Starting the backend and the frontend...")
        backend = spawn("backend", backend_cmd, BACKEND, backend_env)
        frontend = spawn("frontend", [npm, "run", "dev"], FRONTEND)

        # The backend's first start downloads the embedding model, so allow time.
        body = wait_until_up(HEALTH_URL, [backend, frontend], timeout_s=180)
        if (
            body is None
            or wait_until_up(APP_URL, [backend, frontend], timeout_s=60) is None
        ):
            say("A server failed to start; see the messages above.")
            return 1
        report_health(body)
        say(f"{_BOLD}LitLens is ready: {APP_URL}{_RESET}   (Ctrl+C to stop)")
        if not args.no_browser:
            webbrowser.open(APP_URL)

        while True:
            for name, proc in (("backend", backend), ("frontend", frontend)):
                code = proc.poll()
                if code is not None:
                    say(
                        f"The {name} stopped (exit code {code}), so stopping everything."
                    )
                    return code or 1
            time.sleep(0.5)
    except KeyboardInterrupt:
        say("Stopping...")
        return 0
    finally:
        stop(frontend)
        stop(backend)
        say("Stopped.")


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:  # Ctrl+C during installation
        sys.exit(130)
