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
        {selectedOutfit.top
          ? <img src={selectedOutfit.top} alt="Top" className="outfit-img outfit-top" />
          : <div className="placeholder placeholder-top">👕</div>}

        {selectedOutfit.bottom
          ? <img src={selectedOutfit.bottom} alt="Bottom" className="outfit-img outfit-bottom" />
          : <div className="placeholder placeholder-bottom">👖</div>}

        {selectedOutfit.shoes
          ? <img src={selectedOutfit.shoes} alt="Shoes" className="outfit-img outfit-shoes" />
          : <div className="placeholder placeholder-shoes">👟</div>}
      </div>

      <button onClick={onGenerate} disabled={!hasEnoughClothes}>
        {hasEnoughClothes
          ? "Generate Outfit"
          : "Add clothes in all 3 categories first"}
      </button>
    </div>
  );
}