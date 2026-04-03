const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Boarding = require('../models/Boarding');

const BOARDING_POPULATE_FIELDS =
  'title address city monthlyRent coverImage images boardingType lifestyleTags nearestUniversities availableCapacity status owner createdAt';

const resolveBoardingId = (req) => {
  const bodyId = typeof req.body?.boardingId === 'string' ? req.body.boardingId.trim() : '';
  const paramId = typeof req.params?.boardingId === 'string' ? req.params.boardingId.trim() : '';
  return bodyId || paramId;
};

const addToWishlist = async (req, res) => {
  try {
    const boardingId = resolveBoardingId(req);

    if (!boardingId || !mongoose.Types.ObjectId.isValid(boardingId)) {
      return res.status(400).json({ message: 'Valid boardingId is required' });
    }

    const boardingExists = await Boarding.exists({ _id: boardingId });
    if (!boardingExists) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    const existing = await Wishlist.findOne({
      student: req.user._id,
      boarding: boardingId
    }).populate('boarding', BOARDING_POPULATE_FIELDS);

    if (existing) {
      return res.status(200).json(existing);
    }

    const created = await Wishlist.create({
      student: req.user._id,
      boarding: boardingId
    });

    const wishlistItem = await Wishlist.findById(created._id).populate('boarding', BOARDING_POPULATE_FIELDS);
    return res.status(201).json(wishlistItem);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ student: req.user._id })
      .populate('boarding', BOARDING_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    return res.json(wishlist);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const boardingId = resolveBoardingId(req);

    if (!boardingId || !mongoose.Types.ObjectId.isValid(boardingId)) {
      return res.status(400).json({ message: 'Valid boardingId is required' });
    }

    const removed = await Wishlist.findOneAndDelete({
      student: req.user._id,
      boarding: boardingId
    });

    if (!removed) {
      return res.status(404).json({ message: 'Boarding is not in wishlist' });
    }

    return res.json({ message: 'Boarding removed from wishlist' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist
};
