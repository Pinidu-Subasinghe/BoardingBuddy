const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { addNotification } = require("../utils/notification");
const { sendTransactionalEmail } = require("../utils/email");
const {
  buildProfileUpdatedEmail,
  buildAccountDeletedEmail,
} = require("../utils/emailTemplates");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{12,16}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;
const NAME_REGEX = /^[A-Za-z\s]+$/;

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

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
      dob: user.dob,
      guardian: user.guardian,
      paymentDetails: user.paymentDetails,
      profileImage: user.profileImage,
      avatar: user.avatar,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// Update profile
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const guardianInput = parseMaybeJson(req.body.guardian);
    const paymentDetailsInput = parseMaybeJson(req.body.paymentDetails);

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

    if (req.file?.path) {
      user.profileImage = req.file.path;
    }

    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar || user.avatar;
    }

    user.name = req.body.name || user.name;

    if (user.role === "student") {
      user.university = req.body.university || user.university;

      if (guardianInput) {
        const guardianName = guardianInput.name;
        const guardianPhone = guardianInput.phone;
        const guardianType = guardianInput.type || user.guardian?.type || "Other";
        const normalizedGuardianPhone =
          typeof guardianPhone === "string" ? guardianPhone.replace(/\D/g, "") : "";

        if (!guardianName || !normalizedGuardianPhone) {
          return res.status(400).json({ message: "Guardian name and phone are required" });
        }

        if (!MOBILE_REGEX.test(normalizedGuardianPhone)) {
          return res.status(400).json({ message: "Guardian phone must be exactly 10 digits" });
        }

        user.guardian = {
          type: guardianType,
          name: guardianName,
          phone: normalizedGuardianPhone,
        };
      }
    }

    if (user.role === "owner" && paymentDetailsInput) {
      const accountNumber = paymentDetailsInput.accountNumber;
      const bankName = paymentDetailsInput.bankName;
      const branchName = paymentDetailsInput.branchName;
      const accountHolderName = paymentDetailsInput.accountHolderName;
      const normalizedAccountNumber =
        typeof accountNumber === "string" ? accountNumber.replace(/\D/g, "") : "";

      if (!normalizedAccountNumber || !bankName || !branchName || !accountHolderName) {
        return res.status(400).json({ message: "Payment details are required" });
      }

      if (!ACCOUNT_NUMBER_REGEX.test(normalizedAccountNumber)) {
        return res.status(400).json({ message: "Account number must be 12 to 16 digits" });
      }

      user.paymentDetails = {
        accountNumber: normalizedAccountNumber,
        bankName,
        branchName,
        accountHolderName,
      };
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    const profileUpdatedEmail = buildProfileUpdatedEmail(updatedUser.name);
    sendTransactionalEmail({
      to: updatedUser.email,
      ...profileUpdatedEmail,
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
      dob: updatedUser.dob,
      guardian: updatedUser.guardian,
      paymentDetails: updatedUser.paymentDetails,
      profileImage: updatedUser.profileImage,
      avatar: updatedUser.avatar,
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
      ...accountDeletedEmail,
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
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      contactNumber,
      university,
      gender,
      dob,
      guardian,
      paymentDetails,
    } = req.body;

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedContactNumber = typeof contactNumber === "string" ? contactNumber.replace(/\D/g, "") : "";
    const normalizedRole = role || "student";

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword || !normalizedContactNumber || !gender || !dob) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!NAME_REGEX.test(normalizedName)) {
      return res.status(400).json({ message: "Name must contain only English letters" });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!MOBILE_REGEX.test(normalizedContactNumber)) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const parsedDob = new Date(dob);
    if (Number.isNaN(parsedDob.getTime())) {
      return res.status(400).json({ message: "Invalid date of birth" });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDob.setHours(0, 0, 0, 0);
    if (parsedDob > today) {
      return res.status(400).json({ message: "Date of birth cannot be in the future" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: "User with this email already exists" });

    let normalizedGuardian;
    if (normalizedRole === "student") {
      const guardianInput = parseMaybeJson(guardian);
      const guardianName = typeof guardianInput?.name === "string" ? guardianInput.name.trim() : "";
      const guardianPhone = typeof guardianInput?.phone === "string" ? guardianInput.phone.replace(/\D/g, "") : "";
      const guardianType = guardianInput?.type || "Other";

      if (!university) {
        return res.status(400).json({ message: "Student university is required" });
      }

      if (!guardianName || !guardianPhone) {
        return res.status(400).json({ message: "Guardian name and phone are required" });
      }

      if (!MOBILE_REGEX.test(guardianPhone)) {
        return res.status(400).json({ message: "Guardian phone must be exactly 10 digits" });
      }

      normalizedGuardian = {
        type: guardianType,
        name: guardianName,
        phone: guardianPhone,
      };
    }

    let normalizedPaymentDetails;
    if (normalizedRole === "owner") {
      const paymentInput = parseMaybeJson(paymentDetails);
      const accountNumber = typeof paymentInput?.accountNumber === "string" ? paymentInput.accountNumber.replace(/\D/g, "") : "";
      const bankName = typeof paymentInput?.bankName === "string" ? paymentInput.bankName.trim() : "";
      const branchName = typeof paymentInput?.branchName === "string" ? paymentInput.branchName.trim() : "";
      const accountHolderName = typeof paymentInput?.accountHolderName === "string" ? paymentInput.accountHolderName.trim() : "";

      if (!accountNumber || !bankName || !branchName || !accountHolderName) {
        return res.status(400).json({ message: "Payment details are required" });
      }

      if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
        return res.status(400).json({ message: "Account number must be 12 to 16 digits" });
      }

      normalizedPaymentDetails = {
        accountNumber,
        bankName,
        branchName,
        accountHolderName,
      };
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: normalizedRole,
      contactNumber: normalizedContactNumber,
      university: normalizedRole === "student" ? university : undefined,
      gender,
      dob: parsedDob,
      guardian: normalizedRole === "student" ? normalizedGuardian : undefined,
      paymentDetails: normalizedRole === "owner" ? normalizedPaymentDetails : undefined,
      isEmailVerified: true,
      otp: undefined,
      otpExpiry: undefined,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      university: user.university,
      dob: user.dob,
      guardian: user.guardian,
      paymentDetails: user.paymentDetails,
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