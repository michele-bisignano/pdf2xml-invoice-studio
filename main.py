#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Desktop Launcher with Automatic Heartbeat Shutdown
- Serves the static React build from 'dist/' on a local port.
- Opens the default system web browser automatically.
- Monitors heartbeats from the browser tab; if the tab is closed, 
  the server automatically shuts down and exits cleanly.
"""

import os
import sys
import time
import socket
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer
import json

# Global state for heartbeat tracking
last_heartbeat = time.time()
server_instance = None
is_shutting_down = False

class HeartbeatHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        if getattr(sys, 'frozen', False):
            base_path = sys._MEIPASS
        else:
            base_path = os.path.dirname(os.path.abspath(__file__))
        
        self.static_dir = os.path.join(base_path, "dist")
        super().__init__(*args, directory=self.static_dir, **kwargs)

    def guess_type(self, path):
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        return super().guess_type(path)

    def do_POST(self):
        global last_heartbeat
        if self.path == "/api/heartbeat":
            last_heartbeat = time.time()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
        else:
            self.send_error(404, "Not Found")

    def log_message(self, format, *args):
        if "/api/heartbeat" not in str(args):
            super().log_message(format, *args)


def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def watchdog_thread(server, grace_period=20, timeout=15.0):
    global last_heartbeat, is_shutting_down
    print(f"[INFO] Watchdog started. Waiting for browser connection...")
    
    start_time = time.time()
    while not is_shutting_down:
        time.sleep(1)
        now = time.time()
        
        if now - start_time < grace_period:
            continue
            
        if now - last_heartbeat > timeout:
            print("[INFO] Browser window/tab closed. Shutting down application...")
            is_shutting_down = True
            try:
                server.shutdown()
            except Exception:
                pass
            break


def main():
    global server_instance
    print("=" * 60)
    print(" Profis Foreign Invoice XML Generator - Desktop Launcher")
    print("=" * 60)

    port = 3000
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(("127.0.0.1", port)) == 0:
            port = find_free_port()

    server_address = ("127.0.0.1", port)
    
    try:
        server_instance = HTTPServer(server_address, HeartbeatHandler)
    except Exception as e:
        print(f"[ERROR] Could not start server on port {port}: {e}")
        sys.exit(1)

    url = f"http://127.0.0.1:{port}"
    print(f"[INFO] Starting local server at {url}")

    server_thread = threading.Thread(target=server_instance.serve_forever, daemon=True)
    server_thread.start()

    watchdog = threading.Thread(target=watchdog_thread, args=(server_instance,), daemon=True)
    watchdog.start()

    print(f"[INFO] Opening default browser at {url}...")
    webbrowser.open(url)

    try:
        server_thread.join()
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down by user request...")
    finally:
        if server_instance:
            server_instance.server_close()
        print("[INFO] Application closed successfully.")

if __name__ == "__main__":
    main()