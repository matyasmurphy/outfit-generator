"use client";

import { useState, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";
import { supabase } from "../utils/supabaseClient";
import type { User } from "@supabase/supabase-js";

export type Category = "tops" | "bottoms" | "shoes";
export type Wardrobe = Record<Category, string[]>;
export type UploadProgress = { pct: number; label: string };

function getStoragePath(publicUrl: string): string {
  const marker = "/object/public/wardrobe/";
  const idx = publicUrl.indexOf(marker);
  return idx !== -1 ? decodeURIComponent(publicUrl.slice(idx + marker.length)) : publicUrl;
}

export function useWardrobe(user: User | null) {
  const [wardrobe, setWardrobe] = useState<Wardrobe>({ tops: [], bottoms: [], shoes: [] });
  const [removing, setRemoving] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadingCategory, setUploadingCategory] = useState<Category | null>(null);

  // Load wardrobe from DB when user changes
  useEffect(() => {
    if (!user) {
      setWardrobe({ tops: [], bottoms: [], shoes: [] });
      return;
    }

    async function loadWardrobe() {
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user!.id);

      if (error) {
        console.error("Failed to load wardrobe:", error);
        return;
      }

      const grouped: Wardrobe = { tops: [], bottoms: [], shoes: [] };
      data.forEach((item) => {
        if (item.category in grouped) {
          grouped[item.category as Category].push(item.image_url);
        }
      });
      setWardrobe(grouped);
    }

    loadWardrobe();
  }, [user]);

  async function handleUpload(files: File[], category: Category) {
    if (!user) return;

    setUploadingCategory(category);

    const totalFiles = files.length;
    let targetPct = 0;
    let currentAnimPct = 0;
    let animLabel = "Starting...";

    const animFrame = setInterval(() => {
      if (currentAnimPct < targetPct) {
        currentAnimPct = Math.min(currentAnimPct + 1, targetPct);
        setUploadProgress({ pct: currentAnimPct, label: animLabel });
      }
    }, 30);

    const setTarget = (pct: number, label: string) => {
      targetPct = pct;
      animLabel = label;
    };

    const waitForAnim = () =>
      new Promise<void>((res) => {
        const check = setInterval(() => {
          if (currentAnimPct >= targetPct) {
            clearInterval(check);
            res();
          }
        }, 30);
      });

    setUploadProgress({ pct: 0, label: "Starting..." });

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const fileSlice = 100 / totalFiles;
      const fileStart = i * fileSlice;

      try {
        const imageBlob = await removeBackground(file, {
          progress: (_key: string, current: number, total: number) => {
            setTarget(
              Math.round(fileStart + (current / total) * (fileSlice / 2)),
              `Removing background (${i + 1}/${totalFiles})`
            );
          },
        });

        const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".png";
        const transparentFile = new File([imageBlob], cleanFileName, { type: "image/png" });
        const fileName = `${user.id}/${category}/${Date.now()}-${cleanFileName}`;

        setTarget(Math.round(fileStart + fileSlice / 2), `Uploading (${i + 1}/${totalFiles})`);
        await waitForAnim();

        const { error: uploadError } = await supabase.storage
          .from("wardrobe")
          .upload(fileName, transparentFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("wardrobe").getPublicUrl(fileName);

        await supabase
          .from("wardrobe_items")
          .insert({ user_id: user.id, category, image_url: publicUrl });

        setWardrobe((prev) => ({
          ...prev,
          [category]: [...prev[category], publicUrl],
        }));

        setTarget(Math.round((i + 1) * fileSlice), `Done (${i + 1}/${totalFiles})`);
        await waitForAnim();
      } catch (err) {
        console.error("Error processing image:", err);
      }
    }

    clearInterval(animFrame);
    setUploadProgress({ pct: 100, label: "Complete!" });
    await new Promise((res) => setTimeout(res, 600));
    setUploadProgress(null);
    setUploadingCategory(null);
  }

  async function handleRemove(category: Category, imageUrl: string) {
    if (!user) return;
    setRemoving(imageUrl);

    const storagePath = getStoragePath(imageUrl);

    const { error: storageError } = await supabase.storage
      .from("wardrobe")
      .remove([storagePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      setRemoving(null);
      return;
    }

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

    setWardrobe((prev) => ({
      ...prev,
      [category]: prev[category].filter((url) => url !== imageUrl),
    }));

    setRemoving(null);
  }

  return {
    wardrobe,
    removing,
    uploadProgress,
    uploadingCategory,
    handleUpload,
    handleRemove,
  };
}