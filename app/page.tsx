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

  function handleUpload(e: any, category: string) {
    const files = Array.from(e.target.files);
    const newImageUrls = files.map((file: any) => URL.createObjectURL(file));

    setWardrobe((prevWardrobe) => {
      return {
        ...prevWardrobe,
        [category]: [...prevWardrobe[category], ...newImageUrls],
      };
    });
  }

  return (
    <div>
      <h1>OUTFIT GENERATOR</h1>

      <h3>Tops</h3>
      <input type="file" multiple accept="image/*" onChange={(e) => handleUpload(e, 'tops')}></input>

      <h3>Bottoms</h3>
      <input type="file" multiple accept="image/*" onChange={(e) => handleUpload(e, 'bottoms')}></input>

      <h3>Shoes</h3>
      <input type="file" multiple accept="image/*" onChange={(e) => handleUpload(e, 'shoes')}></input>

    <div className="clothesPreview">
      <h3>Wardrobe:</h3>
      <div>
        <div>
          {wardrobe.tops.map(url => <img key={url} src={url} width="180" />)}
        </div>
      </div>

      <div>
        <div>
          {wardrobe.bottoms.map(url => <img key={url} src={url} width="180" />)}
        </div>
      </div>

      <div>
        <div>
          {wardrobe.shoes.map(url => <img key={url} src={url} width="180" />)}
        </div>
      </div>
    </div>
    </div>
  );
}
