const Boarding = require("../models/Boarding");
const User = require("../models/User");
const { addNotification } = require("../utils/notification");

const normalizeUniversities = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

// Owner: Add a new boarding
const addBoarding = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      nearestUniversities,
      location,
      monthlyRent,
      boardingType,
      lifestyleTags,
      totalCapacity,
    } = req.body;

    const boarding = await Boarding.create({
      owner: req.user._id,
      title,
      description,
      address,
      city,
      nearestUniversities: normalizeUniversities(nearestUniversities),
      location,
      monthlyRent,
      boardingType,
      lifestyleTags,
      totalCapacity,
      availableCapacity: totalCapacity,
      status: "pending",
    });

    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      admins.forEach((admin) => {
        addNotification({
          userId: admin._id,
          message: `New boarding added by owner: ${boarding.title}`,
          type: "new_boarding",
          data: { boardingId: boarding._id.toString(), ownerId: req.user._id.toString() }
        });
      });
    } catch (notifyErr) {
      console.error("Notification error:", notifyErr);
    }

    res.status(201).json(boarding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: Update boarding details
const updateBoarding = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id);
    if (!boarding)
      return res.status(404).json({ message: "Boarding not found" });
    if (boarding.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const updates = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updates, "nearestUniversities")) {
      updates.nearestUniversities = normalizeUniversities(updates.nearestUniversities);
    }

    Object.assign(boarding, updates);

    // Ensure availableCapacity does not exceed totalCapacity
    if (boarding.availableCapacity > boarding.totalCapacity) {
      boarding.availableCapacity = boarding.totalCapacity;
    }

    await boarding.save();
    res.json(boarding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner/Admin: Get all boardings for dashboard
const getBoardings = async (req, res) => {
  try {
    let boardings;
    // If authenticated, apply role-based visibility; otherwise treat as guest/student
    const role = req.user?.role;
    if (role === "owner") {
      boardings = await Boarding.find({ owner: req.user._id });
    } else if (role === "inspector") {
      // Inspectors see only boardings assigned to them
      boardings = await Boarding.find({ assignedInspector: req.user._id });
    } else if (role === "admin") {
      boardings = await Boarding.find();
    } else {
      // Students and guests see only approved boardings
      boardings = await Boarding.find({ status: "approved" });
    }

    res.json(boardings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner/Admin: Get single boarding
const getBoardingById = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id).populate('owner', 'name contactNumber');
    if (!boarding)
      return res.status(404).json({ message: "Boarding not found" });

    // If user is not authenticated or is a student, only allow viewing public boardings
    const role = req.user?.role;
    if (( !role || role === "student" ) && boarding.status !== "public") {
      if (boarding.status !== "approved") {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    res.json(boarding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner/Admin: Delete a boarding
const deleteBoarding = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id);
    if (!boarding) return res.status(404).json({ message: 'Boarding not found' });

    // Owners can delete their own boardings; admins can delete any
    if (req.user.role === 'owner' && boarding.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Use deleteOne to avoid relying on document instance methods
    await Boarding.deleteOne({ _id: req.params.id });
    res.json({ message: 'Boarding deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addBoarding, updateBoarding, getBoardings, getBoardingById, deleteBoarding };
