"use client";

import { supabase } from "./utils/supabaseClient";
import { useState, useEffect } from "react";
import Auth from "./Auth";
import type { User } from "@supabase/supabase-js";

function getStoragePath(publicUrl: string): string {
  const marker = "/object/public/wardrobe/";
  const idx = publicUrl.indexOf(marker);
  return idx !== -1 ? decodeURIComponent(publicUrl.slice(idx + marker.length)) : publicUrl;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const [wardrobe, setWardrobe] = useState<{ [key: string]: string[] }>({
    tops: [],
    bottoms: [],
    shoes: [],
  });

  const [selectedOutfit, setSelectedOutfit] = useState({
    top: "",
    bottom: "",
    shoes: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setWardrobe({ tops: [], bottoms: [], shoes: [] });
        setSelectedOutfit({ top: "", bottom: "", shoes: "" });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function loadWardrobe() {
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user!.id);

      if (error) { console.error(error); return; }

      const grouped: { [key: string]: string[] } = { tops: [], bottoms: [], shoes: [] };
      data.forEach((item) => {
        if (grouped[item.category]) {
          grouped[item.category].push(item.image_url);
        }
      });
      setWardrobe(grouped);
    }

    loadWardrobe();
  }, [user]);

  async function handleUpload(e: any, category: string) {
    if (!user) return;
    const files = Array.from(e.target.files) as File[];

    for (const file of files) {
      const fileName = `${user.id}/${category}/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("wardrobe")
        .upload(fileName, file);

      if (error) { console.error(error); continue; }

      const { data: { publicUrl } } = supabase.storage
        .from("wardrobe")
        .getPublicUrl(fileName);

      await supabase.from("wardrobe_items").insert({
        user_id: user.id,
        category,
        image_url: publicUrl,
      });

      setWardrobe((prev) => ({
        ...prev,
        [category]: [...prev[category], publicUrl],
      }));
    }

    // Reset the input so the same file can be re-uploaded if needed
    e.target.value = "";
  }

  async function handleRemove(category: string, imageUrl: string) {
    if (!user) return;
    setRemoving(imageUrl);

    const storagePath = getStoragePath(imageUrl);

    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from("wardrobe")
      .remove([storagePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      setRemoving(null);
      return;
    }

    // 2. Delete from DB
    const { error: dbError } = await supabase
      .from("wardrobe_items")
      .delete()
      .eq("user_id", user.id)
      .eq("image_url", imageUrl);

    if (dbError) {
      console.error("DB delete error:", dbError);
      setRemoving(null);
      return;
    }

    // 3. Update local wardrobe state
    setWardrobe((prev) => ({
      ...prev,
      [category]: prev[category].filter((url) => url !== imageUrl),
    }));

    // 4. Clear from outfit display if it was selected
    setSelectedOutfit((prev) => ({
      top: prev.top === imageUrl ? "" : prev.top,
      bottom: prev.bottom === imageUrl ? "" : prev.bottom,
      shoes: prev.shoes === imageUrl ? "" : prev.shoes,
    }));

    setRemoving(null);
  }

  const generateOutfit = () => {
    const randomTop = wardrobe.tops[Math.floor(Math.random() * wardrobe.tops.length)];
    const randomBottom = wardrobe.bottoms[Math.floor(Math.random() * wardrobe.bottoms.length)];
    const randomShoes = wardrobe.shoes[Math.floor(Math.random() * wardrobe.shoes.length)];

    setSelectedOutfit({
      top: randomTop || "",
      bottom: randomBottom || "",
      shoes: randomShoes || "",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const hasEnoughClothes =
    wardrobe.tops.length > 0 && wardrobe.bottoms.length > 0 && wardrobe.shoes.length > 0;

  const totalItems = wardrobe.tops.length + wardrobe.bottoms.length + wardrobe.shoes.length;

  return (
    <div>
      <div id="topbar">
        <h1>OUTFIT GENERATOR</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div id="layout">
        <div id="OutfitDisplay">
          <div id="clothesDisplay">
            {selectedOutfit.top
              ? <img src={selectedOutfit.top} alt="top" />
              : <div className="placeholder">👕</div>}
            {selectedOutfit.bottom
              ? <img src={selectedOutfit.bottom} alt="bottom" />
              : <div className="placeholder">👖</div>}
            {selectedOutfit.shoes
              ? <img src={selectedOutfit.shoes} alt="shoes" />
              : <div className="placeholder">👟</div>}
          </div>
          <button onClick={generateOutfit} disabled={!hasEnoughClothes}>
            {hasEnoughClothes ? "Generate Outfit" : "Add clothes in all 3 categories first"}
          </button>
        </div>

        <div id="Wardrobe">
          <div id="UploadClothes">
            {["tops", "bottoms", "shoes"].map((category) => (
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
                  onChange={(e) => handleUpload(e, category)}
                />
              </div>
            ))}
          </div>

          <div className="clothesPreview">
            <h3>Wardrobe ({totalItems} item{totalItems !== 1 ? "s" : ""})</h3>

            {["tops", "bottoms", "shoes"].map((category) =>
              wardrobe[category].length > 0 && (
                <div key={category} className="category-section">
                  <p className="category-label">
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({wardrobe[category].length})
                  </p>
                  <div className="category-images">
                    {wardrobe[category].map((url) => (
                      <div key={url} className="wardrobe-item">
                        <img
                          src={url}
                          alt={category}
                          width="80"
                          height="80"
                          style={{ objectFit: "cover", borderRadius: "8px", display: "block" }}
                        />
                        <button
                          className="remove-btn"
                          onClick={() => handleRemove(category, url)}
                          disabled={removing === url}
                          title="Remove item"
                        >
                          {removing === url ? "…" : "×"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {totalItems === 0 && (
              <p className="empty-wardrobe">Upload some clothes to get started!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}