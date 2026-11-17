import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";

interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  MIGRATION_TOKEN?: string;
}

function createAuth(env: Env, request: Request) {
  const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL || new URL(request.url).origin,
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
    ...(trustedOrigins?.length ? { trustedOrigins } : {}),
  });
}

function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      try {
        const result = await env.DB.prepare(
          "SELECT 1 AS connected"
        ).first<{ connected: number }>();

        return Response.json({
          success: true,
          service: "fedemic-cloud-api",
          database: "connected",
          result,
        });
      } catch {
        return Response.json(
          {
            success: false,
            service: "fedemic-cloud-api",
            database: "connection_failed",
          },
          { status: 500 }
        );
      }
    }

    // One-time, token-protected Better Auth schema setup.
    // This uses Better Auth's D1/Kysely migration helper and does not
    // replace the five existing Fedemic Cloud application tables.
    if (url.pathname === "/__admin/migrate-auth") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }

      if (!env.MIGRATION_TOKEN) {
        return Response.json(
          { error: "Migration endpoint is not configured." },
          { status: 503 }
        );
      }

      const authorization = request.headers.get("Authorization");
      if (authorization !== `Bearer ${env.MIGRATION_TOKEN}`) {
        return unauthorized();
      }

      if (!env.BETTER_AUTH_SECRET) {
        return Response.json(
          { error: "Authentication is not configured." },
          { status: 503 }
        );
      }

      try {
        const auth = createAuth(env, request);
        const migration = await getMigrations(auth.options);
        await migration.runMigrations();

        return Response.json({
          success: true,
          message: "Better Auth database migration completed.",
        });
      } catch {
        return Response.json(
          {
            success: false,
            error: "Better Auth migration failed. Check the Worker logs.",
          },
          { status: 500 }
        );
      }
    }

    if (url.pathname === "/api/auth" || url.pathname.startsWith("/api/auth/")) {
      if (!env.BETTER_AUTH_SECRET) {
        return Response.json(
          { error: "Authentication is not configured." },
          { status: 503 }
        );
      }

      const auth = createAuth(env, request);
      return auth.handler(request);
    }

    return Response.json(
      { error: "Not found" },
      { status: 404 }
    );
  },
} satisfies ExportedHandler<Env>;
