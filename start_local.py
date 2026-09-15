#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Local launcher for Profis Foreign Invoice XML Generator.
Starts the local server on http://localhost:3000, opens the default web browser,
and gracefully terminates the background process on exit (Ctrl+C).
"""

import os
import sys
import time
import socket
import signal
import subprocess
import webbrowser


def is_port_open(host: str = "127.0.0.1", port: int = 3000) -> bool:
    """Check if a network port is accepting connections."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def main():
    print("=" * 60)
    print(" Profis Foreign Invoice XML Generator - Local Launcher")
    print("=" * 60)

    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)

    server_process = None

    try:
        # Check if node_modules exists, otherwise prompt to install
        if not os.path.isdir(os.path.join(project_root, "node_modules")):
            print("[INFO] Installing required dependencies (npm install)...")
            subprocess.run(["npm", "install"], check=True)

        print("[INFO] Starting local dev server on port 3000...")
        # Start server as a separate process group for clean termination
        if sys.platform == "win32":
            server_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=project_root,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            server_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=project_root,
                preexec_fn=os.setsid
            )

        target_url = "http://localhost:3000"
        print(f"[INFO] Waiting for server to become ready at {target_url}...")

        # Wait for server up to 30 seconds
        max_attempts = 60
        attempts = 0
        server_ready = False

        while attempts < max_attempts:
            if is_port_open("127.0.0.1", 3000):
                server_ready = True
                break
            # Check if process crashed early
            if server_process.poll() is not None:
                print("[ERROR] Dev server process exited unexpectedly.")
                return 1
            time.sleep(0.5)
            attempts += 1

        if server_ready:
            print(f"[SUCCESS] Server is live! Opening browser at {target_url}...")
            time.sleep(0.3)
            webbrowser.open(target_url)
            print("\n" + "-" * 60)
            print(" Application is running.")
            print(" Press Ctrl+C in this terminal to safely stop the server.")
            print("-" * 60 + "\n")

            # Keep parent process alive waiting for user interrupt
            while True:
                time.sleep(1)
        else:
            print("[WARNING] Server took longer than expected to bind port 3000.")
            print(f"You can try opening {target_url} manually in your browser.")
            server_process.wait()

    except KeyboardInterrupt:
        print("\n[INFO] Received stop signal (Ctrl+C). Shutting down server cleanly...")
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {e}")
    finally:
        if server_process and server_process.poll() is None:
            print("[INFO] Terminating background server process...")
            try:
                if sys.platform == "win32":
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(server_process.pid)],
                        capture_output=True
                    )
                else:
                    os.killpg(os.getpgid(server_process.pid), signal.SIGTERM)
            except Exception:
                server_process.kill()
            print("[INFO] Server stopped. Goodbye!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
