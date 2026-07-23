import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["MEMORY", "TRAVEL", "EDUCATION", "BOOK", "SKILL", "SCHOOL"]),
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  emoji: z.string().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");

  const entries = await prisma.entry.findMany({
    where: type ? { type: type as "MEMORY" } : undefined,
    include: { author: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(
    entries.map((e) => ({
      ...e,
      images: JSON.parse(e.images),
      metadata: JSON.parse(e.metadata),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const entry = await prisma.entry.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      emoji: data.emoji,
      images: JSON.stringify(data.images || []),
      metadata: JSON.stringify(data.metadata || {}),
      authorId: session.user.id,
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({
    ...entry,
    images: JSON.parse(entry.images),
    metadata: JSON.parse(entry.metadata),
  });
}
