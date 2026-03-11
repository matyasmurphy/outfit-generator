"use client";

import { supabase } from "./utils/supabaseClient";
import { useState, useEffect } from "react";
import Auth from "./Auth";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Reset wardrobe when user changes
      if (!session?.user) {
        setWardrobe({ tops: [], bottoms: [], shoes: [] });
        setSelectedOutfit({ top: "", bottom: "", shoes: "" });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load wardrobe for the logged-in user
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

  // Show nothing while checking session
  if (authLoading) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />;
  }

  const hasEnoughClothes =
    wardrobe.tops.length > 0 && wardrobe.bottoms.length > 0 && wardrobe.shoes.length > 0;

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
            <h3>Wardrobe ({wardrobe.tops.length + wardrobe.bottoms.length + wardrobe.shoes.length} items)</h3>
            {["tops", "bottoms", "shoes"].map((category) => (
              wardrobe[category].length > 0 && (
                <div key={category} className="category-section">
                  <p className="category-label">{category}</p>
                  <div className="category-images">
                    {wardrobe[category].map((url) => (
                      <img key={url} src={url} width="80" height="80" style={{ objectFit: "cover", borderRadius: "8px" }} />
                    ))}
                  </div>
                </div>
              )
            ))}
            {wardrobe.tops.length === 0 && wardrobe.bottoms.length === 0 && wardrobe.shoes.length === 0 && (
              <p className="empty-wardrobe">Upload some clothes to get started!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}