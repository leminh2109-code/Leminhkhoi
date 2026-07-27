"use client";

import { useState, useRef, useEffect } from "react";
import { EntryType, Entry } from "@/lib/types";
import { COUNTRY_LIST } from "@/lib/travel-data";
import { ImageLightbox } from "@/components/ImageLightbox";
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
  { value: "INFO", label: "Thông tin cá nhân", emoji: "📋" },
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
  const [friendEntries, setFriendEntries] = useState<Entry[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (type === "TRAVEL") {
      fetch("/api/entries?type=FRIEND")
        .then((r) => r.ok ? r.json() : [])
        .then(setFriendEntries);
    }
  }, [type]);

  const companions: string[] = (() => {
    try { return JSON.parse(metadata.companions || "[]"); } catch { return []; }
  })();

  function toggleCompanion(id: string) {
    const next = companions.includes(id)
      ? companions.filter((c) => c !== id)
      : [...companions, id];
    setMetadata((m) => ({ ...m, companions: JSON.stringify(next) }));
  }

  // Travel: derive whether current stored values are "custom" (not in predefined lists)
  const initCountry = entry?.metadata?.country as string | undefined;
  const [customCountryMode, setCustomCountryMode] = useState(
    !!initCountry && !COUNTRY_LIST.includes(initCountry)
  );
  const [newLocationInput, setNewLocationInput] = useState("");

  const travelLocations: string[] = (() => {
    try {
      const parsed = JSON.parse(metadata.locations || "");
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    const loc = String(metadata.location || "").trim();
    return loc ? [loc] : [];
  })();

  function addTravelLocation() {
    const loc = newLocationInput.trim();
    if (!loc) return;
    const next = [...travelLocations, loc];
    setMetadata((m) => ({ ...m, locations: JSON.stringify(next), location: next[0] || "" }));
    setNewLocationInput("");
  }

  function removeTravelLocation(idx: number) {
    const next = travelLocations.filter((_, i) => i !== idx);
    setMetadata((m) => ({ ...m, locations: JSON.stringify(next), location: next[0] || "" }));
  }

  async function compressImage(file: File): Promise<File> {
    if (file.size < 400 * 1024) return file;
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1920;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })),
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          setImages((prev) => [...prev, data.url]);
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Upload ảnh thất bại, thử lại nhé");
        }
      } catch {
        toast.error("Lỗi khi upload ảnh");
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
      {lightboxIndex !== null && (
        <ImageLightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
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
        {type === "TRAVEL" && (() => {
          const countryVal = metadata.country || "";
          const countrySelectVal = customCountryMode ? "Khác" : countryVal;

          return (
            <div className="space-y-3">
              {/* Country */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Quốc gia</label>
                <select
                  value={countrySelectVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Khác") {
                      setCustomCountryMode(true);
                      setMetadata((m) => ({ ...m, country: "", location: "", locations: "[]" }));
                    } else {
                      setCustomCountryMode(false);
                      setMetadata((m) => ({ ...m, country: val, location: "", locations: "[]" }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition bg-white"
                >
                  <option value="">-- Chọn quốc gia --</option>
                  {COUNTRY_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Khác">Khác</option>
                </select>
                {customCountryMode && (
                  <input
                    value={countryVal}
                    onChange={(e) => setMetadata((m) => ({ ...m, country: e.target.value }))}
                    placeholder="Nhập tên quốc gia"
                    className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
                    autoFocus
                  />
                )}
              </div>

              {/* Locations (multiple) */}
              {(countryVal || customCountryMode) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Địa điểm đã đến</label>
                  {travelLocations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {travelLocations.map((loc, i) => (
                        <span key={i} className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1.5 rounded-full border border-teal-100">
                          📍 {loc}
                          <button
                            type="button"
                            onClick={() => removeTravelLocation(i)}
                            className="ml-0.5 text-teal-400 hover:text-teal-600 leading-none text-base"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={newLocationInput}
                      onChange={(e) => setNewLocationInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTravelLocation(); } }}
                      placeholder="Nhập thành phố, tỉnh..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 transition"
                    />
                    <button
                      type="button"
                      onClick={addTravelLocation}
                      disabled={!newLocationInput.trim()}
                      className="px-3 py-3 bg-teal-50 text-teal-600 rounded-xl text-sm font-medium hover:bg-teal-100 transition flex-shrink-0 disabled:opacity-40"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>
              )}

              {friendEntries.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Đi cùng bạn</label>
                  <div className="flex flex-wrap gap-2">
                    {friendEntries.map((f) => {
                      const checked = companions.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleCompanion(f.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                            checked
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"
                          }`}
                        >
                          {f.images[0] ? (
                            <img src={f.images[0]} alt="" className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <span>{f.emoji || "👫"}</span>
                          )}
                          {f.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
          );
        })()}

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
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Ảnh
            {images.length > 1 && (
              <span className="ml-1.5 font-normal text-gray-400">· bấm ⭐ để chọn ảnh đại diện</span>
            )}
          </label>
          <div className="flex gap-2 flex-wrap">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img
                  src={url}
                  alt=""
                  onClick={() => setLightboxIndex(i)}
                  className={`w-20 h-20 rounded-xl object-cover cursor-zoom-in ${i === 0 ? "ring-2 ring-yellow-400" : ""}`}
                />
                {/* Remove button */}
                <button
                  onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
                {/* Cover badge / set-as-cover button */}
                {images.length > 1 && (
                  i === 0 ? (
                    <span className="absolute bottom-1 left-1 text-sm leading-none">⭐</span>
                  ) : (
                    <button
                      onClick={() => setImages((imgs) => {
                        const next = [...imgs];
                        next.splice(i, 1);
                        return [url, ...next];
                      })}
                      className="absolute bottom-1 left-1 text-sm leading-none opacity-50 hover:opacity-100 transition"
                      title="Đặt làm ảnh đại diện"
                    >
                      ☆
                    </button>
                  )
                )}
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
