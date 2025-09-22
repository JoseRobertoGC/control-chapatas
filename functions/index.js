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
    const { publicId } = req.body; // <-- ya viene parseado si mandas JSON

    if (!publicId) {
      return res.status(400).json({ error: "Falta el publicId" });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image"
      });
    console.log("🗑️ Imagen borrada:", result);

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Error en deleteImage:", err);
    return res.status(500).json({ error: err.message });
  }
}
