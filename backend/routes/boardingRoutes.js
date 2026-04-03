const express = require("express");
const router = express.Router();
const { protect, authorize, attachUserIfPresent } = require("../middleware/authMiddleware");
const { uploadBoarding } = require("../config/multer");
const {
  addBoarding,
  updateBoarding,
  getBoardings,
  getBoardingById,
  deleteBoarding,
} = require("../controllers/boardingController");

const uploadBoardingImages = (req, res, next) => {
  uploadBoarding.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ])(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ message: "You can upload at most 6 images (1 cover + 5 others)" });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      if (err.field === "coverImage") {
        return res
          .status(400)
          .json({ message: "Only one cover image can be uploaded" });
      }
      if (err.field === "images") {
        return res
          .status(400)
          .json({ message: "You can upload at most 5 additional images" });
      }
      return res.status(400).json({
        message:
          "Unexpected image field. Use coverImage for cover and images for additional photos",
      });
    }

    return res
      .status(err.statusCode || 400)
      .json({ message: err.message || "Invalid image upload" });
  });
};

// Owner routes
router.post("/", protect, authorize("owner"), uploadBoardingImages, addBoarding);
router.put("/:id", protect, authorize("owner"), uploadBoardingImages, updateBoarding);
// Allow owners to delete their boarding and admins to delete any
router.delete("/:id", protect, authorize("owner", "admin"), deleteBoarding);
// Public: list public boardings (or role-based when authenticated)
router.get("/", attachUserIfPresent, getBoardings);
// Public: view a single boarding (students/guests can view only public boardings)
router.get("/:id", getBoardingById);

module.exports = router;
