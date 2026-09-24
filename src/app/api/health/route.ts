import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    revision: process.env.K_REVISION ?? "local",
    commit: process.env.GIT_SHA ?? "local",
  });
}
