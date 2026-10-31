export const APP_NAME = "Pikop Driver";
export const TAGLINE = "Take bike delivery jobs and keep every rupee of the fare";

// Where drivers can send their documents instead of uploading them in the app.
export const DOCS_WHATSAPP = process.env.NEXT_PUBLIC_DOCS_WHATSAPP || "+916363462003";
export const docsWhatsAppUrl = (name?: string, phone?: string) =>
  `https://wa.me/${DOCS_WHATSAPP.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi, I'm ${name || "a new driver"}${phone ? ` (${phone})` : ""}. Sending my Pikop Driver documents: driving licence, vehicle RC, Aadhaar (front) and my photo.`,
  )}`;
