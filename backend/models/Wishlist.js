const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    boarding: { type: mongoose.Schema.Types.ObjectId, ref: 'Boarding', required: true }
  },
  { timestamps: true }
);

wishlistSchema.index({ student: 1, boarding: 1 }, { unique: true });
wishlistSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
