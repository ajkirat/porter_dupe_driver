import { supabase } from "./supabase";

// Shrinks a phone photo (often 4+ MB) to a small JPEG so it uploads quickly on mobile data.
async function shrink(file: File, maxSide = 900): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.75));
    return blob ?? file;
  } catch {
    return file;
  }
}

// Uploads a selfie into the driver's own folder of the private "kyc" bucket and returns its path.
export async function uploadSelfie(userId: string, file: File, label: "signup" | "online"): Promise<string> {
  const blob = await shrink(file);
  const path = `${userId}/selfie-${label}-${Date.now()}.jpg`;
  const { error } = await supabase().storage.from("kyc").upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return path;
}
