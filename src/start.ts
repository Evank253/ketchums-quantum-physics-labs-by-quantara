import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    const err = error as any;
    const stack = err?.stack ?? String(err);
    const msg = err?.message ?? String(err);
    console.error("[srv-500]", JSON.stringify({
      id,
      method: request?.method,
      url: request?.url,
      message: msg,
      stack,
    }));
    const isDev = process.env.NODE_ENV !== "production";
    return new Response(renderErrorPage({ id, message: isDev ? msg : undefined, stack: isDev ? stack : undefined }), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8", "x-error-id": id },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
