const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendTransactionalEmail } = require("../utils/email");

// Server-side validation mirrors frontend rules to prevent bypass.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;
const MOBILE_REGEX = /^\d{10}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{12,16}$/;

const buildWelcomeEmail = (userName) => ({
  subject: "Welcome to BoardingBuddy \ud83c\udfe0",
  text:
    `Dear ${userName},\n\n` +
    "Welcome to BoardingBuddy!\n" +
    "Your account has been successfully created.\n" +
    "You can now explore boarding listings, manage your profile, and use our services.\n\n" +
    "If you did not create this account, please contact support immediately.\n\n" +
    "Thank you for choosing our platform.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy \ud83c\udfe0 Team"
});

// Register
const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    gender,
    contactNumber,
    role,
    university,
    dob,
    guardian,
    paymentDetails,
  } = req.body;

  // Normalize user input before validation and persistence.
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedContactNumber =
    typeof contactNumber === "string" ? contactNumber.replace(/\D/g, "") : "";

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  if (!STRONG_PASSWORD_REGEX.test(password || "")) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!MOBILE_REGEX.test(normalizedContactNumber)) {
    return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
  }

  const parsedDob = dob ? new Date(dob) : null;
  if (!parsedDob || Number.isNaN(parsedDob.getTime())) {
    return res.status(400).json({ message: "Date of birth is required" });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDob.setHours(0, 0, 0, 0);
  if (parsedDob > today) {
    return res.status(400).json({ message: "Date of birth cannot be in the future" });
  }

  try {
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (role === "student" && !university) {
      return res
        .status(400)
        .json({ message: "University is required for students" });
    }

    if (role === "student") {
      const guardianType = guardian?.type;
      const guardianName = guardian?.name;
      const guardianPhone = guardian?.phone;
      const normalizedGuardianPhone =
        typeof guardianPhone === "string" ? guardianPhone.replace(/\D/g, "") : "";

      if (!guardianType || !guardianName || !normalizedGuardianPhone) {
        return res.status(400).json({ message: "Guardian details are required" });
      }

      if (!MOBILE_REGEX.test(normalizedGuardianPhone)) {
        return res.status(400).json({ message: "Guardian phone must be exactly 10 digits" });
      }
    }

    if (role === "owner") {
      const accountNumber = paymentDetails?.accountNumber;
      const bankName = paymentDetails?.bankName;
      const branchName = paymentDetails?.branchName;
      const accountHolderName = paymentDetails?.accountHolderName;
      const normalizedAccountNumber =
        typeof accountNumber === "string" ? accountNumber.replace(/\D/g, "") : "";

      if (!normalizedAccountNumber || !bankName || !branchName || !accountHolderName) {
        return res.status(400).json({ message: "Payment details are required" });
      }

      if (!ACCOUNT_NUMBER_REGEX.test(normalizedAccountNumber)) {
        return res.status(400).json({ message: "Account number must be 12 to 16 digits" });
      }
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      gender,
      contactNumber: normalizedContactNumber,
      role,
      university,
      dob: parsedDob,
      guardian: role === "student"
        ? {
            type: guardian?.type,
            name: guardian?.name,
            phone: typeof guardian?.phone === "string" ? guardian.phone.replace(/\D/g, "") : "",
          }
        : undefined,
      paymentDetails: role === "owner"
        ? {
            accountNumber:
              typeof paymentDetails?.accountNumber === "string"
                ? paymentDetails.accountNumber.replace(/\D/g, "")
                : "",
            bankName: paymentDetails?.bankName,
            branchName: paymentDetails?.branchName,
            accountHolderName: paymentDetails?.accountHolderName,
          }
        : undefined,
    });

    const welcomeEmail = buildWelcomeEmail(user.name);
    sendTransactionalEmail({
      to: user.email,
      subject: welcomeEmail.subject,
      text: welcomeEmail.text
    }).catch((error) => {
      console.error("Email error:", error);
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      role: user.role,
      contactNumber: user.contactNumber,
      university: user.university,
      dob: user.dob,
      guardian: user.guardian,
      paymentDetails: user.paymentDetails,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        role: user.role,
        contactNumber: user.contactNumber,
        university: user.university,
        dob: user.dob,
        guardian: user.guardian,
        paymentDetails: user.paymentDetails,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };