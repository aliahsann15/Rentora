import type { NextRequest } from "next/server";
import { clientAddressHeaders, fetchBackend } from "@/lib/server/backend";

export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path.length !== 2 || !["properties", "landlords", "tenants", "vendors"].includes(path[0]) ||
      !/^[a-z0-9_-]+\.(png|jpg|jpeg|gif|webp)$/i.test(path[1])) {
    return new Response(null, { status: 404 });
  }
  try {
    const upstream = await fetchBackend(`/media/${path.join("/")}`, { headers: clientAddressHeaders(request) });
    if (!upstream.ok) return new Response(null, { status: upstream.status >= 500 ? 502 : 404 });
    const type = upstream.headers.get("content-type") || "";
    if (!/^image\/(png|jpeg|gif|webp)(;|$)/.test(type)) return new Response(null, { status: 502 });
    return new Response(upstream.body, { headers: {
      "Content-Type": type, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600",
    } });
  } catch { return new Response(null, { status: 502 }); }
}
