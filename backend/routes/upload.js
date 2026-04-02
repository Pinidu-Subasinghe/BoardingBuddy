const express = require("express");
const router = express.Router();

const {
  uploadProfile,
  uploadBoarding,
  uploadFeedback,
} = require("../config/multer");

// Profile image
router.post("/profile", uploadProfile.single("image"), (req, res) => {
  res.json({
    url: req.file.path,
    public_id: req.file.filename,
  });
});

// Boarding images (multiple)
router.post("/boarding", uploadBoarding.array("images", 5), (req, res) => {
  const files = req.files.map(file => ({
    url: file.path,
    public_id: file.filename,
  }));

  res.json(files);
});

// Feedback image
router.post("/feedback", uploadFeedback.single("image"), (req, res) => {
  res.json({
    url: req.file.path,
    public_id: req.file.filename,
  });
});

module.exports = router;