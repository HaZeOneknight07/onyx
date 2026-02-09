import { Hono } from "hono";
import type { AuthEnv } from "../middleware/auth";
import { subscribeRealtime } from "../lib/realtime";

export const realtimeRoutes = new Hono<AuthEnv>().get("/", (c) => {
  const projectId = c.req.param("projectId")!;
  const encoder = new TextEncoder();

  let onClose: (() => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: change\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const unsubscribe = subscribeRealtime(projectId, send);

      controller.enqueue(
        encoder.encode(
          `event: ready\ndata: ${JSON.stringify({ ok: true, timestamp: new Date().toISOString() })}\n\n`
        )
      );

      const ping = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
      }, 15000);

      onClose = () => {
        closed = true;
        clearInterval(ping);
        unsubscribe();
      };
    },
    cancel() {
      if (onClose) onClose();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
