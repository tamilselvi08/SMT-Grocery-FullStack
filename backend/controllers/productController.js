import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/products?category=Fruits&search=apple&page=1&limit=20
// Category filtering and search both happen here on the backend - the
// frontend just forwards whatever the user picked/typed as query params.
export const getProducts = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 100 } = req.query;
  const filter = {};

  if (category && category !== "All") {
    // Case-insensitive exact match so "fruits" / "Fruits" both work.
    filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  }

  if (search && search.trim()) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { name: new RegExp(term, "i") },
      { category: new RegExp(term, "i") },
      { keywords: new RegExp(term, "i") },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 100, 200);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, originalPrice, image, description, unit, stock, keywords } =
    req.body;

  if (!name || !category || price === undefined || !unit) {
    return res.status(400).json({ message: "name, category, price and unit are required." });
  }

  const product = await Product.create({
    name,
    category,
    price,
    originalPrice: originalPrice ?? price,
    image: image || "",
    description: description || "",
    unit,
    stock: stock ?? 0,
    keywords: Array.isArray(keywords)
      ? keywords
      : (keywords || "").split(",").map((k) => k.trim()).filter(Boolean),
  });

  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const editable = [
    "name",
    "category",
    "price",
    "originalPrice",
    "image",
    "description",
    "unit",
    "stock",
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.body.keywords !== undefined) {
    product.keywords = Array.isArray(req.body.keywords)
      ? req.body.keywords
      : String(req.body.keywords).split(",").map((k) => k.trim()).filter(Boolean);
  }

  await product.save();
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }
  res.json({ message: "Product deleted." });
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
