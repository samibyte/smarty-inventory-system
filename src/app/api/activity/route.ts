import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const limitParam = parseInt(searchParams.get("limit") || "10", 10);

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit =
    Number.isNaN(limitParam) || limitParam < 1 ? 10 : Math.min(limitParam, 100);
  const offset = (page - 1) * limit;

  const db = await readDb();
  const logs = db.activityLogs.slice(offset, offset + limit);
  const total = db.activityLogs.length;

  return NextResponse.json({ data: logs, total, page, limit });
}
