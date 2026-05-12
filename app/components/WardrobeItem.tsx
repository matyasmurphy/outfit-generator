"use client";

import type { Category } from "../hooks/useWardrobe";

interface WardrobeItemProps {
  url: string;
  category: Category;
  isRemoving: boolean;
  onRemove: (category: Category, url: string) => void;
}

export default function WardrobeItem({ url, category, isRemoving, onRemove }: WardrobeItemProps) {
  return (
    <div className="wardrobe-item">
      <img
        src={url}
        alt={category}
        width="80"
        height="80"
        style={{ objectFit: "cover", borderRadius: "8px", display: "block" }}
      />
      <button
        className="remove-btn"
        onClick={() => onRemove(category, url)}
        disabled={isRemoving}
        title="Remove item"
      >
        {isRemoving ? "…" : "×"}
      </button>
    </div>
  );
}