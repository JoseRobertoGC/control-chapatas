const functions = require("firebase-functions");
const {v2: cloudinary} = require("cloudinary");

cloudinary.config({
  cloud_name: "dwx9yzazs",
  api_key: functions.config().cloudinary.apikey,
  api_secret: functions.config().cloudinary.apisecret,
});

exports.deleteImage = functions.https.onRequest(async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({error: "El body no es JSON válido"});
      }
    }

    const {publicId} = body;

    if (!publicId) {
      return res.status(400).json({error: "Falta el publicId"});
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("🗑️ Imagen borrada:", result);

    return res.json({success: true, result});
  } catch (err) {
    console.error("❌ Error en deleteImage:", err);
    return res.status(500).json({error: err.message});
  }
});
