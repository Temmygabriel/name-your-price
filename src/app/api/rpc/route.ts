import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const response = await fetch("https://studio.genlayer.com:8443/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data);
}