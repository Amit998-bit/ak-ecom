// server/scripts/seed.js
// Run: node scripts/seed.js

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';
import path     from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// INLINE MODELS (no import issues)
// ============================================

// User Model
const addressSchema = new mongoose.Schema({
  fullName: String, phone: String, addressLine1: String,
  addressLine2: String, city: String, state: String,
  postalCode: String, country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true, select: false },
  phone:        String,
  role:         { type: String, enum: ['CUSTOMER', 'STAFF', 'ADMIN'], default: 'CUSTOMER' },
  addresses:    [addressSchema],
  refreshToken: { type: String, select: false },
  isActive:     { type: Boolean, default: true },
  lastLogin:    Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Category Model
const categorySchema = new mongoose.Schema({
  name:     { type: String, required: true },
  slug:     { type: String, required: true, unique: true, lowercase: true },
  description: String,
  parent:   { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  image:    String,
  isActive: { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
  seo:      { metaTitle: String, metaDescription: String },
}, { timestamps: true });

// Product Model
const variantSchema = new mongoose.Schema({
  sku:        { type: String, required: true },
  attributes: { type: Map, of: String },
  price:      { type: Number, required: true },
  stock:      { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  shortDescription: String,
  longDescription:  String,
  basePrice:        { type: Number, required: true },
  comparePrice:     Number,
  sku:              { type: String, sparse: true },
  stock:            { type: Number, default: 0 },
  category:         { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images:           [{ url: String, alt: String, order: Number }],
  hasVariants:      { type: Boolean, default: false },
  options:          [{ name: String, values: [String] }],
  variants:         [variantSchema],
  isFeatured:       { type: Boolean, default: false },
  isPublished:      { type: Boolean, default: true },
  viewCount:        { type: Number, default: 0 },
  salesCount:       { type: Number, default: 0 },
  seo:              { metaTitle: String, metaDescription: String },
  publishedAt:      Date,
}, { timestamps: true });

// Order Model
const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title:    String,
  quantity: { type: Number, required: true },
  price:    { type: Number, required: true },
  total:    Number,
});

const orderSchema = new mongoose.Schema({
  orderNumber:  { type: String, unique: true },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:        [orderItemSchema],
  subtotal:     Number,
  discount:     { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  tax:          { type: Number, default: 0 },
  total:        Number,
  shippingAddress: {
    fullName: String, phone: String, addressLine1: String,
    city: String, state: String, postalCode: String, country: String,
  },
  paymentMethod:  { type: String, default: 'COD' },
  paymentStatus:  { type: String, default: 'PENDING' },
  status:         { type: String, default: 'PENDING' },
  customerNote:   String,
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const ts  = Date.now().toString().slice(-8);
    const rnd = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = 'ORD-' + ts + '-' + rnd;
  }
  next();
});

// Coupon Model
const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true },
  description:   String,
  discountType:  { type: String, enum: ['PERCENTAGE', 'FIXED'] },
  discountValue: Number,
  minPurchase:   { type: Number, default: 0 },
  maxDiscount:   Number,
  usageLimit:    Number,
  usageCount:    { type: Number, default: 0 },
  startDate:     Date,
  endDate:       Date,
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

// Review Model
const reviewSchema = new mongoose.Schema({
  product:            { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  rating:             { type: Number, required: true, min: 1, max: 5 },
  title:              String,
  comment:            { type: String, required: true },
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved:         { type: Boolean, default: true },
  helpfulCount:       { type: Number, default: 0 },
}, { timestamps: true });

// Homepage Config Model
const homepageConfigSchema = new mongoose.Schema({
  sections: [{
    type:    { type: String },
    enabled: { type: Boolean, default: true },
    order:   Number,
    config:  mongoose.Schema.Types.Mixed,
  }],
}, { timestamps: true });

// Theme Config Model
const themeConfigSchema = new mongoose.Schema({
  colors: {
    primary:    { type: String, default: '#3B82F6' },
    secondary:  { type: String, default: '#10B981' },
    accent:     { type: String, default: '#F59E0B' },
    background: { type: String, default: '#FFFFFF' },
    text:       { type: String, default: '#1F2937' },
  },
  fonts:  { primary: { type: String, default: 'Inter' } },
  layout: { headerStyle: { type: String, default: 'MODERN' } },
  logo:   { main: String, favicon: String },
}, { timestamps: true });

// Cart Model
const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
  price:    Number,
});

const cartSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  items:    [cartItemSchema],
  discount: { type: Number, default: 0 },
}, { timestamps: true });

// Wishlist Model
const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

// Register models
const User           = mongoose.model('User',           userSchema);
const Category       = mongoose.model('Category',       categorySchema);
const Product        = mongoose.model('Product',        productSchema);
const Order          = mongoose.model('Order',          orderSchema);
const Coupon         = mongoose.model('Coupon',         couponSchema);
const Review         = mongoose.model('Review',         reviewSchema);
const HomepageConfig = mongoose.model('HomepageConfig', homepageConfigSchema);
const ThemeConfig    = mongoose.model('ThemeConfig',    themeConfigSchema);
const Cart           = mongoose.model('Cart',           cartSchema);
const Wishlist       = mongoose.model('Wishlist',       wishlistSchema);

// ============================================
// SEED DATA
// ============================================

// ─── USERS ──────────────────────────────────────────────────────────────────
const USERS = [
  {
    firstName: 'Super',
    lastName:  'Admin',
    email:     'admin@shopmern.com',
    password:  'Admin@123',
    role:      'ADMIN',
    phone:     '9999999999',
    isActive:  true,
    addresses: [{
      fullName:     'Super Admin',
      phone:        '9999999999',
      addressLine1: '123 Admin Street',
      city:         'Mumbai',
      state:        'Maharashtra',
      postalCode:   '400001',
      country:      'India',
      isDefault:    true,
    }],
  },
  {
    firstName: 'Store',
    lastName:  'Staff',
    email:     'staff@shopmern.com',
    password:  'Staff@123',
    role:      'STAFF',
    phone:     '8888888888',
    isActive:  true,
  },
  {
    firstName: 'John',
    lastName:  'Doe',
    email:     'john@example.com',
    password:  'Customer@123',
    role:      'CUSTOMER',
    phone:     '7777777777',
    isActive:  true,
    addresses: [{
      fullName:     'John Doe',
      phone:        '7777777777',
      addressLine1: '456 Customer Lane',
      city:         'Pune',
      state:        'Maharashtra',
      postalCode:   '411001',
      country:      'India',
      isDefault:    true,
    }],
  },
  {
    firstName: 'Priya',
    lastName:  'Sharma',
    email:     'priya@example.com',
    password:  'Customer@123',
    role:      'CUSTOMER',
    phone:     '6666666666',
    isActive:  true,
    addresses: [{
      fullName:     'Priya Sharma',
      phone:        '6666666666',
      addressLine1: '789 Main Road',
      city:         'Bangalore',
      state:        'Karnataka',
      postalCode:   '560001',
      country:      'India',
      isDefault:    true,
    }],
  },
  {
    firstName: 'Rahul',
    lastName:  'Kumar',
    email:     'rahul@example.com',
    password:  'Customer@123',
    role:      'CUSTOMER',
    phone:     '5555555555',
    isActive:  true,
  },
];

// ─── CATEGORIES ─────────────────────────────────────────────────────────────
const CATEGORIES_DATA = [
  // Parent categories
  { name: 'Electronics',  slug: 'electronics',  description: 'Latest gadgets and electronics', order: 1, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
  { name: 'Clothing',     slug: 'clothing',     description: 'Fashion for everyone',           order: 2, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400' },
  { name: 'Home & Living',slug: 'home-living',  description: 'Make your home beautiful',       order: 3, image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400' },
  { name: 'Sports',       slug: 'sports',       description: 'Sports and fitness gear',        order: 4, image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400' },
  { name: 'Books',        slug: 'books',        description: 'Books for all ages',             order: 5, image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400' },
];

const SUB_CATEGORIES_DATA = [
  // Electronics sub
  { name: 'Smartphones', slug: 'smartphones', description: 'Latest smartphones',      parentSlug: 'electronics', order: 1 },
  { name: 'Laptops',     slug: 'laptops',     description: 'Powerful laptops',        parentSlug: 'electronics', order: 2 },
  { name: 'Audio',       slug: 'audio',       description: 'Headphones & speakers',   parentSlug: 'electronics', order: 3 },
  // Clothing sub
  { name: "Men's Wear",  slug: 'mens-wear',   description: 'Clothing for men',        parentSlug: 'clothing',    order: 1 },
  { name: "Women's Wear",slug: 'womens-wear', description: 'Clothing for women',      parentSlug: 'clothing',    order: 2 },
  // Home sub
  { name: 'Furniture',   slug: 'furniture',   description: 'Quality furniture',       parentSlug: 'home-living', order: 1 },
  { name: 'Kitchen',     slug: 'kitchen',     description: 'Kitchen essentials',      parentSlug: 'home-living', order: 2 },
];

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
const buildProducts = (catMap) => [
  // ── Electronics ──
  {
    title:            'iPhone 15 Pro Max',
    slug:             'iphone-15-pro-max',
    shortDescription: 'The most powerful iPhone ever with A17 Pro chip and titanium design.',
    longDescription:  '<p>Experience the future with iPhone 15 Pro Max. Featuring the revolutionary A17 Pro chip, a stunning 6.7-inch Super Retina XDR display, and a pro camera system that transforms how you capture moments.</p>',
    basePrice:        134900,
    comparePrice:     149900,
    sku:              'IPH-15-PM-001',
    stock:            50,
    category:         catMap['smartphones'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', alt: 'iPhone 15 Pro Max', order: 1 },
      { url: 'https://images.unsplash.com/photo-1696446701796-da61daa4f08c?w=500', alt: 'iPhone 15 Pro Max Side', order: 2 },
    ],
    hasVariants: true,
    options: [
      { name: 'Storage', values: ['256GB', '512GB', '1TB'] },
      { name: 'Color',   values: ['Black Titanium', 'White Titanium', 'Blue Titanium'] },
    ],
    variants: [
      { sku: 'IPH-15-PM-256-BLK', attributes: { Storage: '256GB', Color: 'Black Titanium' }, price: 134900, stock: 15 },
      { sku: 'IPH-15-PM-512-BLK', attributes: { Storage: '512GB', Color: 'Black Titanium' }, price: 149900, stock: 10 },
      { sku: 'IPH-15-PM-256-WHT', attributes: { Storage: '256GB', Color: 'White Titanium' }, price: 134900, stock: 15 },
      { sku: 'IPH-15-PM-1TB-BLU', attributes: { Storage: '1TB',   Color: 'Blue Titanium'  }, price: 169900, stock: 10 },
    ],
    salesCount: 128,
  },
  {
    title:            'Samsung Galaxy S24 Ultra',
    slug:             'samsung-galaxy-s24-ultra',
    shortDescription: 'Galaxy AI is here. The Samsung Galaxy S24 Ultra with built-in S Pen.',
    longDescription:  '<p>The Galaxy S24 Ultra pushes the boundaries with Galaxy AI, a built-in S Pen, and a 200MP camera system.</p>',
    basePrice:        124999,
    comparePrice:     134999,
    sku:              'SAM-S24-U-001',
    stock:            40,
    category:         catMap['smartphones'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500', alt: 'Samsung S24 Ultra', order: 1 },
    ],
    hasVariants: true,
    options: [
      { name: 'Storage', values: ['256GB', '512GB', '1TB'] },
      { name: 'Color',   values: ['Titanium Black', 'Titanium Gray', 'Titanium Violet'] },
    ],
    variants: [
      { sku: 'SAM-S24-256-BLK', attributes: { Storage: '256GB', Color: 'Titanium Black' }, price: 124999, stock: 20 },
      { sku: 'SAM-S24-512-BLK', attributes: { Storage: '512GB', Color: 'Titanium Black' }, price: 139999, stock: 10 },
      { sku: 'SAM-S24-256-GRY', attributes: { Storage: '256GB', Color: 'Titanium Gray'  }, price: 124999, stock: 10 },
    ],
    salesCount: 95,
  },
  {
    title:            'MacBook Pro 14-inch M3',
    slug:             'macbook-pro-14-m3',
    shortDescription: 'Supercharged by M3 chip. Mind-blowing performance and battery life.',
    longDescription:  '<p>MacBook Pro 14-inch with M3 chip delivers unprecedented performance. With up to 22 hours of battery life and a stunning Liquid Retina XDR display.</p>',
    basePrice:        168900,
    comparePrice:     179900,
    sku:              'MBP-14-M3-001',
    stock:            25,
    category:         catMap['laptops'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', alt: 'MacBook Pro 14', order: 1 },
      { url: 'https://images.unsplash.com/photo-1611186871525-8cec0b5d3c5c?w=500', alt: 'MacBook Pro Open', order: 2 },
    ],
    hasVariants: true,
    options: [
      { name: 'RAM',     values: ['8GB', '16GB', '36GB'] },
      { name: 'Storage', values: ['512GB', '1TB', '2TB'] },
    ],
    variants: [
      { sku: 'MBP-14-8-512',  attributes: { RAM: '8GB',  Storage: '512GB' }, price: 168900, stock: 10 },
      { sku: 'MBP-14-16-1TB', attributes: { RAM: '16GB', Storage: '1TB'   }, price: 208900, stock: 10 },
      { sku: 'MBP-14-36-2TB', attributes: { RAM: '36GB', Storage: '2TB'   }, price: 288900, stock: 5  },
    ],
    salesCount: 67,
  },
  {
    title:            'Sony WH-1000XM5 Headphones',
    slug:             'sony-wh-1000xm5',
    shortDescription: 'Industry-leading noise canceling headphones with 30-hour battery.',
    longDescription:  '<p>The WH-1000XM5 headphones build on our legacy of premium noise canceling technology with eight microphones and two processors.</p>',
    basePrice:        24990,
    comparePrice:     29990,
    sku:              'SNY-WH5-001',
    stock:            100,
    category:         catMap['audio'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', alt: 'Sony WH-1000XM5', order: 1 },
    ],
    hasVariants: true,
    options: [{ name: 'Color', values: ['Black', 'Silver', 'Midnight Blue'] }],
    variants: [
      { sku: 'SNY-WH5-BLK', attributes: { Color: 'Black'        }, price: 24990, stock: 40 },
      { sku: 'SNY-WH5-SLV', attributes: { Color: 'Silver'       }, price: 24990, stock: 30 },
      { sku: 'SNY-WH5-MBL', attributes: { Color: 'Midnight Blue' }, price: 24990, stock: 30 },
    ],
    salesCount: 210,
  },

  // ── Clothing ──
  {
    title:            'Premium Cotton T-Shirt',
    slug:             'premium-cotton-t-shirt',
    shortDescription: 'Ultra-soft 100% organic cotton t-shirt. Perfect for everyday wear.',
    longDescription:  '<p>Made from 100% GOTS-certified organic cotton, this premium t-shirt is soft, breathable, and built to last. Available in multiple colors and sizes.</p>',
    basePrice:        599,
    comparePrice:     999,
    sku:              'TSHIRT-PREMIUM-001',
    stock:            500,
    category:         catMap['mens-wear'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', alt: 'Premium T-Shirt', order: 1 },
      { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500', alt: 'T-Shirt Back',    order: 2 },
    ],
    hasVariants: true,
    options: [
      { name: 'Size',  values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'Color', values: ['White', 'Black', 'Navy', 'Grey', 'Red'] },
    ],
    variants: [
      { sku: 'TSH-S-WHT',  attributes: { Size: 'S',  Color: 'White' }, price: 599, stock: 50 },
      { sku: 'TSH-M-WHT',  attributes: { Size: 'M',  Color: 'White' }, price: 599, stock: 80 },
      { sku: 'TSH-L-WHT',  attributes: { Size: 'L',  Color: 'White' }, price: 599, stock: 60 },
      { sku: 'TSH-S-BLK',  attributes: { Size: 'S',  Color: 'Black' }, price: 599, stock: 50 },
      { sku: 'TSH-M-BLK',  attributes: { Size: 'M',  Color: 'Black' }, price: 599, stock: 80 },
      { sku: 'TSH-L-BLK',  attributes: { Size: 'L',  Color: 'Black' }, price: 599, stock: 60 },
      { sku: 'TSH-XL-NAV', attributes: { Size: 'XL', Color: 'Navy'  }, price: 649, stock: 40 },
    ],
    salesCount: 856,
  },
  {
    title:            'Slim Fit Chinos',
    slug:             'slim-fit-chinos',
    shortDescription: 'Versatile slim-fit chinos perfect for office or casual wear.',
    longDescription:  '<p>These slim-fit chinos are made from stretch cotton fabric that keeps you comfortable all day. Perfect for the office or a casual outing.</p>',
    basePrice:        1499,
    comparePrice:     2499,
    sku:              'CHINO-SLIM-001',
    stock:            200,
    category:         catMap['mens-wear'],
    isFeatured:       false,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500', alt: 'Slim Chinos', order: 1 },
    ],
    hasVariants: true,
    options: [
      { name: 'Size',  values: ['28', '30', '32', '34', '36'] },
      { name: 'Color', values: ['Khaki', 'Navy', 'Olive', 'Black'] },
    ],
    variants: [
      { sku: 'CHN-30-KHK', attributes: { Size: '30', Color: 'Khaki' }, price: 1499, stock: 25 },
      { sku: 'CHN-32-KHK', attributes: { Size: '32', Color: 'Khaki' }, price: 1499, stock: 30 },
      { sku: 'CHN-32-NAV', attributes: { Size: '32', Color: 'Navy'  }, price: 1499, stock: 25 },
      { sku: 'CHN-34-BLK', attributes: { Size: '34', Color: 'Black' }, price: 1499, stock: 20 },
    ],
    salesCount: 234,
  },
  {
    title:            'Floral Summer Dress',
    slug:             'floral-summer-dress',
    shortDescription: 'Beautiful floral print summer dress in lightweight chiffon.',
    longDescription:  '<p>This gorgeous floral summer dress is made from lightweight chiffon fabric. The perfect outfit for summer days out, beach visits, or casual gatherings.</p>',
    basePrice:        1299,
    comparePrice:     1999,
    sku:              'DRESS-FLORAL-001',
    stock:            150,
    category:         catMap['womens-wear'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', alt: 'Floral Dress', order: 1 },
    ],
    hasVariants: true,
    options: [
      { name: 'Size',  values: ['XS', 'S', 'M', 'L', 'XL'] },
      { name: 'Color', values: ['Blue Floral', 'Pink Floral', 'Yellow Floral'] },
    ],
    variants: [
      { sku: 'DRS-S-BLF',  attributes: { Size: 'S',  Color: 'Blue Floral'   }, price: 1299, stock: 20 },
      { sku: 'DRS-M-BLF',  attributes: { Size: 'M',  Color: 'Blue Floral'   }, price: 1299, stock: 30 },
      { sku: 'DRS-M-PKF',  attributes: { Size: 'M',  Color: 'Pink Floral'   }, price: 1299, stock: 25 },
      { sku: 'DRS-L-YLF',  attributes: { Size: 'L',  Color: 'Yellow Floral' }, price: 1299, stock: 20 },
    ],
    salesCount: 412,
  },

  // ── Home & Living ──
  {
    title:            'Ergonomic Office Chair',
    slug:             'ergonomic-office-chair',
    shortDescription: 'Fully adjustable ergonomic chair with lumbar support for long work sessions.',
    longDescription:  '<p>This premium ergonomic office chair features adjustable lumbar support, armrests, and seat height. Built for comfort during long work sessions.</p>',
    basePrice:        12999,
    comparePrice:     19999,
    sku:              'CHAIR-ERG-001',
    stock:            30,
    category:         catMap['furniture'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500', alt: 'Ergonomic Chair', order: 1 },
    ],
    hasVariants: true,
    options: [{ name: 'Color', values: ['Black', 'Grey', 'Blue'] }],
    variants: [
      { sku: 'CHR-ERG-BLK', attributes: { Color: 'Black' }, price: 12999, stock: 12 },
      { sku: 'CHR-ERG-GRY', attributes: { Color: 'Grey'  }, price: 12999, stock: 10 },
      { sku: 'CHR-ERG-BLU', attributes: { Color: 'Blue'  }, price: 13999, stock: 8  },
    ],
    salesCount: 89,
  },
  {
    title:            'Instant Pot Duo 7-in-1',
    slug:             'instant-pot-duo-7-in-1',
    shortDescription: '7-in-1 multi-cooker: pressure cooker, slow cooker, rice cooker and more.',
    longDescription:  '<p>The Instant Pot Duo is a 7-in-1 electric multi-cooker that replaces your pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer.</p>',
    basePrice:        6999,
    comparePrice:     9999,
    sku:              'IPOT-DUO7-001',
    stock:            75,
    category:         catMap['kitchen'],
    isFeatured:       false,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500', alt: 'Instant Pot', order: 1 },
    ],
    hasVariants: true,
    options: [{ name: 'Size', values: ['3L', '5.7L', '8L'] }],
    variants: [
      { sku: 'IPOT-3L',   attributes: { Size: '3L'   }, price: 5999,  stock: 25 },
      { sku: 'IPOT-5.7L', attributes: { Size: '5.7L' }, price: 6999,  stock: 30 },
      { sku: 'IPOT-8L',   attributes: { Size: '8L'   }, price: 8999,  stock: 20 },
    ],
    salesCount: 156,
  },

  // ── Sports ──
  {
    title:            'Nike Air Zoom Pegasus 40',
    slug:             'nike-air-zoom-pegasus-40',
    shortDescription: 'Responsive cushioning and a breathable upper for everyday running.',
    longDescription:  '<p>The Nike Air Zoom Pegasus 40 delivers reliable, lightweight cushioning for your everyday runs. The breathable mesh upper keeps feet cool and comfortable.</p>',
    basePrice:        9995,
    comparePrice:     11995,
    sku:              'NIKE-PEG40-001',
    stock:            120,
    category:         catMap['sports'],
    isFeatured:       true,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', alt: 'Nike Pegasus 40', order: 1 },
      { url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500', alt: 'Nike Shoe Side', order: 2 },
    ],
    hasVariants: true,
    options: [
      { name: 'Size',  values: ['6', '7', '8', '9', '10', '11', '12'] },
      { name: 'Color', values: ['White/Black', 'Black/White', 'Blue/Orange'] },
    ],
    variants: [
      { sku: 'NIKE-PEG-8-WB',  attributes: { Size: '8',  Color: 'White/Black'  }, price: 9995, stock: 15 },
      { sku: 'NIKE-PEG-9-WB',  attributes: { Size: '9',  Color: 'White/Black'  }, price: 9995, stock: 20 },
      { sku: 'NIKE-PEG-10-WB', attributes: { Size: '10', Color: 'White/Black'  }, price: 9995, stock: 15 },
      { sku: 'NIKE-PEG-9-BW',  attributes: { Size: '9',  Color: 'Black/White'  }, price: 9995, stock: 20 },
      { sku: 'NIKE-PEG-10-BO', attributes: { Size: '10', Color: 'Blue/Orange'  }, price: 9995, stock: 15 },
    ],
    salesCount: 543,
  },

  // ── Books ──
  {
    title:            'Atomic Habits',
    slug:             'atomic-habits',
    shortDescription: 'An easy and proven way to build good habits and break bad ones.',
    longDescription:  '<p>No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear, one of the worlds leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.</p>',
    basePrice:        399,
    comparePrice:     599,
    sku:              'BOOK-ATOMIC-001',
    stock:            300,
    category:         catMap['books'],
    isFeatured:       false,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', alt: 'Atomic Habits Book', order: 1 },
    ],
    hasVariants: false,
    salesCount:  892,
  },
  {
    title:            'The Psychology of Money',
    slug:             'psychology-of-money',
    shortDescription: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel.',
    longDescription:  '<p>Doing well with money isn\'t necessarily about what you know. It\'s about how you behave. And behavior is hard to teach, even to really smart people.</p>',
    basePrice:        349,
    comparePrice:     499,
    sku:              'BOOK-PSYMONEY-001',
    stock:            250,
    category:         catMap['books'],
    isFeatured:       false,
    isPublished:      true,
    images: [
      { url: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=500', alt: 'Psychology of Money', order: 1 },
    ],
    hasVariants: false,
    salesCount:  654,
  },
];

// ─── COUPONS ─────────────────────────────────────────────────────────────────
const COUPONS = [
  {
    code:          'WELCOME10',
    description:   '10% off on your first order',
    discountType:  'PERCENTAGE',
    discountValue: 10,
    minPurchase:   500,
    maxDiscount:   500,
    usageLimit:    1000,
    perUserLimit:  1,
    startDate:     new Date('2024-01-01'),
    endDate:       new Date('2025-12-31'),
    isActive:      true,
  },
  {
    code:          'FLAT200',
    description:   'Flat ₹200 off on orders above ₹1000',
    discountType:  'FIXED',
    discountValue: 200,
    minPurchase:   1000,
    usageLimit:    500,
    perUserLimit:  2,
    startDate:     new Date('2024-01-01'),
    endDate:       new Date('2025-12-31'),
    isActive:      true,
  },
  {
    code:          'SAVE20',
    description:   '20% off on electronics',
    discountType:  'PERCENTAGE',
    discountValue: 20,
    minPurchase:   5000,
    maxDiscount:   2000,
    usageLimit:    200,
    perUserLimit:  1,
    startDate:     new Date('2024-01-01'),
    endDate:       new Date('2025-12-31'),
    isActive:      true,
  },
  {
    code:          'SUMMER50',
    description:   '50% off on clothing (max ₹300)',
    discountType:  'PERCENTAGE',
    discountValue: 50,
    minPurchase:   799,
    maxDiscount:   300,
    usageLimit:    100,
    perUserLimit:  1,
    startDate:     new Date('2024-04-01'),
    endDate:       new Date('2025-09-30'),
    isActive:      true,
  },
  {
    code:          'EXPIRED99',
    description:   'Expired coupon (for testing)',
    discountType:  'PERCENTAGE',
    discountValue: 99,
    minPurchase:   0,
    usageLimit:    100,
    startDate:     new Date('2023-01-01'),
    endDate:       new Date('2023-12-31'),
    isActive:      false,
  },
];

// ─── HOMEPAGE CONFIG ─────────────────────────────────────────────────────────
const HOMEPAGE_CONFIG = {
  sections: [
    {
      type:    'BANNER',
      enabled: true,
      order:   1,
      config: {
        title:    'Shop the Best Deals Online',
        subtitle: 'Free shipping on orders over ₹999',
        ctaText:  'Shop Now',
        ctaLink:  '/products',
      },
    },
    {
      type:    'FEATURED_PRODUCTS',
      enabled: true,
      order:   2,
      config:  { title: 'Featured Products', limit: 8 },
    },
    {
      type:    'CATEGORIES',
      enabled: true,
      order:   3,
      config:  { title: 'Shop by Category' },
    },
    {
      type:    'LATEST_PRODUCTS',
      enabled: true,
      order:   4,
      config:  { title: 'New Arrivals', limit: 8 },
    },
    {
      type:    'TESTIMONIALS',
      enabled: true,
      order:   5,
      config: {
        title: 'What Our Customers Say',
        items: [
          { name: 'Priya S.', comment: 'Amazing quality products and super fast delivery!', rating: 5, location: 'Mumbai' },
          { name: 'Rahul K.', comment: 'Best online shopping experience. Will definitely order again.', rating: 5, location: 'Delhi' },
          { name: 'Anita M.', comment: 'Great prices and excellent customer support!', rating: 4, location: 'Bangalore' },
        ],
      },
    },
    {
      type:    'GALLERY',
      enabled: false,
      order:   6,
      config:  { title: 'Our Gallery', images: [] },
    },
  ],
};

// ─── THEME CONFIG ─────────────────────────────────────────────────────────────
const THEME_CONFIG = {
  colors: {
    primary:    '#3B82F6',
    secondary:  '#10B981',
    accent:     '#F59E0B',
    background: '#FFFFFF',
    text:       '#1F2937',
  },
  fonts:  { primary: 'Inter',  secondary: 'Roboto' },
  layout: { headerStyle: 'MODERN', footerStyle: 'DETAILED' },
};

// ============================================
// SEED FUNCTION
// ============================================

const seed = async () => {
  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected!\n');

    // ── CLEAR ALL COLLECTIONS ─────────────────────────────────────────────
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      HomepageConfig.deleteMany({}),
      ThemeConfig.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
    ]);
    console.log('✅ All collections cleared!\n');

    // ── SEED USERS ────────────────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const createdUsers = [];
    for (const userData of USERS) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log('   ✅ ' + user.role + ': ' + user.email);
    }

    const adminUser    = createdUsers.find((u) => u.role === 'ADMIN');
    const staffUser    = createdUsers.find((u) => u.role === 'STAFF');
    const customerUsers = createdUsers.filter((u) => u.role === 'CUSTOMER');
    console.log('');

    // ── SEED CATEGORIES ───────────────────────────────────────────────────
    console.log('📂 Seeding categories...');
    const createdCategories = [];
    const catMap = {};

    for (const catData of CATEGORIES_DATA) {
      const cat = await Category.create(catData);
      createdCategories.push(cat);
      catMap[cat.slug] = cat._id;
      console.log('   ✅ ' + cat.name);
    }

    for (const subData of SUB_CATEGORIES_DATA) {
      const { parentSlug, ...rest } = subData;
      const sub = await Category.create({ ...rest, parent: catMap[parentSlug] });
      catMap[sub.slug] = sub._id;
      console.log('   ✅ ' + sub.name + ' (child of ' + parentSlug + ')');
    }
    console.log('');

    // ── SEED PRODUCTS ─────────────────────────────────────────────────────
    console.log('📦 Seeding products...');
    const productDefs   = buildProducts(catMap);
    const createdProducts = [];

    for (const productData of productDefs) {
      const product = await Product.create({
        ...productData,
        publishedAt: new Date(),
      });
      createdProducts.push(product);
      console.log('   ✅ ' + product.title + ' (₹' + product.basePrice + ')');
    }
    console.log('');

    // ── SEED COUPONS ──────────────────────────────────────────────────────
    console.log('🎫 Seeding coupons...');
    const createdCoupons = [];
    for (const couponData of COUPONS) {
      const coupon = await Coupon.create(couponData);
      createdCoupons.push(coupon);
      console.log('   ✅ ' + coupon.code + ' (' + coupon.discountType + ' - ' + coupon.discountValue + (coupon.discountType === 'PERCENTAGE' ? '%' : '₹') + ')');
    }
    console.log('');

    // ── SEED REVIEWS ──────────────────────────────────────────────────────
    console.log('⭐ Seeding reviews...');
    const reviewsData = [
      { product: createdProducts[0]._id, customer: customerUsers[0]._id, rating: 5, title: 'Best phone ever!', comment: 'Absolutely love this phone. The camera is incredible and performance is butter smooth.', isApproved: true, isVerifiedPurchase: true },
      { product: createdProducts[0]._id, customer: customerUsers[1]._id, rating: 4, title: 'Great phone, pricey but worth it', comment: 'Premium build quality and amazing performance. Battery life could be better though.', isApproved: true, isVerifiedPurchase: true },
      { product: createdProducts[2]._id, customer: customerUsers[0]._id, rating: 5, title: 'MacBook is incredible', comment: 'The M3 chip is a beast. Handles everything I throw at it with ease. Best laptop I have ever owned.', isApproved: true, isVerifiedPurchase: true },
      { product: createdProducts[4]._id, customer: customerUsers[0]._id, rating: 5, title: 'Amazing quality', comment: 'Super soft and comfortable. Washes well too. Will definitely buy more colors!', isApproved: true, isVerifiedPurchase: false },
      { product: createdProducts[4]._id, customer: customerUsers[1]._id, rating: 4, title: 'Good value', comment: 'Great quality for the price. Fits true to size. Highly recommend!', isApproved: true, isVerifiedPurchase: false },
      { product: createdProducts[9]._id, customer: customerUsers[1]._id, rating: 5, title: 'Life-changing book!', comment: 'This book transformed how I think about habits. A must-read for everyone.', isApproved: true, isVerifiedPurchase: true },
      { product: createdProducts[3]._id, customer: customerUsers[0]._id, rating: 5, title: 'Best headphones!', comment: 'Noise cancellation is incredible. Crystal clear sound quality. Worth every rupee!', isApproved: true, isVerifiedPurchase: true },
      { product: createdProducts[8]._id, customer: customerUsers[1]._id, rating: 5, title: 'Great running shoes!', comment: 'Very comfortable for long runs. Great cushioning and breathability.', isApproved: true, isVerifiedPurchase: true },
    ];

    for (const reviewData of reviewsData) {
      try {
        await Review.create(reviewData);
        console.log('   ✅ Review for product: ' + reviewData.product);
      } catch (err) {
        // Skip duplicate reviews
      }
    }
    console.log('');

    // ── SEED CARTS ────────────────────────────────────────────────────────
    console.log('🛒 Seeding carts...');
    const cartData = [
      {
        user:  customerUsers[0]._id,
        items: [
          { product: createdProducts[4]._id, quantity: 2, price: createdProducts[4].basePrice },
          { product: createdProducts[3]._id, quantity: 1, price: createdProducts[3].basePrice },
        ],
        discount: 0,
      },
      {
        user:  customerUsers[1]._id,
        items: [
          { product: createdProducts[9]._id, quantity: 3, price: createdProducts[9].basePrice },
        ],
        discount: 0,
      },
    ];

    for (const cart of cartData) {
      await Cart.create(cart);
      console.log('   ✅ Cart for user: ' + cart.user);
    }
    console.log('');

    // ── SEED WISHLISTS ────────────────────────────────────────────────────
    console.log('❤️  Seeding wishlists...');
    await Wishlist.create({
      user:     customerUsers[0]._id,
      products: [createdProducts[0]._id, createdProducts[2]._id, createdProducts[8]._id],
    });
    await Wishlist.create({
      user:     customerUsers[1]._id,
      products: [createdProducts[3]._id, createdProducts[4]._id],
    });
    console.log('   ✅ Wishlists created for customers');
    console.log('');

    // ── SEED ORDERS ───────────────────────────────────────────────────────
    console.log('📋 Seeding orders...');
    const ordersData = [
      {
        customer:     customerUsers[0]._id,
        items: [
          { product: createdProducts[4]._id, title: createdProducts[4].title, quantity: 2, price: 599,   total: 1198 },
          { product: createdProducts[3]._id, title: createdProducts[3].title, quantity: 1, price: 24990, total: 24990 },
        ],
        subtotal:        26188,
        discount:        0,
        shippingCost:    0,
        tax:             0,
        total:           26188,
        shippingAddress: { fullName: 'John Doe', phone: '7777777777', addressLine1: '456 Customer Lane', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' },
        paymentMethod:   'COD',
        paymentStatus:   'PENDING',
        status:          'DELIVERED',
        confirmedAt:     new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        shippedAt:       new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        deliveredAt:     new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        customer:     customerUsers[0]._id,
        items: [
          { product: createdProducts[0]._id, title: createdProducts[0].title, quantity: 1, price: 134900, total: 134900 },
        ],
        subtotal:        134900,
        discount:        13490,
        shippingCost:    0,
        tax:             0,
        total:           121410,
        shippingAddress: { fullName: 'John Doe', phone: '7777777777', addressLine1: '456 Customer Lane', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' },
        paymentMethod:   'RAZORPAY',
        paymentStatus:   'PAID',
        status:          'SHIPPED',
        appliedCoupon:   { code: 'SAVE20', discount: 13490 },
        paymentDetails:  { transactionId: 'pay_' + Date.now(), paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        confirmedAt:     new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        shippedAt:       new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        customer:     customerUsers[1]._id,
        items: [
          { product: createdProducts[2]._id, title: createdProducts[2].title, quantity: 1, price: 168900, total: 168900 },
        ],
        subtotal:        168900,
        discount:        0,
        shippingCost:    0,
        tax:             0,
        total:           168900,
        shippingAddress: { fullName: 'Priya Sharma', phone: '6666666666', addressLine1: '789 Main Road', city: 'Bangalore', state: 'Karnataka', postalCode: '560001', country: 'India' },
        paymentMethod:   'STRIPE',
        paymentStatus:   'PAID',
        status:          'PROCESSING',
        paymentDetails:  { transactionId: 'ch_' + Date.now(), paidAt: new Date() },
        confirmedAt:     new Date(),
      },
      {
        customer:     customerUsers[1]._id,
        items: [
          { product: createdProducts[9]._id,  title: createdProducts[9].title,  quantity: 2, price: 399, total: 798 },
          { product: createdProducts[10]._id, title: createdProducts[10].title, quantity: 1, price: 349, total: 349 },
        ],
        subtotal:        1147,
        discount:        200,
        shippingCost:    0,
        total:           947,
        shippingAddress: { fullName: 'Priya Sharma', phone: '6666666666', addressLine1: '789 Main Road', city: 'Bangalore', state: 'Karnataka', postalCode: '560001', country: 'India' },
        paymentMethod:   'COD',
        paymentStatus:   'PENDING',
        status:          'PENDING',
        appliedCoupon:   { code: 'FLAT200', discount: 200 },
      },
      {
        customer:     customerUsers[2]?._id || customerUsers[0]._id,
        items: [
          { product: createdProducts[8]._id, title: createdProducts[8].title, quantity: 1, price: 9995, total: 9995 },
        ],
        subtotal:        9995,
        discount:        999,
        shippingCost:    0,
        total:           8996,
        shippingAddress: { fullName: 'Rahul Kumar', phone: '5555555555', addressLine1: '321 New Street', city: 'Delhi', state: 'Delhi', postalCode: '110001', country: 'India' },
        paymentMethod:   'RAZORPAY',
        paymentStatus:   'PAID',
        status:          'CONFIRMED',
        appliedCoupon:   { code: 'WELCOME10', discount: 999 },
        paymentDetails:  { transactionId: 'pay_' + (Date.now() + 1), paidAt: new Date() },
        confirmedAt:     new Date(),
      },
    ];

    for (const orderData of ordersData) {
      const order = await Order.create(orderData);
      console.log('   ✅ Order: ' + order.orderNumber + ' (' + order.status + ' - ₹' + order.total + ')');
    }
    console.log('');

    // ── SEED HOMEPAGE CONFIG ──────────────────────────────────────────────
    console.log('🏠 Seeding homepage config...');
    await HomepageConfig.create(HOMEPAGE_CONFIG);
    console.log('   ✅ Homepage sections configured');
    console.log('');

    // ── SEED THEME CONFIG ─────────────────────────────────────────────────
    console.log('🎨 Seeding theme config...');
    await ThemeConfig.create(THEME_CONFIG);
    console.log('   ✅ Theme configured');
    console.log('');

    // ── FINAL SUMMARY ─────────────────────────────────────────────────────
    console.log('═'.repeat(60));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log('   👤 Users      : ' + createdUsers.length);
    console.log('   📂 Categories : ' + (CATEGORIES_DATA.length + SUB_CATEGORIES_DATA.length));
    console.log('   📦 Products   : ' + createdProducts.length);
    console.log('   🎫 Coupons    : ' + createdCoupons.length);
    console.log('   ⭐ Reviews    : ' + reviewsData.length);
    console.log('   📋 Orders     : ' + ordersData.length);
    console.log('');
    console.log('═'.repeat(60));
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('═'.repeat(60));
    console.log('');
    console.log('  👑 ADMIN');
    console.log('     Email    : admin@shopmern.com');
    console.log('     Password : Admin@123');
    console.log('     Access   : Full admin panel access');
    console.log('');
    console.log('  🧑‍💼 STAFF');
    console.log('     Email    : staff@shopmern.com');
    console.log('     Password : Staff@123');
    console.log('     Access   : Orders and products view');
    console.log('');
    console.log('  👤 CUSTOMER 1');
    console.log('     Email    : john@example.com');
    console.log('     Password : Customer@123');
    console.log('     Has      : Cart (2 items), Wishlist (3 items), 2 Orders');
    console.log('');
    console.log('  👤 CUSTOMER 2');
    console.log('     Email    : priya@example.com');
    console.log('     Password : Customer@123');
    console.log('     Has      : Cart (1 item), Wishlist (2 items), 2 Orders');
    console.log('');
    console.log('═'.repeat(60));
    console.log('🎫 ACTIVE COUPON CODES:');
    console.log('═'.repeat(60));
    console.log('');
    console.log('  WELCOME10  → 10% off  (min ₹500,  max ₹500)');
    console.log('  FLAT200    → ₹200 off  (min ₹1000)');
    console.log('  SAVE20     → 20% off  (min ₹5000, max ₹2000)');
    console.log('  SUMMER50   → 50% off  (min ₹799,  max ₹300)');
    console.log('  EXPIRED99  → EXPIRED  (for testing expired coupon)');
    console.log('');
    console.log('═'.repeat(60));
    console.log('🌐 URLS:');
    console.log('═'.repeat(60));
    console.log('');
    console.log('  🛍️  Storefront  : http://localhost:3000');
    console.log('  ⚙️  Admin Panel : http://localhost:3000/dashboard');
    console.log('  🔌 API Health  : http://localhost:5000/api/health');
    console.log('  📦 Products    : http://localhost:5000/api/products');
    console.log('');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
    process.exit(0);
  }
};

// Run seed
seed();