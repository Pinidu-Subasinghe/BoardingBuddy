const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { addNotification } = require("../utils/notification");
const { sendTransactionalEmail } = require("../utils/email");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;

const buildProfileUpdatedEmail = (userName) => ({
  subject: "Your BoardingBuddy Profile Was Updated",
  text:
    `Dear ${userName},\n\n` +
    "This is a confirmation that your profile information was successfully updated.\n\n" +
    "If you did not make these changes, please secure your account immediately.\n\n" +
    "Thank you for keeping your information up to date.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy \ud83c\udfe0 Team"
});

const buildAccountDeletedEmail = (userName) => ({
  subject: "Your BoardingBuddy Account Has Been Deleted",
  text:
    `Dear ${userName},\n\n` +
    "Your BoardingBuddy account has been successfully deleted.\n" +
    "We're sorry to see you go.\n\n" +
    "If this was not you, please contact support immediately.\n\n" +
    "We appreciate the time you spent with us and hope to serve you again in the future.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy \ud83c\udfe0 Team"
});

// Get profile
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      university: user.university,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// Update profile
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Validate only fields that are being updated.
    if (req.body.email !== undefined) {
      const normalizedEmail = String(req.body.email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      user.email = normalizedEmail;
    }

    if (req.body.contactNumber !== undefined) {
      const normalizedContactNumber = String(req.body.contactNumber).replace(/\D/g, "");
      if (!MOBILE_REGEX.test(normalizedContactNumber)) {
        return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
      }
      user.contactNumber = normalizedContactNumber;
    }

    user.name = req.body.name || user.name;

    if (user.role === "student") {
      user.university = req.body.university || user.university;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    const profileUpdatedEmail = buildProfileUpdatedEmail(updatedUser.name);
    sendTransactionalEmail({
      to: updatedUser.email,
      subject: profileUpdatedEmail.subject,
      text: profileUpdatedEmail.text
    }).catch((error) => {
      console.error("Email error:", error);
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      contactNumber: updatedUser.contactNumber,
      university: updatedUser.university,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// Delete own account
const deleteMyAccount = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const emailTarget = { name: user.name, email: user.email };
    await user.deleteOne();

    const accountDeletedEmail = buildAccountDeletedEmail(emailTarget.name);
    sendTransactionalEmail({
      to: emailTarget.email,
      subject: accountDeletedEmail.subject,
      text: accountDeletedEmail.text
    }).catch((error) => {
      console.error("Email error:", error);
    });

    res.json({ message: "Your account has been deleted" });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// Admin: get all users
const getAllUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

// Admin: delete user
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: "User removed" });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// Admin: create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, contactNumber, university, gender } = req.body;
    if (!name || !email || !password || !contactNumber || !gender) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User with this email already exists' });

    const user = await User.create({ name, email, password, role: role || 'student', contactNumber, university, gender });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      university: user.university
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: update user (role or other fields)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const previousRole = user.role;

    const { name, role, contactNumber, university } = req.body;
    if (name) user.name = name;
    if (role) user.role = role;
    if (contactNumber) user.contactNumber = contactNumber;
    if (university) user.university = university;

    const updated = await user.save();

    if (req.body.role && previousRole !== updated.role && ['student', 'owner', 'inspector'].includes(updated.role)) {
      try {
        addNotification({
          userId: updated._id,
          message: `Your role has been updated to ${updated.role}.`,
          type: 'role_changed',
          data: { previousRole, newRole: updated.role }
        });
      } catch (notifyErr) {
        console.error('Notification error:', notifyErr);
      }
    }

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      contactNumber: updated.contactNumber,
      university: updated.university
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteMyAccount,
  getAllUsers,
  deleteUser,
  createUser,
  updateUser
};