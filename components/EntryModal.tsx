"use client";

import { useState, useRef } from "react";
import { EntryType } from "@/lib/types";
import toast from "react-hot-toast";

type EntryTypeOption = {
  value: EntryType;
  label: string;
  emoji: string;
};

const typeOptions: EntryTypeOption[] = [
  { value: "MEMORY", label: "Kỷ niệm", emoji: "💛" },
  { value: "TRAVEL", label: "Du lịch", emoji: "✈️" },
  { value: "SKILL", label: "Kỹ năng", emoji: "🎯" },
  { value: "BOOK", label: "Sách", emoji: "📖" },
  { value: "SCHOOL", label: "Trường học", emoji: "🏫" },
];

interface EntryModalProps {
  defaultType?: EntryType;
  onClose: () => void;
  onSaved: () => void;
}

export function EntryModal({ defaultType = "MEMORY", onClose, onSaved }: EntryModalProps) {
  const [type, setType] = useState<EntryType>(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [emoji, setEmoji] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setImages((prev) => [...prev, data.url]);
      }
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Nhập tiêu đề đi bạn"); return; }
    setSaving(true);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description, date, emoji, images, metadata }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Đã lưu!");
      onSaved();
      onClose();
    } else {
      toast.error("Lỗi khi lưu, thử lại nhé");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-gray-800">Thêm mới</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-purple-600 disabled:opacity-50"
        >
          {saving ? "Lưu..." : "Lưu"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Loại</label>
          <div className="flex gap-2 flex-wrap">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  type === opt.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                }`}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Tiêu đề *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Lần đầu đi biển"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
          />
        </div>

        {/* Date + Emoji */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ngày</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Emoji</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🎂"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition text-center text-xl"
              maxLength={4}
            />
          </div>
        </div>

        {/* Extra fields by type */}
        {type === "TRAVEL" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Địa điểm</label>
              <input
                value={metadata.location || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, location: e.target.value }))}
                placeholder="Đà Nẵng, Việt Nam"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={metadata.isFirstTime === "true"}
                onChange={(e) => setMetadata((m) => ({ ...m, isFirstTime: e.target.checked ? "true" : "false" }))}
                className="w-4 h-4 accent-purple-600"
              />
              <span className="text-sm text-gray-700">Lần đầu đến đây</span>
            </label>
          </div>
        )}

        {type === "SKILL" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Trạng thái</label>
            <select
              value={metadata.status || "IN_PROGRESS"}
              onChange={(e) => setMetadata((m) => ({ ...m, status: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition bg-white"
            >
              <option value="IN_PROGRESS">Đang học</option>
              <option value="DONE">Đã xong</option>
            </select>
          </div>
        )}

        {type === "SCHOOL" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Tên trường</label>
              <input
                value={metadata.schoolName || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, schoolName: e.target.value }))}
                placeholder="Mầm non ABC"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Lớp</label>
              <input
                value={metadata.class || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, class: e.target.value }))}
                placeholder="Lớp lá"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
          </div>
        )}

        {type === "BOOK" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tác giả</label>
            <input
              value={metadata.bookAuthor || ""}
              onChange={(e) => setMetadata((m) => ({ ...m, bookAuthor: e.target.value }))}
              placeholder="Tên tác giả"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Ghi chú</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Câu chuyện, cảm xúc, chi tiết thú vị..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition resize-none"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Ảnh</label>
          <div className="flex gap-2 flex-wrap">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                <button
                  onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-300 hover:text-purple-400 transition"
            >
              {uploading ? (
                <span className="text-xs">...</span>
              ) : (
                <>
                  <span className="text-xl">+</span>
                  <span className="text-[10px]">Thêm ảnh</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
