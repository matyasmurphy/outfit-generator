"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "./utils/supabaseClient";
import { useWardrobe } from "./hooks/useWardrobe";
import Auth from "./Auth";
import OutfitDisplay from "./components/OutfitDisplay";
import WardrobePanel from "./components/WardrobePanel";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [selectedOutfit, setSelectedOutfit] = useState({
    top: "",
    bottom: "",
    shoes: "",
  });

  const {
    wardrobe,
    removing,
    uploadProgress,
    uploadingCategory,
    handleUpload,
    handleRemove,
  } = useWardrobe(user);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setSelectedOutfit({ top: "", bottom: "", shoes: "" });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clear outfit slot when an item is removed
  useEffect(() => {
    setSelectedOutfit((prev) => ({
      top: wardrobe.tops.includes(prev.top) ? prev.top : "",
      bottom: wardrobe.bottoms.includes(prev.bottom) ? prev.bottom : "",
      shoes: wardrobe.shoes.includes(prev.shoes) ? prev.shoes : "",
    }));
  }, [wardrobe]);

  function generateOutfit() {
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] ?? "";
    setSelectedOutfit({
      top: pick(wardrobe.tops),
      bottom: pick(wardrobe.bottoms),
      shoes: pick(wardrobe.shoes),
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (authLoading) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  const hasEnoughClothes =
    wardrobe.tops.length > 0 &&
    wardrobe.bottoms.length > 0 &&
    wardrobe.shoes.length > 0;

  return (
    <div>
      <div id="topbar">
        <h1>OUTFIT GENERATOR</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      <div id="layout">
        <OutfitDisplay
          selectedOutfit={selectedOutfit}
          hasEnoughClothes={hasEnoughClothes}
          onGenerate={generateOutfit}
        />

        <WardrobePanel
          wardrobe={wardrobe}
          removing={removing}
          uploadProgress={uploadProgress}
          uploadingCategory={uploadingCategory}
          onUpload={handleUpload}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
}