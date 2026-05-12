"use client";

import type { Category, Wardrobe, UploadProgress } from "../hooks/useWardrobe";
import WardrobeItem from "./WardrobeItem";

const CATEGORIES: Category[] = ["tops", "bottoms", "shoes"];

interface WardrobeProps {
  wardrobe: Wardrobe;
  removing: string | null;
  uploadProgress: UploadProgress | null;
  uploadingCategory: Category | null;
  onUpload: (files: File[], category: Category) => void;
  onRemove: (category: Category, url: string) => void;
}

export default function WardrobePanel({
  wardrobe,
  removing,
  uploadProgress,
  uploadingCategory,
  onUpload,
  onRemove,
}: WardrobeProps) {
  const totalItems =
    wardrobe.tops.length + wardrobe.bottoms.length + wardrobe.shoes.length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, category: Category) {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    onUpload(files, category);
    e.target.value = "";
  }

  return (
    <div id="Wardrobe">
      <div id="UploadClothes">
        {CATEGORIES.map((category) => (
          <div className="uploadButtons" key={category}>
            <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <label htmlFor={`${category}-upload`} className="custom-file-upload">
              Upload
            </label>
            <input
              id={`${category}-upload`}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileChange(e, category)}
            />
          </div>
        ))}
      </div>

      <div className="clothesPreview">
        <h3>
          Wardrobe ({totalItems} item{totalItems !== 1 ? "s" : ""})
        </h3>

        {CATEGORIES.map((category) => {
          const isUploading = uploadingCategory === category;
          if (!isUploading && wardrobe[category].length === 0) return null;

          return (
            <div key={category} className="category-section">
              <p className="category-label">
                {category.charAt(0).toUpperCase() + category.slice(1)} (
                {wardrobe[category].length})
              </p>
              <div className="category-images">
                {wardrobe[category].map((url) => (
                  <WardrobeItem
                    key={url}
                    url={url}
                    category={category}
                    isRemoving={removing === url}
                    onRemove={onRemove}
                  />
                ))}

                {isUploading && uploadProgress && (
                  <div className="wardrobe-item-uploading">
                    <span className="uploading-label">{uploadProgress.label}</span>
                    <div className="slot-mini-track">
                      <div
                        className="slot-mini-bar"
                        style={{ width: `${uploadProgress.pct}%` }}
                      />
                    </div>
                    <span className="slot-pct">{uploadProgress.pct}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {totalItems === 0 && !uploadingCategory && (
          <p className="empty-wardrobe">Upload some clothes to get started!</p>
        )}
      </div>
    </div>
  );
}