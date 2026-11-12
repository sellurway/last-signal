import { betterAuth } from "better-auth";

interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
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
