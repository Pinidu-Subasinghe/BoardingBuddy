const mongoose = require("mongoose");

const boardingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Boarding owner
    title: { type: String, required: true },
    description: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    nearestUniversities: [{ type: String }],
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    monthlyRent: { type: Number, required: true },
    boardingType: {
      type: String,
      enum: ["boys", "girls", "any"],
      required: true,
    },
    lifestyleTags: [{ type: String }],
    totalCapacity: { type: Number, required: true },
    availableCapacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "inspector assigned", "approved", "rejected"],
      default: "pending",
    },
    assignedInspector: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Boarding", boardingSchema);
