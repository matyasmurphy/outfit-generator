"use client";

interface Outfit {
  top: string;
  bottom: string;
  shoes: string;
}

interface OutfitDisplayProps {
  selectedOutfit: Outfit;
  hasEnoughClothes: boolean;
  onGenerate: () => void;
}

export default function OutfitDisplay({
  selectedOutfit,
  hasEnoughClothes,
  onGenerate,
}: OutfitDisplayProps) {
  return (
    <div id="OutfitDisplay">
      <div id="clothesDisplay">
        {selectedOutfit.top ? (
          <img src={selectedOutfit.top} alt="top" />
        ) : (
          <div className="placeholder">👕</div>
        )}
        {selectedOutfit.bottom ? (
          <img src={selectedOutfit.bottom} alt="bottom" />
        ) : (
          <div className="placeholder">👖</div>
        )}
        {selectedOutfit.shoes ? (
          <img src={selectedOutfit.shoes} alt="shoes" />
        ) : (
          <div className="placeholder">👟</div>
        )}
      </div>

      <button onClick={onGenerate} disabled={!hasEnoughClothes}>
        {hasEnoughClothes
          ? "Generate Outfit"
          : "Add clothes in all 3 categories first"}
      </button>
    </div>
  );
}