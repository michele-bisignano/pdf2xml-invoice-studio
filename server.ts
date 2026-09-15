import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple local health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", offline: true });
  });

  // Client heartbeat & graceful auto-shutdown for desktop executable mode
  let lastHeartbeat = Date.now();
  let clientConnected = false;

  app.post("/api/heartbeat", (_req, res) => {
    lastHeartbeat = Date.now();
    clientConnected = true;
    res.json({ ok: true });
  });

  app.post("/api/shutdown", (_req, res) => {
    res.json({ shuttingDown: true });
    if ((process as any).pkg || process.env.DESKTOP_MODE === "true") {
      console.log("Segnale di chiusura ricevuto dalla scheda del browser. Arresto del processo...");
      setTimeout(() => process.exit(0), 500);
    }
  });

  // Watchdog: If in packaged standalone .exe mode, automatically terminate if all tabs have been closed for > 15 seconds
  if ((process as any).pkg || process.env.DESKTOP_MODE === "true") {
    setInterval(() => {
      if (clientConnected && Date.now() - lastHeartbeat > 15000) {
        console.log("Nessuna finestra browser connessa da oltre 15 secondi. Arresto automatico di GeneratoreXML.exe...");
        process.exit(0);
      }
    }, 4000);
  }

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Determine the directory containing built static files
    const candidates = [
      path.join(process.cwd(), "dist"),
      process.cwd(),
      path.dirname(process.execPath),
      path.join(path.dirname(process.execPath), "dist"),
      path.join(__dirname, "dist"),
      __dirname,
    ];

    let distPath = path.join(process.cwd(), "dist");
    for (const cand of candidates) {
      if (fs.existsSync(path.join(cand, "index.html"))) {
        distPath = cand;
        break;
      }
    }

    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Profis XML Generator avviato con successo: ${url}`);

    // Auto-open browser in standalone/production desktop environment
    if (process.env.NODE_ENV === "production" || (process as any).pkg) {
      const startCmd =
        process.platform === "win32"
          ? `start ${url}`
          : process.platform === "darwin"
          ? `open ${url}`
          : `xdg-open ${url}`;
      exec(startCmd, () => {});
    }
  });
}

startServer();
