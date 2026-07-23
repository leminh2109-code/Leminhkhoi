import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  emoji: z.string().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.entry.findUnique({
    where: { id: params.id },
    include: { author: { select: { name: true } } },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...entry,
    images: JSON.parse(entry.images),
    metadata: JSON.parse(entry.metadata),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = updateSchema.parse(body);

  const entry = await prisma.entry.update({
    where: { id: params.id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.emoji !== undefined && { emoji: data.emoji }),
      ...(data.images && { images: JSON.stringify(data.images) }),
      ...(data.metadata && { metadata: JSON.stringify(data.metadata) }),
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({
    ...entry,
    images: JSON.parse(entry.images),
    metadata: JSON.parse(entry.metadata),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.entry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
