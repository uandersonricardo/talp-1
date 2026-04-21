import { type ChildProcess, spawn } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");

export const BACKEND_PORT = process.env.TEST_BACKEND_PORT ?? "3001";
export const FRONTEND_PORT = process.env.TEST_FRONTEND_PORT ?? "5174";

export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

let backendProc: ChildProcess | null = null;
let frontendProc: ChildProcess | null = null;

async function waitForUrl(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // server not yet accepting connections
    }
    await new Promise<void>((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

export async function startServers(): Promise<void> {
  backendProc = spawn("npx", ["ts-node", "src/index.ts"], {
    cwd: resolve(ROOT, "backend"),
    env: { ...process.env, PORT: BACKEND_PORT },
    stdio: ["ignore", "pipe", "pipe"],
  });
  backendProc.stderr?.pipe(process.stderr);

  frontendProc = spawn("npx", ["vite", "--port", FRONTEND_PORT, "--strictPort"], {
    cwd: resolve(ROOT, "frontend"),
    env: { ...process.env, VITE_API_URL: BACKEND_URL },
    stdio: ["ignore", "pipe", "pipe"],
  });
  frontendProc.stderr?.pipe(process.stderr);

  // Ensure child processes are killed when the main process exits
  process.on("exit", stopServers);

  await Promise.all([
    waitForUrl(`${BACKEND_URL}/api/students`),
    waitForUrl(FRONTEND_URL),
  ]);
}

export function stopServers(): void {
  backendProc?.kill("SIGTERM");
  frontendProc?.kill("SIGTERM");
  backendProc = null;
  frontendProc = null;
}
