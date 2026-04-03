const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

// Factory function to create storage
const createStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      let folderPath = `boardingbuddy/${folderName}`;

      return {
        folder: folderPath,
        resource_type: "image",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
        public_id: `${Date.now()}-${file.originalname}`,
      };
    },
  });
};

const imageFileFilter = (req, file, cb) => {
  const mimeType = String(file?.mimetype || "").toLowerCase();
  if (ALLOWED_MIME_TYPES.has(mimeType)) {
    cb(null, true);
    return;
  }

  const error = new Error("Supported formats: JPG, JPEG, PNG, WEBP");
  error.statusCode = 400;
  cb(error);
};

// Different upload handlers
const uploadProfile = multer({
  storage: createStorage("profile_images"),
  fileFilter: imageFileFilter,
  limits: { files: 1 },
});
const uploadBoarding = multer({
  storage: createStorage("boarding_images"),
  fileFilter: imageFileFilter,
  limits: { files: 6 },
});
const uploadFeedback = multer({
  storage: createStorage("feedback_images"),
  fileFilter: imageFileFilter,
  limits: { files: 1 },
});

module.exports = {
  uploadProfile,
  uploadBoarding,
  uploadFeedback,
};