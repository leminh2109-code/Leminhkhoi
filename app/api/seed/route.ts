import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Chỉ dùng 1 lần để tạo tài khoản Bố và Mẹ
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const body = await req.json();
  const { baPassword, mePassword } = body;

  if (!baPassword || !mePassword) {
    return NextResponse.json({ error: "Cần baPassword và mePassword" }, { status: 400 });
  }

  const baHash = await bcrypt.hash(baPassword, 10);
  const meHash = await bcrypt.hash(mePassword, 10);

  const ba = await prisma.user.upsert({
    where: { email: "ba@khoi.family" },
    update: { password: baHash },
    create: { name: "Bố", email: "ba@khoi.family", password: baHash },
  });

  const me = await prisma.user.upsert({
    where: { email: "me@khoi.family" },
    update: { password: meHash },
    create: { name: "Mẹ", email: "me@khoi.family", password: meHash },
  });

  return NextResponse.json({ ba: ba.email, me: me.email, ok: true });
}
