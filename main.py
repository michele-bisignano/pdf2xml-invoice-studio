#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Desktop Launcher with Automatic Heartbeat Shutdown
- Serves the static React build from 'dist/' on a local port.
- Opens the default system web browser automatically.
- Monitors heartbeats from the browser tab; if the tab is closed, 
  the server automatically shuts down and exits cleanly.
- Fully compatible with PyInstaller --onefile and --noconsole mode on Windows.
"""

import os
import sys
import time
import socket
import threading
import subprocess
import webbrowser
import tempfile
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer
import mimetypes

# Fix for PyInstaller --noconsole mode where sys.stdout and sys.stderr are None
class SafeStreamWriter:
    def __init__(self, log_file=None):
        self.log_file = log_file

    def write(self, text):
        if not text:
            return
        if self.log_file:
            try:
                with open(self.log_file, "a", encoding="utf-8") as f:
                    f.write(text)
            except Exception:
                pass

    def flush(self):
        pass

LOG_FILE = os.path.join(tempfile.gettempdir(), "selfinvoice_launcher.log")
safe_writer = SafeStreamWriter(LOG_FILE)

if sys.stdout is None:
    sys.stdout = safe_writer
if sys.stderr is None:
    sys.stderr = safe_writer
if sys.stdin is None:
    class DummyStdin:
        def read(self, *args): return ""
        def readline(self, *args): return ""
    sys.stdin = DummyStdin()

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    try:
        print(formatted)
    except Exception:
        pass
    safe_writer.write(formatted + "\n")

# Global state for heartbeat tracking
last_heartbeat = time.time()
server_instance = None
is_shutting_down = False

# Explicit MIME mappings to avoid Windows registry issues (.js mapped to text/plain)
MIME_MAP = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".wasm": "application/wasm",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".traineddata": "application/octet-stream",
    ".txt": "text/plain; charset=utf-8",
}

def get_static_directory():
    """Resolve the location of the compiled frontend dist directory."""
    candidates = []
    
    # 1. PyInstaller extracted bundle (_MEIPASS)
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        candidates.append(os.path.join(meipass, "dist"))
        candidates.append(meipass)

    # 2. Directory containing this script / executable
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates.append(os.path.join(script_dir, "dist"))
    candidates.append(script_dir)

    # 3. Current working directory
    candidates.append(os.path.join(os.getcwd(), "dist"))
    candidates.append(os.getcwd())

    for path in candidates:
        if os.path.exists(os.path.join(path, "index.html")):
            log(f"Found static files in: {path}")
            return path

    log(f"[WARN] index.html not found in candidate paths. Falling back to: {candidates[0]}")
    return candidates[0]


STATIC_DIR = get_static_directory()


class HeartbeatHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def guess_type(self, path):
        path_str = str(path).lower()
        for ext, mime in MIME_MAP.items():
            if path_str.endswith(ext):
                return mime
        return super().guess_type(path)

    def do_POST(self):
        global last_heartbeat
        if self.path == "/api/heartbeat":
            last_heartbeat = time.time()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        # Serve index.html for root or SPA fallback when requesting unknown non-file route
        req_path = self.path.split("?")[0]
        rel_path = req_path.lstrip("/")
        full_path = os.path.join(STATIC_DIR, rel_path)

        if req_path in ("/", "") or (not os.path.exists(full_path) and "." not in os.path.basename(rel_path)):
            index_path = os.path.join(STATIC_DIR, "index.html")
            if os.path.exists(index_path):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(index_path, "rb") as f:
                    self.wfile.write(f.read())
                return

        return super().do_GET()

    def end_headers(self):
        # Enable CORS and basic security headers for local app
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress heartbeat logs to keep console/log clean
        if "/api/heartbeat" not in str(args):
            try:
                msg = format % args
                log(f"[HTTP] {msg}")
            except Exception:
                pass


def find_free_port(start_port=3000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(("127.0.0.1", start_port)) != 0:
            return start_port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def timedelta_watchdog(server, grace_period=45.0, timeout=20.0):
    """Background thread: Shuts down server when browser tab is closed."""
    global last_heartbeat, is_shutting_down
    log("Watchdog monitor active. Waiting for browser heartbeat...")
    
    start_time = time.time()
    while not is_shutting_down:
        time.sleep(1.0)
        now = time.time()
        
        # Give enough time for initial page load
        if now - start_time < grace_period:
            continue
            
        if now - last_heartbeat > timeout:
            log(f"No heartbeat received for {timeout}s. Browser tab closed. Shutting down...")
            is_shutting_down = True
            try:
                server.shutdown()
            except Exception as e:
                log(f"Shutdown error: {e}")
            break


def ensure_dist_exists():
    """Ensure the static frontend is compiled before launching when running in dev."""
    dist_index = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(dist_index) and not getattr(sys, 'frozen', False):
        log("Folder 'dist/' not found. Running 'npm run build' automatically...")
        try:
            subprocess.run(["npm", "run", "build"], cwd=os.path.dirname(os.path.abspath(__file__)), check=True, shell=True)
            log("Build finished successfully!")
        except Exception as e:
            log(f"[ERROR] Could not build frontend: {e}")


def main():
    global server_instance, is_shutting_down
    log("=" * 60)
    log(" SelfInvoice XML Studio - Desktop Launcher")
    log("=" * 60)

    ensure_dist_exists()

    port = find_free_port(3000)
    server_address = ("127.0.0.1", port)
    
    try:
        server_instance = HTTPServer(server_address, HeartbeatHandler)
    except Exception as e:
        log(f"[FATAL] Could not start server on port {port}: {e}")
        sys.exit(1)

    url = f"http://127.0.0.1:{port}"
    log(f"Local server listening on {url}")

    server_thread = threading.Thread(target=server_instance.serve_forever, daemon=True)
    server_thread.start()

    watchdog = threading.Thread(target=timedelta_watchdog, args=(server_instance,), daemon=True)
    watchdog.start()

    # Short delay to ensure server socket is ready before browser is launched
    time.sleep(0.3)
    log(f"Opening browser at {url}...")
    webbrowser.open(url)

    try:
        while not is_shutting_down and server_thread.is_alive():
            time.sleep(0.5)
    except KeyboardInterrupt:
        log("Termination requested by user.")
    finally:
        is_shutting_down = True
        if server_instance:
            try:
                server_instance.server_close()
            except Exception:
                pass
        log("Application closed successfully.")


if __name__ == "__main__":
    main()
