import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public read-only endpoint — no auth required, hides HEALTH entries
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");

  // Fetch all then filter in JS — avoids Prisma enum stale-client issues
  const entries = await prisma.entry.findMany({
    where: typeParam ? { type: typeParam as "MEMORY" } : undefined,
    include: { author: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });

  const visible = entries.filter((e) => e.type !== "HEALTH");

  return NextResponse.json(
    visible.map((e) => ({
      ...e,
      images: JSON.parse(e.images),
      metadata: JSON.parse(e.metadata),
    }))
  );
}
