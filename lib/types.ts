export type EntryType = "MEMORY" | "TRAVEL" | "EDUCATION" | "BOOK" | "SKILL" | "SCHOOL" | "FRIEND" | "HEALTH";

export interface Entry {
  id: string;
  type: EntryType;
  title: string;
  description?: string | null;
  date: Date | string;
  emoji?: string | null;
  images: string[];
  metadata: Record<string, unknown>;
  authorId: string;
  author: { name: string };
  createdAt: Date | string;
}

export interface TravelMeta {
  location?: string;
  isFirstTime?: boolean;
  province?: string;
}

export interface SkillMeta {
  status?: "DONE" | "IN_PROGRESS";
}

export interface SchoolMeta {
  schoolName?: string;
  class?: string;
  endYear?: string;
}

export interface BookMeta {
  bookAuthor?: string;
  category?: string;
}
