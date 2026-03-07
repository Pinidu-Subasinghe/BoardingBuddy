const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// Register
const registerUser = async (req, res) => {
  const { name, email, password, gender, contactNumber, role, university } =
    req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (role === "student" && !university) {
      return res
        .status(400)
        .json({ message: "University is required for students" });
    }

    const user = await User.create({
      name,
      email,
      password,
      gender,
      contactNumber,
      role,
      university,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      role: user.role,
      contactNumber: user.contactNumber,
      university: user.university,
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