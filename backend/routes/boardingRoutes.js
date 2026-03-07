const express = require("express");
const router = express.Router();
const { protect, authorize, attachUserIfPresent } = require("../middleware/authMiddleware");
const {
  addBoarding,
  updateBoarding,
  getBoardings,
  getBoardingById,
} = require("../controllers/boardingController");

// Owner routes
router.post("/", protect, authorize("owner"), addBoarding);
router.put("/:id", protect, authorize("owner"), updateBoarding);
// Public: list public boardings (or role-based when authenticated)
router.get("/", attachUserIfPresent, getBoardings);
// Public: view a single boarding (students/guests can view only public boardings)
router.get("/:id", getBoardingById);

module.exports = router;
