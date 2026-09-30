import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
});

// GET /api/categories/:category - returns the category doc plus only the
// products that belong to it (case-insensitive match on Product.category).
export const getCategoryWithProducts = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const categoryDoc = await Category.findOne({
    name: new RegExp(`^${category}$`, "i"),
  });

  const products = await Product.find({
    category: new RegExp(`^${category}$`, "i"),
  }).sort({ createdAt: -1 });

  res.json({ category: categoryDoc, products });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, image, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Category name is required." });
  }
  const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
  const category = await Category.create({ name, slug, image: image || "", description: description || "" });
  res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found." });

  ["name", "image", "description"].forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });
  if (req.body.name) {
    category.slug = req.body.name.toLowerCase().trim().replace(/\s+/g, "-");
  }
  await category.save();
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found." });
  res.json({ message: "Category deleted." });
});
