# Nhật ký Khôi

App lưu giữ hành trình lớn lên của Lê Minh Khôi (sinh 22/6/2022).

## Stack
- Next.js 14 + TypeScript + Tailwind CSS
- Prisma + Supabase (PostgreSQL + Storage)
- NextAuth v4 (2 tài khoản: Ba và Mẹ)

## Cấu trúc
- `app/dashboard` — Trang chủ, thống kê, timeline gần đây
- `app/education` — Kỹ năng / Sách / Trường học
- `app/travel` — Du lịch + ảnh
- `app/memories` — Kỷ niệm đặc biệt
- `components/EntryModal.tsx` — Form thêm mới dùng chung
- `lib/` — db, auth, supabase, utils, types

## Setup
1. Copy `.env.example` → `.env` và điền Supabase credentials
2. `npm run db:push` để migrate
3. `npm run dev`
4. Gọi `POST /api/seed` với `{baPassword, mePassword}` để tạo 2 tài khoản
