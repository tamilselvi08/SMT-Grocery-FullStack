import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, address, city, state, pincode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    mobile,
    address,
    city,
    state,
    pincode,
  });

  res.status(201).json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const fields = ["name", "mobile", "address", "city", "state", "pincode"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.json({ user: req.user.toSafeObject() });
});
