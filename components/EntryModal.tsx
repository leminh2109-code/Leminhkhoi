"use client";

import { useState, useRef } from "react";
import { EntryType, Entry } from "@/lib/types";
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
  { value: "FRIEND", label: "Bạn bè", emoji: "👫" },
  { value: "HEALTH", label: "Sức khỏe", emoji: "🏥" },
];

interface EntryModalProps {
  defaultType?: EntryType;
  entry?: Entry;
  onClose: () => void;
  onSaved: () => void;
}

export function EntryModal({ defaultType = "MEMORY", entry, onClose, onSaved }: EntryModalProps) {
  const isEditing = !!entry;
  const [type, setType] = useState<EntryType>(entry?.type ?? defaultType);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [date, setDate] = useState(
    entry ? new Date(entry.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState((entry?.metadata?.endDate as string) ?? "");
  const [emoji, setEmoji] = useState(entry?.emoji ?? "");
  const [metadata, setMetadata] = useState<Record<string, string>>(
    entry
      ? Object.fromEntries(
          Object.entries(entry.metadata)
            .filter(([k]) => k !== "endDate")
            .map(([k, v]) => [k, String(v)])
        )
      : {}
  );
  const [images, setImages] = useState<string[]>(entry?.images ?? []);
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

    const finalMetadata = { ...metadata };
    if (endDate) finalMetadata.endDate = endDate;
    else delete finalMetadata.endDate;

    const payload = { type, title, description, date, emoji, images, metadata: finalMetadata };

    const res = isEditing
      ? await fetch(`/api/entries/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (res.ok) {
      toast.success(isEditing ? "Đã cập nhật!" : "Đã lưu!");
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
        <h2 className="text-base font-semibold text-gray-800">{isEditing ? "Sửa" : "Thêm mới"}</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-purple-600 disabled:opacity-50"
        >
          {saving ? "Lưu..." : "Lưu"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Type selector — only show when adding */}
        {!isEditing && (
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
        )}

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

        {/* Date range + Emoji */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Ngày bắt đầu</label>
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Ngày kết thúc <span className="font-normal text-gray-300">(tùy chọn)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={date}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
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

        {type === "FRIEND" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Địa chỉ</label>
              <input
                value={metadata.address || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, address: e.target.value }))}
                placeholder="Số nhà, đường, quận, thành phố..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Bố</label>
              <input
                value={metadata.fatherName || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, fatherName: e.target.value }))}
                placeholder="Tên bố của bạn"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Mẹ</label>
              <input
                value={metadata.motherName || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, motherName: e.target.value }))}
                placeholder="Tên mẹ của bạn"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Số điện thoại <span className="font-normal text-gray-300">(tùy chọn)</span></label>
              <input
                value={metadata.phone || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, phone: e.target.value }))}
                placeholder="0901 234 567"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
          </div>
        )}

        {type === "HEALTH" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Chiều cao (cm)</label>
                <input
                  type="number"
                  value={metadata.height || ""}
                  onChange={(e) => setMetadata((m) => ({ ...m, height: e.target.value }))}
                  placeholder="105"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Cân nặng (kg)</label>
                <input
                  type="number"
                  value={metadata.weight || ""}
                  onChange={(e) => setMetadata((m) => ({ ...m, weight: e.target.value }))}
                  placeholder="18"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Bác sĩ / Cơ sở y tế</label>
              <input
                value={metadata.doctor || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, doctor: e.target.value }))}
                placeholder="BS. Nguyễn Văn A — BV Nhi Đồng"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Chẩn đoán / Lý do khám</label>
              <input
                value={metadata.diagnosis || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, diagnosis: e.target.value }))}
                placeholder="Khám định kỳ, sốt, tiêm vaccine..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Thuốc <span className="font-normal text-gray-300">(tùy chọn)</span></label>
              <input
                value={metadata.medication || ""}
                onChange={(e) => setMetadata((m) => ({ ...m, medication: e.target.value }))}
                placeholder="Paracetamol 250mg, vitamin D..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>
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
