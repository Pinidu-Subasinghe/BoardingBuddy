const mongoose = require('mongoose');

const inspectorRatingSchema = new mongoose.Schema({
  boarding: { type: mongoose.Schema.Types.ObjectId, ref: 'Boarding', required: true },
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lifestyleRatings: [{ 
    tag: String, 
    stars: { type: Number, min: 0, max: 5 } 
  }], // Each tag rated by inspector
  safetyBadge: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  overallPercentage: { type: Number }, // calculated from stars / total
  remark: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InspectorRating', inspectorRatingSchema);