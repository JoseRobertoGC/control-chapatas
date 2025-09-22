import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;

    // Si body viene como string (caso Postman/Vercel)
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "El body no es JSON válido" });
      }
    }

    const { publicId } = body;

    if (!publicId) {
      return res.status(400).json({ error: "Falta el publicId" });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("🗑️ Imagen borrada:", result);

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Error en deleteImage:", err);
    return res.status(500).json({ error: err.message });
  }
}
