import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.setting.findUnique({ where: { key: "cover" } });
  if (!setting) return NextResponse.json({ image: null, pos: { x: 50, y: 0 } });

  try {
    return NextResponse.json(JSON.parse(setting.value));
  } catch {
    return NextResponse.json({ image: null, pos: { x: 50, y: 0 } });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await prisma.setting.upsert({
    where: { key: "cover" },
    update: { value: JSON.stringify(body) },
    create: { key: "cover", value: JSON.stringify(body) },
  });

  return NextResponse.json({ ok: true });
}
