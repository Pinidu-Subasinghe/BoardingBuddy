const mongoose = require('mongoose');


const ReviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boarding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boarding',
    required: true
  },
  ratings: [
    {
      tag: { type: String, required: true },
      score: { type: Number, min: 1, max: 5, required: true }
    }
  ],
  overallRating: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  comment: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

ReviewSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Review', ReviewSchema);
