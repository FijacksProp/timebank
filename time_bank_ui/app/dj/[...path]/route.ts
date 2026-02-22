import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE = (process.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

async function forward(request: NextRequest, pathParts: string[], method: string) {
  const search = request.nextUrl.search || "";
  let normalizedPath = pathParts.join("/");
  if (!normalizedPath.endsWith("/")) {
    normalizedPath = `${normalizedPath}/`;
  }
  const targetUrl = `${BACKEND_API_BASE}/${normalizedPath}${search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");

  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);

  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(method)) {
    init.body = await request.text();
  }

  const upstream = await fetch(targetUrl, init);
  const responseText = await upstream.text();

  const response = new NextResponse(responseText, {
    status: upstream.status,
  });

  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) response.headers.set("content-type", upstreamContentType);

  const getSetCookie = (upstream.headers as any).getSetCookie;
  if (typeof getSetCookie === "function") {
    const cookies = getSetCookie.call(upstream.headers) as string[];
    for (const cookie of cookies) {
      response.headers.append("set-cookie", cookie);
    }
  } else {
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
  }

  return response;
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path, "GET");
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path, "POST");
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path, "PUT");
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path, "PATCH");
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path, "DELETE");
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path, "OPTIONS");
}
