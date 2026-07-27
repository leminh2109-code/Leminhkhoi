"use client";

import { useEffect, useRef, useState } from "react";

interface ImageLightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
}

export function ImageLightbox({ images, index, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(index);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, images.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) setCurrent((c) => Math.min(c + 1, images.length - 1));
    else setCurrent((c) => Math.max(c - 1, 0));
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none"
        onClick={onClose}
      >
        ×
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {current + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {images.length > 1 && current > 0 && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl leading-none px-2"
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c - 1); }}
        >
          ‹
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]}
        alt=""
        className="max-w-full max-h-full object-contain select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "92vh", maxWidth: "92vw" }}
      />

      {/* Next */}
      {images.length > 1 && current < images.length - 1 && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl leading-none px-2"
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c + 1); }}
        >
          ›
        </button>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-1.5 h-1.5 rounded-full transition ${i === current ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
