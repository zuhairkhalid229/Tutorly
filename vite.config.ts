import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import { existsSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import path from "node:path";

// In production Vercel runs api/**/*.ts as serverless functions. This plugin
// does the same during `npm run dev`, so one command runs the whole app.
function apiRoutes(): Plugin {
  const readBody = (req: IncomingMessage) =>
    new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

  return {
    name: "tutorly-api-routes",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const url = new URL(req.url, "http://localhost");
        const file = path.resolve(__dirname, `.${url.pathname}.ts`);
        res.setHeader("content-type", "application/json");
        if (url.pathname.includes("/_") || !existsSync(file)) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: "Not found" }));
        }
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            return res.end(JSON.stringify({ error: "Method not allowed" }));
          }
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
          }
          headers.set("x-forwarded-for", req.socket.remoteAddress ?? "127.0.0.1");
          const hasBody = !["GET", "HEAD"].includes(req.method ?? "GET");
          const response: Response = await handler(
            new Request(url, { method: req.method, headers, body: hasBody ? await readBody(req) : undefined }),
          );
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          next(err);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make server-only variables (SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY) visible
  // to the dev API routes. Only VITE_* variables ever reach the browser bundle.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
    process.env[key] ??= value;
  }

  return {
    server: { host: "::", port: 8080 },
    plugins: [react(), apiRoutes()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            supabase: ["@supabase/supabase-js"],
          },
        },
      },
    },
  };
});
