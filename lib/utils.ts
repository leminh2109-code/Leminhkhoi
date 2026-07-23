import { clsx, type ClassValue } from "clsx";
import { differenceInMonths, differenceInYears, format } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const KHOI_BIRTHDAY = new Date("2022-02-06");

export function getKhoiAge() {
  const now = new Date();
  const years = differenceInYears(now, KHOI_BIRTHDAY);
  const months = differenceInMonths(now, KHOI_BIRTHDAY) % 12;
  if (months === 0) return `${years} tuổi`;
  return `${years} tuổi ${months} tháng`;
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy", { locale: vi });
}

export function formatDateLong(date: Date | string) {
  return format(new Date(date), "d MMMM yyyy", { locale: vi });
}

export function formatDateRange(date: Date | string, endDate?: string | null) {
  const start = formatDate(date);
  if (!endDate) return start;
  return `${start} – ${formatDate(endDate)}`;
}

export function formatDateRangeLong(date: Date | string, endDate?: string | null) {
  const start = formatDateLong(date);
  if (!endDate) return start;
  return `${start} – ${formatDateLong(endDate)}`;
}

export const ENTRY_TYPE_LABELS: Record<string, string> = {
  MEMORY: "Kỷ niệm",
  TRAVEL: "Du lịch",
  EDUCATION: "Học tập",
  BOOK: "Sách",
  SKILL: "Kỹ năng",
  SCHOOL: "Trường học",
  FRIEND: "Bạn bè",
  HEALTH: "Sức khỏe",
};

export const ENTRY_TYPE_COLORS: Record<string, string> = {
  MEMORY: "bg-coral-50 text-coral-800 border-coral-100",
  TRAVEL: "bg-teal-50 text-teal-800 border-teal-100",
  EDUCATION: "bg-purple-50 text-purple-800 border-purple-100",
  BOOK: "bg-amber-50 text-amber-800 border-amber-100",
  SKILL: "bg-purple-50 text-purple-800 border-purple-100",
  SCHOOL: "bg-purple-50 text-purple-800 border-purple-100",
  FRIEND: "bg-pink-50 text-pink-800 border-pink-100",
  HEALTH: "bg-green-50 text-green-800 border-green-100",
};
