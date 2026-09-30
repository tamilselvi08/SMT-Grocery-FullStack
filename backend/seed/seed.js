import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import mongoose from "mongoose";

import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "data", file), "utf-8"));
}

async function seed() {
  await connectDB();

  console.log("Clearing existing categories, products, coupons...");
  await Promise.all([Category.deleteMany({}), Product.deleteMany({}), Coupon.deleteMany({})]);

  // --- Categories ---
  const categoriesData = readJSON("categories.json");
  const categories = await Category.insertMany(
    categoriesData.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: `/uploads/categories/${c.slug}.png`,
    }))
  );
  console.log(`Seeded ${categories.length} categories.`);

  // --- Products ---
  const productsData = readJSON("products.json");
  const products = await Product.insertMany(
    productsData.map((p) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      image: `/uploads/products/${p.slug}.png`,
      description: `Fresh, quality-checked ${p.name.toLowerCase()} sourced for SMT Grocery. Sold per ${p.unit}.`,
      unit: p.unit,
      stock: 40 + Math.floor(Math.random() * 60),
      keywords: p.keywords,
    }))
  );
  console.log(`Seeded ${products.length} products.`);

  // --- Coupons ---
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const coupons = await Coupon.insertMany([
    {
      code: "FIRST50",
      discountType: "flat",
      discountValue: 50,
      minimumOrder: 200,
      maximumDiscount: 50,
      expiryDate: oneYearFromNow,
      usageLimit: null,
      active: true,
    },
    {
      code: "SAVE100",
      discountType: "flat",
      discountValue: 100,
      minimumOrder: 999,
      maximumDiscount: 100,
      expiryDate: oneYearFromNow,
      usageLimit: null,
      active: true,
    },
    {
      code: "FRESH10",
      discountType: "percentage",
      discountValue: 10,
      minimumOrder: 300,
      maximumDiscount: 150,
      expiryDate: oneYearFromNow,
      usageLimit: null,
      active: true,
    },
    {
      code: "WELCOME",
      discountType: "percentage",
      discountValue: 15,
      minimumOrder: 0,
      maximumDiscount: 100,
      expiryDate: oneYearFromNow,
      usageLimit: null,
      active: true,
    },
  ]);
  console.log(`Seeded ${coupons.length} coupons.`);

  // --- Admin user ---
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@smtgrocery.com").toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || "SMT Admin",
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || "Admin@12345",
      role: "admin",
    });
    console.log(`Created admin account: ${adminEmail}`);
  } else {
    console.log(`Admin account already exists: ${adminEmail}`);
  }

  console.log("Seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
