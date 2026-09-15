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
import subprocess
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer
import json

# Global state for heartbeat tracking
last_heartbeat = time.time()
server_instance = None
is_shutting_down = False

class HeartbeatHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        meipass_attr = getattr(sys, "_MEIPASS", None)
        if meipass_attr:
            base_path = str(meipass_attr)
        else:
            base_path = os.path.dirname(os.path.abspath(__file__))
        
        self.static_dir = os.path.join(base_path, "dist")
        super().__init__(*args, directory=self.static_dir, **kwargs)

    def guess_type(self, path):
        path_str = str(path)
        if path_str.endswith('.js') or path_str.endswith('.mjs'):
            return 'application/javascript'
        if path_str.endswith('.css'):
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

    def do_GET(self):
        # Serve index.html for root or SPA fallback if the file doesn't exist
        req_path = self.path.split("?")[0]
        full_path = os.path.join(self.static_dir, req_path.lstrip("/"))
        
        # If accessing root or file doesn't exist (SPA client route), serve index.html
        if req_path in ("/", "") or not os.path.exists(full_path):
            index_path = os.path.join(self.static_dir, "index.html")
            if os.path.exists(index_path):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(index_path, "rb") as f:
                    self.wfile.write(f.read())
                return
        
        return super().do_GET()

    def log_message(self, format, *args):
        if "/api/heartbeat" not in str(args):
            super().log_message(format, *args)


def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def timedelta_watchdog(server, grace_period=25, timeout=15.0):
    global last_heartbeat, is_shutting_down
    print(f"[INFO] Watchdog attivo. In attesa di connessione dal browser...")
    
    start_time = time.time()
    while not is_shutting_down:
        time.sleep(1)
        now = time.time()
        
        if now - start_time < grace_period:
            continue
            
        if now - last_heartbeat > timeout:
            print("[INFO] Scheda o finestra del browser chiusa. Chiusura applicazione...")
            is_shutting_down = True
            try:
                server.shutdown()
            except Exception:
                pass
            break


def ensure_dist_exists():
    """Ensure the static frontend is compiled before launching."""
    meipass_attr = getattr(sys, "_MEIPASS", None)
    if meipass_attr:
        base_path = str(meipass_attr)
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    dist_index = os.path.join(base_path, "dist", "index.html")
    if not os.path.exists(dist_index) and not getattr(sys, 'frozen', False):
        print("[INFO] Cartella 'dist/' non trovata. Esecuzione automatica di 'npm run build'...")
        try:
            subprocess.run(["npm", "run", "build"], cwd=base_path, check=True, shell=True)
            print("[INFO] Build completata con successo!")
        except Exception as e:
            print(f"[ERRORE] Impossibile completare npm run build: {e}")
            print("[SUGGERIMENTO] Esegui manualmente 'npm run build' prima di avviare main.py")


def main():
    global server_instance
    print("=" * 60)
    print(" Profis Foreign Invoice XML Generator - Desktop Launcher")
    print("=" * 60)

    ensure_dist_exists()

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
    print(f"[INFO] Server locale avviato su {url}")

    server_thread = threading.Thread(target=server_instance.serve_forever, daemon=True)
    server_thread.start()

    watchdog = threading.Thread(target=timedelta_watchdog, args=(server_instance,), daemon=True)
    watchdog.start()

    print(f"[INFO] Apertura del browser predefinito a {url}...")
    webbrowser.open(url)

    try:
        server_thread.join()
    except KeyboardInterrupt:
        print("\n[INFO] Chiusura su richiesta dell'utente...")
    finally:
        if server_instance:
            server_instance.server_close()
        print("[INFO] Applicazione chiusa correttamente.")

if __name__ == "__main__":
    main()
