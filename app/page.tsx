"use client";

import { supabase } from "./utils/supabaseClient";
import { useState, useEffect } from "react";

export default function Home() {
  
  const [wardrobe, setWardrobe] = useState<{[key: string] : string[] }>({
    tops: [],
    bottoms: [],
    shoes: [],
  });

  useEffect(() => {
    async function checkConnection() {
      const { data, error } = await supabase.from('test').select('*');
      if (error) {
        console.log("Connected to Supabase, but table missing (Expected!)");
      } else {
        console.log("Supabase connected successfully!");
      }
    }
    checkConnection();
  }, []);

  async function handleUpload(e: any, category: string) {
    const files = Array.from(e.target.files) as File[];

    for (const file of files) {
      const fileName = `${category}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('wardrobe')
        .upload(fileName, file);

      if (error) { console.error(error); continue; }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(fileName);

      // Save to DB
      await supabase.from('wardrobe_items').insert({
        category,
        image_url: publicUrl
      });

      // Update local state
      setWardrobe(prev => ({
        ...prev,
        [category]: [...prev[category], publicUrl]
      }));
    }
  }

  useEffect(() => {
    async function loadWardrobe() {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*');

      if (error) { console.error(error); return; }

      const grouped: { [key: string]: string[] } = { tops: [], bottoms: [], shoes: [] };
      data.forEach(item => {
        if (grouped[item.category]) {
          grouped[item.category].push(item.image_url);
        }
      });
      setWardrobe(grouped);
    }
    loadWardrobe();
  }, []);

  const [selectedOutfit, setSelectedOutfit] = useState({
    top: "null",
    bottom: "null",
    shoes: "null"
  });

  const generateOutfit = () => {
    const randomTop = wardrobe.tops[Math.floor(Math.random() * wardrobe.tops.length)];
    const randomBottom = wardrobe.bottoms[Math.floor(Math.random() * wardrobe.bottoms.length)];
    const randomShoes = wardrobe.shoes[Math.floor(Math.random() * wardrobe.shoes.length)];

   setSelectedOutfit({
    top: randomTop,
    bottom: randomBottom,
    shoes: randomShoes
   });
  }

  return (
    <div>
      <h1>OUTFIT GENERATOR</h1>
      <div id="layout">
        <div id="OutfitDisplay">
          <div id="clothesDisplay">
            <img src={selectedOutfit.top} alt="top" />
            <img src={selectedOutfit.bottom} alt="bottom" />
            <img src={selectedOutfit.shoes} alt="shoes" />
          </div>
          <button onClick={generateOutfit}>Generate Outfit</button>
        </div>
        
        <div id="Wardrobe">
          <div id="UploadClothes">
            <div className="uploadButtons">
              <h3>Tops</h3>
              <label htmlFor="tops-upload" className="custom-file-upload">
                Upload Tops
              </label>
              <input
                id="tops-upload"
                type="file"
                multiple 
                accept="image/*" 
                onChange={(e) => handleUpload(e, 'tops')}>
              </input>
            </div>
            <div className="uploadButtons">
              <h3>Bottoms</h3>
              <label htmlFor="bottoms-upload" className="custom-file-upload">
                Upload bottoms
              </label>
              <input 
                id="bottoms-upload"
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => handleUpload(e, 'bottoms')}>
              </input>
            </div>

            <div className="uploadButtons">
              <h3>Shoes</h3>
              <label htmlFor="shoes-upload" className="custom-file-upload">
                Upload shoes
              </label>
              <input
                id="shoes-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleUpload(e, 'shoes')}>
              </input>
            </div>
          </div>
          
            <div className="clothesPreview">
              <h3>Wardrobe:</h3>
              <div>
                <div>
                  {wardrobe.tops.map(url => <img key={url} src={url} width="120" />)}
                  {wardrobe.bottoms.map(url => <img key={url} src={url} width="120" />)}
                  {wardrobe.shoes.map(url => <img key={url} src={url} width="120" />)}
                </div>
              </div>
            </div>
          </div>
    </div>
  </div>
  );
}
