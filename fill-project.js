// fill-project.js
// Run: node fill-project.js

import fs from 'fs';
import path from 'path';

const files = {};

// ============================================
// SERVER FILES
// ============================================

// ----- CONFIG FILES -----

files['server/config/db.js'] = `
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected: ' + conn.connection.host);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error: ' + err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ DB Connection Error: ' + error.message);
    process.exit(1);
  }
};

export default connectDB;
`;

files['server/config/env.js'] = `
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  NODE_ENV:            process.env.NODE_ENV            || 'development',
  PORT:                process.env.PORT                || 5000,
  MONGODB_URI:         process.env.MONGODB_URI         || 'mongodb://localhost:27017/ecommerce',
  JWT_ACCESS_SECRET:   process.env.JWT_ACCESS_SECRET   || 'access_secret_change_in_production',
  JWT_ACCESS_EXPIRE:   process.env.JWT_ACCESS_EXPIRE   || '15m',
  JWT_REFRESH_SECRET:  process.env.JWT_REFRESH_SECRET  || 'refresh_secret_change_in_production',
  JWT_REFRESH_EXPIRE:  process.env.JWT_REFRESH_EXPIRE  || '7d',
  CLIENT_URL:          process.env.CLIENT_URL          || 'http://localhost:3000',
  UPLOAD_DIR:          process.env.UPLOAD_DIR          || 'uploads',
  MAX_FILE_SIZE:       process.env.MAX_FILE_SIZE       || 5242880,
};
`;

// ----- UTILS -----

files['server/utils/ApiError.util.js'] = `
export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;
    this.success    = false;
    Error.captureStackTrace(this, this.constructor);
  }
}
`;

files['server/utils/ApiResponse.util.js'] = `
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data       = data;
    this.message    = message;
    this.success    = statusCode < 400;
  }
}

export default ApiResponse;
`;

files['server/utils/asyncHandler.util.js'] = `
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
`;

files['server/utils/slug.util.js'] = `
import slugify from 'slugify';

export const generateUniqueSlug = async (Model, title, excludeId = null) => {
  let slug = slugify(title, { lower: true, strict: true, trim: true });

  let query = { slug };
  if (excludeId) query._id = { $ne: excludeId };

  let existingDoc = await Model.findOne(query);
  if (!existingDoc) return slug;

  let counter = 1;
  let newSlug  = slug;

  while (existingDoc) {
    newSlug = slug + '-' + counter;
    query   = { slug: newSlug };
    if (excludeId) query._id = { $ne: excludeId };
    existingDoc = await Model.findOne(query);
    counter++;
  }

  return newSlug;
};

export const isValidSlug = (slug) => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};
`;

files['server/utils/token.util.js'] = `
import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });

export const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error('Invalid refresh token');
  }
};
`;

files['server/utils/apiFeatures.util.js'] = `
class APIFeatures {
  constructor(query, queryString) {
    this.query       = query;
    this.queryString = queryString;
    this.pagination  = {};
  }

  search(searchFields = ['title']) {
    if (this.queryString.search) {
      const regex = new RegExp(this.queryString.search, 'i');
      this.query   = this.query.find({
        $or: searchFields.map((f) => ({ [f]: regex })),
      });
    }
    return this;
  }

  filter() {
    const queryObj      = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr     = queryStr.replace(/\\b(gte|gt|lte|lt)\\b/g, (m) => '$' + m);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query   = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query   = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page  = parseInt(this.queryString.page,  10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 20;
    const skip  = (page - 1) * limit;

    this.query      = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit, skip };
    return this;
  }
}

export default APIFeatures;
`;

// ----- MIDDLEWARES -----

files['server/middlewares/auth.middleware.js'] = `
import jwt       from 'jsonwebtoken';
import User      from '../modules/user/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiError }     from '../utils/ApiError.util.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw new ApiError(401, 'Not authorized, no token provided');

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  req.user      = await User.findById(decoded.id).select('-password');

  if (!req.user)          throw new ApiError(401, 'User not found');
  if (!req.user.isActive) throw new ApiError(403, 'Account is deactivated');

  next();
});
`;

files['server/middlewares/rbac.middleware.js'] = `
import { ApiError } from '../utils/ApiError.util.js';

const PERMISSIONS = {
  'product:create':   ['ADMIN'],
  'product:update':   ['ADMIN'],
  'product:delete':   ['ADMIN'],
  'product:view':     ['ADMIN', 'STAFF', 'CUSTOMER'],
  'order:manage':     ['ADMIN', 'STAFF'],
  'order:view_all':   ['ADMIN', 'STAFF'],
  'order:view_own':   ['CUSTOMER'],
  'user:manage':      ['ADMIN'],
  'user:view':        ['ADMIN', 'STAFF'],
  'settings:manage':  ['ADMIN'],
  'theme:manage':     ['ADMIN'],
  'homepage:manage':  ['ADMIN'],
  'category:manage':  ['ADMIN'],
  'coupon:manage':    ['ADMIN'],
  'review:approve':   ['ADMIN'],
  'review:create':    ['CUSTOMER'],
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated');
  if (!roles.includes(req.user.role))
    throw new ApiError(403, 'Role ' + req.user.role + ' is not authorized');
  next();
};

export const checkPermission = (permission) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated');

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) throw new ApiError(500, 'Invalid permission: ' + permission);

  if (!allowedRoles.includes(req.user.role))
    throw new ApiError(403, 'You do not have permission to ' + permission);

  next();
};
`;

files['server/middlewares/error.middleware.js'] = `
import { ApiError } from '../utils/ApiError.util.js';

export const errorHandler = (err, req, res, next) => {
  let error   = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(404, 'Resource not found');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field   = Object.keys(err.keyPattern)[0];
    error = new ApiError(400, field + ' already exists');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join(', '));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = new ApiError(401, 'Invalid token');
  if (err.name === 'TokenExpiredError')  error = new ApiError(401, 'Token expired');

  res.status(error.statusCode || 500).json({
    success: false,
    error:   error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  next(new ApiError(404, 'Not Found - ' + req.originalUrl));
};
`;

files['server/middlewares/validate.middleware.js'] = `
import { validationResult } from 'express-validator';
import { ApiError }         from '../utils/ApiError.util.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extracted = errors.array().map((e) => ({
      field:   e.param,
      message: e.msg,
    }));
    throw new ApiError(422, 'Validation Error', extracted);
  }
  next();
};
`;

files['server/middlewares/upload.middleware.js'] = `
import multer from 'multer';
import path   from 'path';
import { ApiError } from '../utils/ApiError.util.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime    = allowed.test(file.mimetype);
  if (mime && ext) return cb(null, true);
  cb(new ApiError(400, 'Only image files are allowed'));
};

const upload = multer({
  storage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadSingle   = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
export const uploadFields   = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video',  maxCount: 1  },
]);

export default upload;
`;

// ----- USER MODULE -----

files['server/modules/user/user.model.js'] = `
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  phone:        { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city:         { type: String, required: true },
  state:        { type: String, required: true },
  postalCode:   { type: String, required: true },
  country:      { type: String, default: 'India' },
  isDefault:    { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/, 'Invalid email'],
    },
    password: {
      type:      String,
      required:  true,
      minlength: 8,
      select:    false,
    },
    phone:        { type: String, trim: true },
    avatar:       String,
    role: {
      type:    String,
      enum:    ['CUSTOMER', 'STAFF', 'ADMIN'],
      default: 'CUSTOMER',
    },
    addresses:    [addressSchema],
    refreshToken: { type: String, select: false },
    isActive:     { type: Boolean, default: true },
    lastLogin:    Date,
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('fullName').get(function () {
  return this.firstName + ' ' + this.lastName;
});

userSchema.set('toJSON',   { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);
`;

files['server/modules/user/user.routes.js'] = `
import express       from 'express';
import { protect }   from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import User          from './user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';
import { ApiError }     from '../../utils/ApiError.util.js';

const router = express.Router();

// GET all users (Admin only)
router.get(
  '/',
  protect,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const page  = parseInt(req.query.page  || '1');
    const limit = parseInt(req.query.limit || '20');
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password -refreshToken').skip(skip).limit(limit).sort('-createdAt'),
      User.countDocuments(),
    ]);

    res.json(new ApiResponse(200, { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
  })
);

// GET single user (Admin only)
router.get(
  '/:id',
  protect,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) throw new ApiError(404, 'User not found');
    res.json(new ApiResponse(200, user));
  })
);

// UPDATE user role (Admin only)
router.put(
  '/:id/role',
  protect,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!['CUSTOMER', 'STAFF', 'ADMIN'].includes(role))
      throw new ApiError(400, 'Invalid role');

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) throw new ApiError(404, 'User not found');
    res.json(new ApiResponse(200, user, 'User role updated'));
  })
);

// UPDATE user status (Admin only)
router.put(
  '/:id/status',
  protect,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) throw new ApiError(404, 'User not found');
    res.json(new ApiResponse(200, user, 'User status updated'));
  })
);

// UPDATE current user profile
router.put(
  '/profile/me',
  protect,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json(new ApiResponse(200, user, 'Profile updated'));
  })
);

// ADD address
router.post(
  '/profile/addresses',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }
    user.addresses.push(req.body);
    await user.save();
    res.json(new ApiResponse(201, user.addresses, 'Address added'));
  })
);

// DELETE address
router.delete(
  '/profile/addresses/:addressId',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.addressId
    );
    await user.save();
    res.json(new ApiResponse(200, user.addresses, 'Address removed'));
  })
);

export default router;
`;

// ----- AUTH MODULE -----

files['server/modules/auth/auth.service.js'] = `
import User from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token.util.js';

class AuthService {
  async register(userData) {
    const { email } = userData;
    if (await User.findOne({ email })) throw new ApiError(400, 'Email already registered');

    const user         = await User.create({ ...userData, role: 'CUSTOMER' });
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user:  { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user)           throw new ApiError(401, 'Invalid credentials');
    if (!user.isActive)  throw new ApiError(403, 'Account is deactivated');

    const valid = await user.comparePassword(password);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    return {
      user:  { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) throw new ApiError(401, 'Refresh token required');

    const decoded = verifyRefreshToken(refreshToken);
    const user    = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken)
      throw new ApiError(401, 'Invalid refresh token');

    return { accessToken: generateAccessToken(user._id) };
  }

  async logout(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    user.refreshToken = null;
    await user.save();
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}

export default new AuthService();
`;

files['server/modules/auth/auth.controller.js'] = `
import AuthService   from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json(new ApiResponse(201, { user: result.user, accessToken: result.accessToken }, 'Registered successfully'));
  });

  login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(new ApiResponse(200, { user: result.user, accessToken: result.accessToken }, 'Login successful'));
  });

  refreshToken = asyncHandler(async (req, res) => {
    const result = await AuthService.refreshToken(req.cookies.refreshToken);
    res.status(200).json(new ApiResponse(200, result, 'Token refreshed'));
  });

  logout = asyncHandler(async (req, res) => {
    await AuthService.logout(req.user._id);
    res.clearCookie('refreshToken');
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  });

  me = asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.user._id);
    res.status(200).json(new ApiResponse(200, user, 'User fetched'));
  });
}

export default new AuthController();
`;

files['server/modules/auth/auth.validation.js'] = `
import { body } from 'express-validator';

export const authValidation = {
  register: [
    body('firstName').notEmpty().withMessage('First name is required').isLength({ min: 2 }).withMessage('Min 2 characters'),
    body('lastName').notEmpty().withMessage('Last name is required').isLength({ min: 2 }).withMessage('Min 2 characters'),
    body('email').notEmpty().withMessage('Email required').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password required')
      .isLength({ min: 8 }).withMessage('Min 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/).withMessage('Must contain uppercase, lowercase and number'),
  ],
  login: [
    body('email').notEmpty().withMessage('Email required').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
};
`;

files['server/modules/auth/auth.routes.js'] = `
import express         from 'express';
import AuthController  from './auth.controller.js';
import { protect }     from '../../middlewares/auth.middleware.js';
import { authValidation } from './auth.validation.js';
import { validate }       from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.post('/register', authValidation.register, validate, AuthController.register);
router.post('/login',    authValidation.login,    validate, AuthController.login);
router.post('/refresh',  AuthController.refreshToken);
router.post('/logout',   protect, AuthController.logout);
router.get('/me',        protect, AuthController.me);

export default router;
`;

// ----- CATEGORY MODULE -----

files['server/modules/category/category.model.js'] = `
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  slug:   { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  image:  String,
  isActive: { type: Boolean, default: true },
  seo: { metaTitle: String, metaDescription: String, metaKeywords: [String] },
  order: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });

categorySchema.virtual('children', { ref: 'Category', localField: '_id', foreignField: 'parent' });
categorySchema.set('toJSON',   { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

export default mongoose.model('Category', categorySchema);
`;

files['server/modules/category/category.service.js'] = `
import Category  from './category.model.js';
import { ApiError }          from '../../utils/ApiError.util.js';
import { generateUniqueSlug } from '../../utils/slug.util.js';

class CategoryService {
  async create(data) {
    const slug = data.slug || await generateUniqueSlug(Category, data.name);
    return Category.create({ ...data, slug });
  }

  async getAll() {
    return Category.find({ isActive: true }).populate('children').sort('order');
  }

  async getBySlug(slug) {
    const cat = await Category.findOne({ slug }).populate('parent').populate('children');
    if (!cat) throw new ApiError(404, 'Category not found');
    return cat;
  }

  async update(id, data) {
    if (data.name && !data.slug) {
      data.slug = await generateUniqueSlug(Category, data.name, id);
    }
    const cat = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!cat) throw new ApiError(404, 'Category not found');
    return cat;
  }

  async delete(id) {
    const cat = await Category.findById(id);
    if (!cat) throw new ApiError(404, 'Category not found');
    await Category.updateMany({ parent: id }, { parent: null });
    await cat.deleteOne();
  }
}

export default new CategoryService();
`;

files['server/modules/category/category.controller.js'] = `
import CategoryService from './category.service.js';
import { asyncHandler }  from '../../utils/asyncHandler.util.js';
import ApiResponse       from '../../utils/ApiResponse.util.js';

class CategoryController {
  create = asyncHandler(async (req, res) => {
    const cat = await CategoryService.create(req.body);
    res.status(201).json(new ApiResponse(201, cat, 'Category created'));
  });

  getAll = asyncHandler(async (req, res) => {
    const cats = await CategoryService.getAll();
    res.json(new ApiResponse(200, cats));
  });

  getBySlug = asyncHandler(async (req, res) => {
    const cat = await CategoryService.getBySlug(req.params.slug);
    res.json(new ApiResponse(200, cat));
  });

  update = asyncHandler(async (req, res) => {
    const cat = await CategoryService.update(req.params.id, req.body);
    res.json(new ApiResponse(200, cat, 'Category updated'));
  });

  delete = asyncHandler(async (req, res) => {
    await CategoryService.delete(req.params.id);
    res.json(new ApiResponse(200, null, 'Category deleted'));
  });
}

export default new CategoryController();
`;

files['server/modules/category/category.routes.js'] = `
import express            from 'express';
import CategoryController from './category.controller.js';
import { protect }        from '../../middlewares/auth.middleware.js';
import { authorize }      from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.get('/',      CategoryController.getAll);
router.get('/:slug', CategoryController.getBySlug);
router.post('/',     protect, authorize('ADMIN'), CategoryController.create);
router.put('/:id',   protect, authorize('ADMIN'), CategoryController.update);
router.delete('/:id',protect, authorize('ADMIN'), CategoryController.delete);

export default router;
`;

// ----- PRODUCT MODULE -----

files['server/modules/product/product.model.js'] = `
import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  sku:          { type: String, required: true, unique: true },
  attributes:   { type: Map, of: String },
  price:        { type: Number, required: true },
  comparePrice: Number,
  stock:        { type: Number, required: true, default: 0 },
  image:        String,
  isActive:     { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  shortDescription: { type: String, maxlength: 500 },
  longDescription:  String,
  basePrice:        { type: Number, required: true },
  comparePrice:     Number,
  sku:              { type: String, unique: true, sparse: true },
  stock:            { type: Number, default: 0 },
  category:         { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ url: { type: String, required: true }, alt: String, order: Number }],
  video:            { url: String, thumbnail: String },
  hasVariants:      { type: Boolean, default: false },
  options:          [{ name: String, values: [String] }],
  variants:         [variantSchema],
  seo:              { metaTitle: String, metaDescription: String, metaKeywords: [String] },
  isFeatured:       { type: Boolean, default: false },
  isPublished:      { type: Boolean, default: true },
  viewCount:        { type: Number, default: 0 },
  salesCount:       { type: Number, default: 0 },
  publishedAt:      Date,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isPublished: 1, isFeatured: 1 });
productSchema.index({ title: 'text', shortDescription: 'text' });
productSchema.index({ basePrice: 1 });
productSchema.index({ createdAt: -1 });

productSchema.virtual('reviews', { ref: 'Review', localField: '_id', foreignField: 'product' });

productSchema.methods.isInStock = function (qty = 1) {
  if (this.hasVariants) return this.variants.some((v) => v.stock >= qty && v.isActive);
  return this.stock >= qty;
};

export default mongoose.model('Product', productSchema);
`;

files['server/modules/product/product.service.js'] = `
import Product  from './product.model.js';
import { ApiError }           from '../../utils/ApiError.util.js';
import { generateUniqueSlug } from '../../utils/slug.util.js';
import APIFeatures            from '../../utils/apiFeatures.util.js';

class ProductService {
  async create(data) {
    const slug = data.slug || await generateUniqueSlug(Product, data.title);
    if (data.slug) {
      const exists = await Product.findOne({ slug: data.slug });
      if (exists) throw new ApiError(400, 'Slug already exists');
    }
    return Product.create({ ...data, slug, publishedAt: data.isPublished ? new Date() : null });
  }

  async getAll(query) {
    const features = new APIFeatures(Product.find().populate('category'), query)
      .search(['title', 'shortDescription'])
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const [products, total] = await Promise.all([
      features.query,
      Product.countDocuments(),
    ]);

    return { products, pagination: { ...features.pagination, total, pages: Math.ceil(total / features.pagination.limit) } };
  }

  async getBySlug(slug) {
    const product = await Product.findOne({ slug })
      .populate('category')
      .populate({ path: 'reviews', match: { isApproved: true }, populate: { path: 'customer', select: 'firstName lastName avatar' } });

    if (!product) throw new ApiError(404, 'Product not found');
    product.viewCount++;
    await product.save();
    return product;
  }

  async getById(id) {
    const product = await Product.findById(id).populate('category');
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
  }

  async update(id, data) {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');

    if (data.title && data.title !== product.title && !data.slug) {
      data.slug = await generateUniqueSlug(Product, data.title, id);
    }
    if (data.isPublished && !product.isPublished) data.publishedAt = new Date();

    Object.assign(product, data);
    return product.save();
  }

  async delete(id) {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    await product.deleteOne();
  }

  async getFeatured(limit = 8) {
    return Product.find({ isFeatured: true, isPublished: true }).populate('category').limit(limit).sort('-createdAt');
  }

  async getLatest(limit = 12) {
    return Product.find({ isPublished: true }).populate('category').limit(limit).sort('-createdAt');
  }
}

export default new ProductService();
`;

files['server/modules/product/product.controller.js'] = `
import ProductService from './product.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

class ProductController {
  create = asyncHandler(async (req, res) => {
    const product = await ProductService.create(req.body);
    res.status(201).json(new ApiResponse(201, product, 'Product created'));
  });

  getAll = asyncHandler(async (req, res) => {
    const result = await ProductService.getAll(req.query);
    res.json(new ApiResponse(200, result));
  });

  getBySlug = asyncHandler(async (req, res) => {
    const product = await ProductService.getBySlug(req.params.slug);
    res.json(new ApiResponse(200, product));
  });

  update = asyncHandler(async (req, res) => {
    const product = await ProductService.update(req.params.id, req.body);
    res.json(new ApiResponse(200, product, 'Product updated'));
  });

  delete = asyncHandler(async (req, res) => {
    await ProductService.delete(req.params.id);
    res.json(new ApiResponse(200, null, 'Product deleted'));
  });

  getFeatured = asyncHandler(async (req, res) => {
    const products = await ProductService.getFeatured(parseInt(req.query.limit) || 8);
    res.json(new ApiResponse(200, products));
  });

  getLatest = asyncHandler(async (req, res) => {
    const products = await ProductService.getLatest(parseInt(req.query.limit) || 12);
    res.json(new ApiResponse(200, products));
  });
}

export default new ProductController();
`;

files['server/modules/product/product.validation.js'] = `
import { body } from 'express-validator';

export const productValidation = {
  create: [
    body('title').notEmpty().withMessage('Title is required').isLength({ min: 3 }).withMessage('Min 3 characters'),
    body('basePrice').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Must be positive'),
    body('category').notEmpty().withMessage('Category is required').isMongoId().withMessage('Invalid category ID'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be positive integer'),
  ],
  update: [
    body('title').optional().isLength({ min: 3 }).withMessage('Min 3 characters'),
    body('basePrice').optional().isFloat({ min: 0 }).withMessage('Must be positive'),
    body('category').optional().isMongoId().withMessage('Invalid category ID'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be positive integer'),
  ],
};
`;

files['server/modules/product/product.routes.js'] = `
import express           from 'express';
import ProductController from './product.controller.js';
import { protect }       from '../../middlewares/auth.middleware.js';
import { checkPermission } from '../../middlewares/rbac.middleware.js';
import { productValidation } from './product.validation.js';
import { validate }          from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.get('/',          ProductController.getAll);
router.get('/featured',  ProductController.getFeatured);
router.get('/latest',    ProductController.getLatest);
router.get('/:slug',     ProductController.getBySlug);

router.post('/',   protect, checkPermission('product:create'), productValidation.create, validate, ProductController.create);
router.put('/:id', protect, checkPermission('product:update'), productValidation.update, validate, ProductController.update);
router.delete('/:id', protect, checkPermission('product:delete'), ProductController.delete);

export default router;
`;

// ----- CART MODULE -----

files['server/modules/cart/cart.model.js'] = `
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant:  { type: mongoose.Schema.Types.ObjectId },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price:    { type: Number, required: true },
});

const cartSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items:          [cartItemSchema],
  appliedCoupon:  { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  discount:       { type: Number, default: 0 },
}, { timestamps: true });

cartSchema.index({ user: 1 });

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});
cartSchema.virtual('total').get(function () {
  return this.subtotal - this.discount;
});

cartSchema.set('toJSON',   { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

export default mongoose.model('Cart', cartSchema);
`;

files['server/modules/cart/cart.service.js'] = `
import Cart    from './cart.model.js';
import Product from '../product/product.model.js';
import Coupon  from '../coupon/coupon.model.js';
import { ApiError } from '../../utils/ApiError.util.js';

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) cart = await Cart.create({ user: userId, items: [] });
    return cart;
  }

  async addItem(userId, { productId, variantId, quantity }) {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (!product.isInStock(quantity)) throw new ApiError(400, 'Insufficient stock');

    let price = product.basePrice;
    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) throw new ApiError(404, 'Variant not found');
      price = variant.price;
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && (!variantId || item.variant?.toString() === variantId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, variant: variantId, quantity, price });
    }

    return cart.save();
  }

  async updateItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.id(itemId);
    if (!item) throw new ApiError(404, 'Cart item not found');

    item.quantity = quantity;
    return cart.save();
  }

  async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    return cart.save();
  }

  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');
    cart.items         = [];
    cart.appliedCoupon = null;
    cart.discount      = 0;
    return cart.save();
  }

  async applyCoupon(userId, code) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) throw new ApiError(404, 'Coupon not found');

    const validity = coupon.isValid();
    if (!validity.valid) throw new ApiError(400, validity.message);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');

    const subtotal = cart.subtotal;
    if (subtotal < coupon.minPurchase)
      throw new ApiError(400, 'Minimum purchase of ' + coupon.minPurchase + ' required');

    cart.appliedCoupon = coupon._id;
    cart.discount      = coupon.calculateDiscount(subtotal);
    return cart.save();
  }
}

export default new CartService();
`;

files['server/modules/cart/cart.controller.js'] = `
import CartService  from './cart.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

class CartController {
  getCart = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart(req.user._id);
    res.json(new ApiResponse(200, cart));
  });

  addItem = asyncHandler(async (req, res) => {
    const cart = await CartService.addItem(req.user._id, req.body);
    res.status(201).json(new ApiResponse(201, cart, 'Item added to cart'));
  });

  updateItem = asyncHandler(async (req, res) => {
    const cart = await CartService.updateItem(req.user._id, req.params.itemId, req.body.quantity);
    res.json(new ApiResponse(200, cart, 'Cart updated'));
  });

  removeItem = asyncHandler(async (req, res) => {
    const cart = await CartService.removeItem(req.user._id, req.params.itemId);
    res.json(new ApiResponse(200, cart, 'Item removed'));
  });

  clearCart = asyncHandler(async (req, res) => {
    const cart = await CartService.clearCart(req.user._id);
    res.json(new ApiResponse(200, cart, 'Cart cleared'));
  });

  applyCoupon = asyncHandler(async (req, res) => {
    const cart = await CartService.applyCoupon(req.user._id, req.body.code);
    res.json(new ApiResponse(200, cart, 'Coupon applied'));
  });
}

export default new CartController();
`;

files['server/modules/cart/cart.routes.js'] = `
import express        from 'express';
import CartController from './cart.controller.js';
import { protect }    from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/',                    CartController.getCart);
router.post('/items',              CartController.addItem);
router.put('/items/:itemId',       CartController.updateItem);
router.delete('/items/:itemId',    CartController.removeItem);
router.delete('/',                 CartController.clearCart);
router.post('/apply-coupon',       CartController.applyCoupon);

export default router;
`;

// ----- WISHLIST MODULE -----

files['server/modules/wishlist/wishlist.model.js'] = `
import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

wishlistSchema.index({ user: 1 });

export default mongoose.model('Wishlist', wishlistSchema);
`;

files['server/modules/wishlist/wishlist.routes.js'] = `
import express  from 'express';
import { protect }  from '../../middlewares/auth.middleware.js';
import Wishlist      from './wishlist.model.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';
import { ApiError }     from '../../utils/ApiError.util.js';

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  let list = await Wishlist.findOne({ user: req.user._id }).populate('products');
  if (!list) list = await Wishlist.create({ user: req.user._id, products: [] });
  res.json(new ApiResponse(200, list));
}));

router.post('/:productId', asyncHandler(async (req, res) => {
  let list = await Wishlist.findOne({ user: req.user._id });
  if (!list) list = new Wishlist({ user: req.user._id, products: [] });

  const already = list.products.some((p) => p.toString() === req.params.productId);
  if (!already) list.products.push(req.params.productId);
  await list.save();
  res.json(new ApiResponse(200, list, 'Added to wishlist'));
}));

router.delete('/:productId', asyncHandler(async (req, res) => {
  const list = await Wishlist.findOne({ user: req.user._id });
  if (!list) throw new ApiError(404, 'Wishlist not found');
  list.products = list.products.filter((p) => p.toString() !== req.params.productId);
  await list.save();
  res.json(new ApiResponse(200, list, 'Removed from wishlist'));
}));

export default router;
`;

// ----- ORDER MODULE -----

files['server/modules/order/order.model.js'] = `
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title:    String,
  variant:  { sku: String, attributes: Map },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  total:    Number,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:       [orderItemSchema],
  subtotal:    { type: Number, required: true },
  discount:    { type: Number, default: 0 },
  shippingCost:{ type: Number, default: 0 },
  tax:         { type: Number, default: 0 },
  total:       { type: Number, required: true },
  shippingAddress: {
    fullName: String, phone: String, addressLine1: String,
    addressLine2: String, city: String, state: String,
    postalCode: String, country: String,
  },
  paymentMethod: { type: String, enum: ['COD', 'RAZORPAY', 'STRIPE'], default: 'COD' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  paymentDetails:{ transactionId: String, paidAt: Date },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
  },
  trackingNumber: String,
  carrier:        String,
  appliedCoupon:  { code: String, discount: Number },
  customerNote:   String,
  adminNote:      String,
  confirmedAt:    Date,
  shippedAt:      Date,
  deliveredAt:    Date,
  cancelledAt:    Date,
}, { timestamps: true });

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const ts  = Date.now().toString().slice(-8);
    const rnd = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = 'ORD-' + ts + '-' + rnd;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
`;

files['server/modules/order/order.service.js'] = `
import Order   from './order.model.js';
import Cart    from '../cart/cart.model.js';
import Product from '../product/product.model.js';
import { ApiError }    from '../../utils/ApiError.util.js';
import APIFeatures     from '../../utils/apiFeatures.util.js';

class OrderService {
  async create(userId, orderData) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty');

    const items = cart.items.map((item) => ({
      product:  item.product._id,
      title:    item.product.title,
      quantity: item.quantity,
      price:    item.price,
      total:    item.price * item.quantity,
    }));

    const subtotal = cart.subtotal;
    const total    = cart.total + (orderData.shippingCost || 0);

    const order = await Order.create({
      customer:        userId,
      items,
      subtotal,
      discount:        cart.discount,
      shippingCost:    orderData.shippingCost || 0,
      tax:             orderData.tax          || 0,
      total,
      shippingAddress: orderData.shippingAddress,
      paymentMethod:   orderData.paymentMethod || 'COD',
    });

    // Decrement stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
      });
    }

    // Clear cart
    cart.items         = [];
    cart.appliedCoupon = null;
    cart.discount      = 0;
    await cart.save();

    return order;
  }

  async getUserOrders(userId, query) {
    const features = new APIFeatures(Order.find({ customer: userId }), query)
      .filter().sort().paginate();
    const [orders, total] = await Promise.all([
      features.query.populate('items.product', 'title images'),
      Order.countDocuments({ customer: userId }),
    ]);
    return { orders, pagination: { ...features.pagination, total } };
  }

  async getById(id, userId, role) {
    const query = role === 'CUSTOMER' ? { _id: id, customer: userId } : { _id: id };
    const order = await Order.findOne(query).populate('customer', 'firstName lastName email').populate('items.product', 'title images');
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }

  async getAllOrders(query) {
    const features = new APIFeatures(Order.find(), query).filter().sort().paginate();
    const [orders, total] = await Promise.all([
      features.query.populate('customer', 'firstName lastName email'),
      Order.countDocuments(),
    ]);
    return { orders, pagination: { ...features.pagination, total } };
  }

  async updateStatus(id, status, adminNote) {
    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    const dateMap = {
      CONFIRMED:  'confirmedAt',
      SHIPPED:    'shippedAt',
      DELIVERED:  'deliveredAt',
      CANCELLED:  'cancelledAt',
    };

    order.status = status;
    if (dateMap[status]) order[dateMap[status]] = new Date();
    if (adminNote) order.adminNote = adminNote;

    return order.save();
  }
}

export default new OrderService();
`;

files['server/modules/order/order.controller.js'] = `
import OrderService from './order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

class OrderController {
  create = asyncHandler(async (req, res) => {
    const order = await OrderService.create(req.user._id, req.body);
    res.status(201).json(new ApiResponse(201, order, 'Order placed successfully'));
  });

  getMyOrders = asyncHandler(async (req, res) => {
    const result = await OrderService.getUserOrders(req.user._id, req.query);
    res.json(new ApiResponse(200, result));
  });

  getById = asyncHandler(async (req, res) => {
    const order = await OrderService.getById(req.params.id, req.user._id, req.user.role);
    res.json(new ApiResponse(200, order));
  });

  getAllOrders = asyncHandler(async (req, res) => {
    const result = await OrderService.getAllOrders(req.query);
    res.json(new ApiResponse(200, result));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateStatus(req.params.id, req.body.status, req.body.adminNote);
    res.json(new ApiResponse(200, order, 'Order status updated'));
  });
}

export default new OrderController();
`;

files['server/modules/order/order.routes.js'] = `
import express         from 'express';
import OrderController from './order.controller.js';
import { protect }     from '../../middlewares/auth.middleware.js';
import { authorize }   from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/',             OrderController.create);
router.get('/my-orders',     OrderController.getMyOrders);
router.get('/:id',           OrderController.getById);
router.get('/',              authorize('ADMIN', 'STAFF'), OrderController.getAllOrders);
router.put('/:id/status',    authorize('ADMIN', 'STAFF'), OrderController.updateStatus);

export default router;
`;

// ----- COUPON MODULE -----

files['server/modules/coupon/coupon.model.js'] = `
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:   String,
  discountType:  { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  discountValue: { type: Number, required: true },
  minPurchase:   { type: Number, default: 0 },
  maxDiscount:   Number,
  usageLimit:    { type: Number, default: null },
  usageCount:    { type: Number, default: 0 },
  perUserLimit:  { type: Number, default: 1 },
  startDate:     { type: Date, required: true },
  endDate:       { type: Date, required: true },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive)                              return { valid: false, message: 'Coupon inactive' };
  if (now < this.startDate)                        return { valid: false, message: 'Coupon not active yet' };
  if (now > this.endDate)                          return { valid: false, message: 'Coupon expired' };
  if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, message: 'Usage limit reached' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  if (this.discountType === 'PERCENTAGE') {
    const d = (subtotal * this.discountValue) / 100;
    return this.maxDiscount ? Math.min(d, this.maxDiscount) : d;
  }
  return this.discountValue;
};

export default mongoose.model('Coupon', couponSchema);
`;

files['server/modules/coupon/coupon.routes.js'] = `
import express   from 'express';
import { protect }   from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import Coupon        from './coupon.model.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';
import { ApiError }     from '../../utils/ApiError.util.js';

const router = express.Router();

// Validate coupon (public)
router.post('/validate', protect, asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.body.code?.toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  const result = coupon.isValid();
  if (!result.valid) throw new ApiError(400, result.message);
  res.json(new ApiResponse(200, { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minPurchase: coupon.minPurchase }, 'Coupon is valid'));
}));

// Admin routes
router.get('/',     protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json(new ApiResponse(200, coupons));
}));

router.post('/',    protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(new ApiResponse(201, coupon, 'Coupon created'));
}));

router.put('/:id',  protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json(new ApiResponse(200, coupon, 'Coupon updated'));
}));

router.delete('/:id', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json(new ApiResponse(200, null, 'Coupon deleted'));
}));

export default router;
`;

// ----- REVIEW MODULE -----

files['server/modules/review/review.model.js'] = `
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product:            { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  order:              { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating:             { type: Number, required: true, min: 1, max: 5 },
  title:              { type: String, trim: true },
  comment:            { type: String, required: true, trim: true },
  images:             [String],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved:         { type: Boolean, default: false },
  adminReply:         { comment: String, repliedAt: Date },
  helpfulCount:       { type: Number,  default: 0 },
}, { timestamps: true });

reviewSchema.index({ product: 1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
`;

files['server/modules/review/review.routes.js'] = `
import express   from 'express';
import { protect }   from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import Review        from './review.model.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';
import { ApiError }     from '../../utils/ApiError.util.js';

const router = express.Router();

// Get approved reviews for a product
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('customer', 'firstName lastName avatar')
    .sort('-createdAt');
  res.json(new ApiResponse(200, reviews));
}));

// Create review
router.post('/', protect, asyncHandler(async (req, res) => {
  const review = await Review.create({ ...req.body, customer: req.user._id });
  res.status(201).json(new ApiResponse(201, review, 'Review submitted, pending approval'));
}));

// Admin: get all reviews
router.get('/', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('customer', 'firstName lastName')
    .populate('product', 'title')
    .sort('-createdAt');
  res.json(new ApiResponse(200, reviews));
}));

// Admin: approve review
router.put('/:id/approve', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  if (!review) throw new ApiError(404, 'Review not found');
  res.json(new ApiResponse(200, review, 'Review approved'));
}));

// Admin: reply to review
router.put('/:id/reply', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { adminReply: { comment: req.body.comment, repliedAt: new Date() } },
    { new: true }
  );
  if (!review) throw new ApiError(404, 'Review not found');
  res.json(new ApiResponse(200, review, 'Reply added'));
}));

// Delete review
router.delete('/:id', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  res.json(new ApiResponse(200, null, 'Review deleted'));
}));

export default router;
`;

// ----- ADMIN MODULE -----

files['server/modules/admin/admin.routes.js'] = `
import express   from 'express';
import { protect }   from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';
import User    from '../user/user.model.js';
import Product from '../product/product.model.js';
import Order   from '../order/order.model.js';

const router = express.Router();
router.use(protect, authorize('ADMIN', 'STAFF'));

// Dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, revenueData] = await Promise.all([
    User.countDocuments({ role: 'CUSTOMER' }),
    Product.countDocuments({ isPublished: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  const recentOrders = await Order.find()
    .populate('customer', 'firstName lastName email')
    .sort('-createdAt')
    .limit(5);

  res.json(new ApiResponse(200, { totalUsers, totalProducts, totalOrders, totalRevenue, recentOrders }));
}));

// Revenue analytics
router.get('/revenue', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const days  = parseInt(period);
  const start = new Date();
  start.setDate(start.getDate() - days);

  const revenue = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, paymentStatus: 'PAID' } },
    {
      $group: {
        _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(new ApiResponse(200, revenue));
}));

// Order status breakdown
router.get('/orders/stats', asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  res.json(new ApiResponse(200, stats));
}));

export default router;
`;

// ----- HOMEPAGE MODULE -----

files['server/modules/homepage/homepage.model.js'] = `
import mongoose from 'mongoose';

const homepageConfigSchema = new mongoose.Schema({
  sections: [{
    type: {
      type: String,
      enum: ['BANNER','FEATURED_PRODUCTS','LATEST_PRODUCTS','TESTIMONIALS','GALLERY','VIDEO','CATEGORIES'],
      required: true,
    },
    enabled: { type: Boolean, default: true },
    order:   { type: Number,  required: true },
    config:  mongoose.Schema.Types.Mixed,
  }],
}, { timestamps: true });

homepageConfigSchema.statics.getConfig = async function () {
  let cfg = await this.findOne();
  if (!cfg) cfg = await this.create({ sections: [] });
  return cfg;
};

export default mongoose.model('HomepageConfig', homepageConfigSchema);
`;

files['server/modules/homepage/homepage.routes.js'] = `
import express   from 'express';
import { protect }   from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import HomepageConfig from './homepage.model.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const config = await HomepageConfig.getConfig();
  res.json(new ApiResponse(200, config));
}));

router.put('/', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  let config = await HomepageConfig.findOne();
  if (!config) config = new HomepageConfig({});
  config.sections = req.body.sections;
  await config.save();
  res.json(new ApiResponse(200, config, 'Homepage updated'));
}));

export default router;
`;

// ----- THEME MODULE -----

files['server/modules/theme/theme.model.js'] = `
import mongoose from 'mongoose';

const themeConfigSchema = new mongoose.Schema({
  colors: {
    primary:    { type: String, default: '#3B82F6' },
    secondary:  { type: String, default: '#10B981' },
    accent:     { type: String, default: '#F59E0B' },
    background: { type: String, default: '#FFFFFF' },
    text:       { type: String, default: '#1F2937' },
  },
  fonts: {
    primary:   { type: String, default: 'Inter' },
    secondary: { type: String, default: 'Roboto' },
  },
  layout: {
    headerStyle: { type: String, enum: ['CLASSIC', 'MODERN', 'MINIMAL'], default: 'MODERN' },
    footerStyle: { type: String, enum: ['SIMPLE', 'DETAILED'],           default: 'DETAILED' },
  },
  logo: { main: String, favicon: String },
}, { timestamps: true });

themeConfigSchema.statics.getConfig = async function () {
  let cfg = await this.findOne();
  if (!cfg) cfg = await this.create({});
  return cfg;
};

export default mongoose.model('ThemeConfig', themeConfigSchema);
`;

files['server/modules/theme/theme.routes.js'] = `
import express   from 'express';
import { protect }   from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import ThemeConfig   from './theme.model.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const config = await ThemeConfig.getConfig();
  res.json(new ApiResponse(200, config));
}));

router.put('/', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  let config = await ThemeConfig.findOne();
  if (!config) config = new ThemeConfig({});
  Object.assign(config, req.body);
  await config.save();
  res.json(new ApiResponse(200, config, 'Theme updated'));
}));

export default router;
`;

// ----- MAIN APP FILES -----

files['server/app.js'] = `
import express          from 'express';
import cors             from 'cors';
import helmet           from 'helmet';
import mongoSanitize    from 'express-mongo-sanitize';
import rateLimit        from 'express-rate-limit';
import cookieParser     from 'cookie-parser';
import morgan           from 'morgan';
import path             from 'path';
import { fileURLToPath } from 'url';

import authRoutes     from './modules/auth/auth.routes.js';
import userRoutes     from './modules/user/user.routes.js';
import productRoutes  from './modules/product/product.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import orderRoutes    from './modules/order/order.routes.js';
import cartRoutes     from './modules/cart/cart.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import couponRoutes   from './modules/coupon/coupon.routes.js';
import reviewRoutes   from './modules/review/review.routes.js';
import adminRoutes    from './modules/admin/admin.routes.js';
import homepageRoutes from './modules/homepage/homepage.routes.js';
import themeRoutes    from './modules/theme/theme.routes.js';

import { errorHandler, notFound } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// Security
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  'Too many requests, please try again later',
}));

// CORS
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons',  couponRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/theme',    themeRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
`;

files['server/server.js'] = `
import 'dotenv/config';
import app       from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

connectDB();

const server = app.listen(PORT, () => {
  console.log('');
  console.log('  🚀 Server running!');
  console.log('  📡 Port : ' + PORT);
  console.log('  🌍 URL  : http://localhost:' + PORT);
  console.log('  🏥 Health: http://localhost:' + PORT + '/api/health');
  console.log('');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});
`;

files['server/.env.example'] = `
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/ecommerce

JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_characters_long_change_this
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters_long_change_this
JWT_REFRESH_EXPIRE=7d

CLIENT_URL=http://localhost:3000

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
`;

files['server/package.json'] = `
{
  "name": "ecommerce-backend",
  "version": "1.0.0",
  "description": "Production-grade ecommerce backend",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
`;

// ============================================
// CLIENT FILES
// ============================================

files['client/package.json'] = `
{
  "name": "ecommerce-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^2.0.1",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18",
    "react-redux": "^9.0.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
`;

files['client/.env.local.example'] = `
NEXT_PUBLIC_API_URL=http://localhost:5000/api
`;

files['client/tailwind.config.ts'] = `
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        accent:    'var(--accent-color)',
      },
    },
  },
  plugins: [],
};
export default config;
`;

files['client/next.config.js'] = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
`;

files['client/lib/api-client.ts'] = `
import axios from 'axios';

const apiClient = axios.create({
  baseURL:         process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/auth/refresh',
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = 'Bearer ' + data.data.accessToken;
        return apiClient(original);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
`;

files['client/lib/store.ts'] = `
import { configureStore } from '@reduxjs/toolkit';
import authReducer    from '@/features/auth/authSlice';
import cartReducer    from '@/features/cart/cartSlice';
import productReducer from '@/features/product/productSlice';

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    cart:     cartReducer,
    products: productReducer,
  },
});

export type RootState  = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`;

files['client/lib/hooks.ts'] = `
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
`;

files['client/features/auth/authSlice.ts'] = `
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

interface User {
  id: string; firstName: string; lastName: string; email: string; role: string;
}
interface AuthState {
  user: User | null; isAuthenticated: boolean; loading: boolean; error: string | null;
}

const initialState: AuthState = { user: null, isAuthenticated: false, loading: false, error: null };

export const login = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post('/auth/login', credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data.user;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData: any, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post('/auth/register', userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data.user;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Registration failed');
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true; s.user = a.payload; })
      .addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(register.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true; s.user = a.payload; })
      .addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(fetchCurrentUser.fulfilled, (s, a) => { s.isAuthenticated = true; s.user = a.payload; })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
`;

files['client/features/cart/cartSlice.ts'] = `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

interface CartItem {
  _id: string; product: any; quantity: number; price: number;
}
interface CartState {
  items: CartItem[]; subtotal: number; total: number; discount: number; loading: boolean; error: string | null;
}

const initialState: CartState = { items: [], subtotal: 0, total: 0, discount: 0, loading: false, error: null };

export const fetchCart     = createAsyncThunk('cart/fetch',   async () => { const { data } = await apiClient.get('/cart'); return data.data; });
export const addToCart     = createAsyncThunk('cart/add',     async (item: any)   => { const { data } = await apiClient.post('/cart/items', item); return data.data; });
export const removeFromCart = createAsyncThunk('cart/remove', async (itemId: string) => { const { data } = await apiClient.delete('/cart/items/' + itemId); return data.data; });
export const clearCart     = createAsyncThunk('cart/clear',   async () => { const { data } = await apiClient.delete('/cart'); return data.data; });

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const setCart = (state: CartState, action: any) => {
      const cart     = action.payload;
      state.items    = cart.items    || [];
      state.subtotal = cart.subtotal || 0;
      state.total    = cart.total    || 0;
      state.discount = cart.discount || 0;
      state.loading  = false;
    };
    builder
      .addCase(fetchCart.pending,      (s) => { s.loading = true; })
      .addCase(fetchCart.fulfilled,    setCart)
      .addCase(addToCart.fulfilled,    setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(clearCart.fulfilled,    setCart);
  },
});

export default cartSlice.reducer;
`;

files['client/features/product/productSlice.ts'] = `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

interface ProductState {
  products: any[]; product: any | null; featured: any[];
  pagination: any; loading: boolean; error: string | null;
}

const initialState: ProductState = { products: [], product: null, featured: [], pagination: {}, loading: false, error: null };

export const fetchProducts  = createAsyncThunk('product/fetchAll',      async (query?: any)   => { const { data } = await apiClient.get('/products', { params: query }); return data.data; });
export const fetchProduct   = createAsyncThunk('product/fetchOne',      async (slug: string)   => { const { data } = await apiClient.get('/products/' + slug); return data.data; });
export const fetchFeatured  = createAsyncThunk('product/fetchFeatured', async ()               => { const { data } = await apiClient.get('/products/featured'); return data.data; });

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (s) => { s.loading = true; })
      .addCase(fetchProducts.fulfilled, (s, a) => { s.loading = false; s.products = a.payload.products; s.pagination = a.payload.pagination; })
      .addCase(fetchProducts.rejected,  (s, a) => { s.loading = false; s.error = a.error.message || null; })
      .addCase(fetchProduct.fulfilled,  (s, a) => { s.product = a.payload; })
      .addCase(fetchFeatured.fulfilled, (s, a) => { s.featured = a.payload; });
  },
});

export default productSlice.reducer;
`;

files['client/app/layout.tsx'] = `
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:       'Ecommerce Store',
  description: 'Your one-stop shop for everything',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;

files['client/app/globals.css'] = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-color:   #3B82F6;
  --secondary-color: #10B981;
  --accent-color:    #F59E0B;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
`;

files['client/app/providers.tsx'] = `
'use client';
import { Provider } from 'react-redux';
import { store }    from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
`;

files['client/app/(storefront)/layout.tsx'] = `
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
`;

files['client/app/(storefront)/page.tsx'] = `
import HeroBanner       from '@/components/storefront/HeroBanner';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';

export default function HomePage() {
  return (
    <div>
      <HeroBanner />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <FeaturedProducts />
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/products/page.tsx'] = `
'use client';
import { useEffect }        from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchProducts }    from '@/features/product/productSlice';
import ProductCard          from '@/components/storefront/ProductCard';

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const { products, loading } = useAppSelector((s) => s.products);

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-72" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/cart/page.tsx'] = `
'use client';
import { useEffect }  from 'react';
import Link           from 'next/link';
import { Trash2 }     from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchCart, removeFromCart } from '@/features/cart/cartSlice';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, subtotal, total, discount } = useAppSelector((s) => s.cart);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  if (items.length === 0)
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/products" className="inline-block mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Continue Shopping
        </Link>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: any) => (
            <div key={item._id} className="flex gap-4 bg-white p-4 rounded-lg shadow-sm">
              <img src={item.product?.images?.[0]?.url || '/placeholder.png'} alt={item.product?.title} className="w-24 h-24 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.product?.title}</h3>
                <p className="text-gray-600">₹{item.price}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <button onClick={() => dispatch(removeFromCart(item._id))} className="text-red-500 hover:text-red-700">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discount}</span></div>}
            <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Total</span><span>₹{total}</span></div>
          </div>
          <Link href="/checkout" className="mt-6 block text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/layout.tsx'] = `
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader  from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface Stats { totalRevenue: number; totalOrders: number; totalUsers: number; totalProducts: number; recentOrders: any[]; }

export default function DashboardPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-lg" /><div className="h-64 bg-gray-200 rounded-lg" /></div>;

  const cards = [
    { title: 'Total Revenue',  value: '₹' + (stats?.totalRevenue || 0).toLocaleString(), icon: <DollarSign />, color: 'bg-blue-500'   },
    { title: 'Total Orders',   value: stats?.totalOrders   || 0,                          icon: <ShoppingBag />, color: 'bg-green-500'  },
    { title: 'Total Customers',value: stats?.totalUsers    || 0,                          icon: <Users />,       color: 'bg-yellow-500' },
    { title: 'Total Products', value: stats?.totalProducts || 0,                          icon: <Package />,     color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={'p-3 rounded-full text-white ' + card.color}>{card.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3">Order #</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map((order) => (
                <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="py-3">{order.customer?.firstName} {order.customer?.lastName}</td>
                  <td className="py-3 font-semibold">₹{order.total?.toLocaleString()}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

files['client/components/storefront/Header.tsx'] = `
'use client';
import Link          from 'next/link';
import { ShoppingCart, Heart, User, Menu } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';

export default function Header() {
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const user      = useAppSelector((s) => s.auth.user);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-bold text-blue-600">ShopMERN</Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/"          className="hover:text-blue-600 transition">Home</Link>
          <Link href="/products"  className="hover:text-blue-600 transition">Products</Link>
          <Link href="/categories"className="hover:text-blue-600 transition">Categories</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/wishlist" className="p-2 hover:text-blue-600 transition relative">
            <Heart size={22} />
          </Link>
          <Link href="/cart" className="p-2 hover:text-blue-600 transition relative">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </Link>
          {user ? (
            <Link href="/account" className="p-2 hover:text-blue-600 transition"><User size={22} /></Link>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
`;

files['client/components/storefront/Footer.tsx'] = `
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-xl mb-4">ShopMERN</h3>
          <p className="text-sm text-gray-400">Your one-stop shop for everything you need.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/"          className="hover:text-white transition">Home</Link></li>
            <li><Link href="/products"  className="hover:text-white transition">Products</Link></li>
            <li><Link href="/cart"      className="hover:text-white transition">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login"     className="hover:text-white transition">Login</Link></li>
            <li><Link href="/register"  className="hover:text-white transition">Register</Link></li>
            <li><Link href="/account"   className="hover:text-white transition">My Orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <p className="text-sm text-gray-400">support@shopmern.com</p>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ShopMERN. All rights reserved.
      </div>
    </footer>
  );
}
`;

files['client/components/storefront/ProductCard.tsx'] = `
'use client';
import Image            from 'next/image';
import Link             from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useAppDispatch }      from '@/lib/hooks';
import { addToCart }           from '@/features/cart/cartSlice';

interface Props {
  product: { _id: string; title: string; slug: string; basePrice: number; comparePrice?: number; images: { url: string; alt?: string }[]; isFeatured?: boolean; };
}

export default function ProductCard({ product }: Props) {
  const dispatch = useAppDispatch();
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border">
      {discount > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">-{discount}%</span>
      )}
      <button className="absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow hover:bg-gray-100 transition">
        <Heart size={16} />
      </button>

      <Link href={'/products/' + product.slug}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images?.[0] ? (
            <Image src={product.images[0].url} alt={product.images[0].alt || product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">No Image</div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate text-sm">{product.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">₹{product.basePrice.toLocaleString()}</span>
            {product.comparePrice && (
              <span className="text-sm text-gray-400 line-through">₹{product.comparePrice.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={() => dispatch(addToCart({ productId: product._id, quantity: 1 }))}
          className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
`;

files['client/components/storefront/HeroBanner.tsx'] = `
export default function HeroBanner() {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
          Shop the Best<br />
          <span className="text-yellow-300">Deals Online</span>
        </h1>
        <p className="text-lg text-blue-100 max-w-xl">
          Discover thousands of products at unbeatable prices. Free shipping on orders over ₹999.
        </p>
        <div className="flex gap-4">
          <a href="/products"   className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-full hover:bg-blue-50 transition">Shop Now</a>
          <a href="/categories" className="px-8 py-3 border border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-700 transition">Browse Categories</a>
        </div>
      </div>
    </section>
  );
}
`;

files['client/components/storefront/FeaturedProducts.tsx'] = `
'use client';
import { useEffect }   from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchFeatured }                  from '@/features/product/productSlice';
import ProductCard                        from './ProductCard';

export default function FeaturedProducts() {
  const dispatch          = useAppDispatch();
  const { featured, loading } = useAppSelector((s) => s.products);

  useEffect(() => { dispatch(fetchFeatured()); }, [dispatch]);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />;
  if (!featured.length) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {featured.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
`;

files['client/components/admin/AdminSidebar.tsx'] = `
'use client';
import Link           from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FolderOpen, ShoppingBag, Users, Tag, Star, Settings, Palette, Home } from 'lucide-react';

const links = [
  { href: '/dashboard',          icon: <LayoutDashboard size={18} />, label: 'Dashboard'  },
  { href: '/dashboard/products', icon: <Package         size={18} />, label: 'Products'   },
  { href: '/dashboard/categories',icon: <FolderOpen     size={18} />, label: 'Categories' },
  { href: '/dashboard/orders',   icon: <ShoppingBag     size={18} />, label: 'Orders'     },
  { href: '/dashboard/users',    icon: <Users            size={18} />, label: 'Users'      },
  { href: '/dashboard/coupons',  icon: <Tag              size={18} />, label: 'Coupons'    },
  { href: '/dashboard/reviews',  icon: <Star             size={18} />, label: 'Reviews'    },
  { href: '/dashboard/homepage', icon: <Home             size={18} />, label: 'Homepage'   },
  { href: '/dashboard/theme',    icon: <Palette          size={18} />, label: 'Theme'      },
  { href: '/dashboard/settings', icon: <Settings         size={18} />, label: 'Settings'   },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <span className="text-xl font-bold text-blue-400">ShopMERN Admin</span>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={'flex items-center gap-3 px-6 py-3 text-sm transition ' + (active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-gray-700">
        <Link href="/" className="text-xs text-gray-500 hover:text-white transition">← Back to Store</Link>
      </div>
    </aside>
  );
}
`;

files['client/components/admin/AdminHeader.tsx'] = `
'use client';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout }                          from '@/features/auth/authSlice';
import { LogOut, Bell }                    from 'lucide-react';

export default function AdminHeader() {
  const dispatch = useAppDispatch();
  const user     = useAppSelector((s) => s.auth.user);

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-700">Admin Panel</h2>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Bell size={20} className="text-gray-600" />
        </button>
        <div className="text-sm text-gray-700">
          Hello, <span className="font-semibold">{user?.firstName}</span>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
`;

files['client/app/(storefront)/login/page.tsx'] = `
'use client';
import { useState }    from 'react';
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { login }       from '@/features/auth/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      router.push(result.payload.role === 'ADMIN' ? '/dashboard' : '/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/register/page.tsx'] = `
'use client';
import { useState }  from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { register }  from '@/features/auth/authSlice';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min 8 chars, uppercase, number" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
`;

// ============================================
// WRITE ALL FILES
// ============================================

let created = 0;
let skipped = 0;

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(filePath);
  const dir      = path.dirname(fullPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Skip if file already exists and has content
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 10) {
    console.log('⏭️  SKIP (exists): ' + filePath);
    skipped++;
    continue;
  }

  fs.writeFileSync(fullPath, content.trimStart(), 'utf8');
  console.log('✅ CREATED: ' + filePath);
  created++;
}

console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY');
console.log('='.repeat(50));
console.log('✅ Created : ' + created + ' files');
console.log('⏭️  Skipped : ' + skipped + ' files');
console.log('='.repeat(50));
console.log('\n🎉 Project files generated!\n');
console.log('📋 NEXT STEPS:');
console.log('');
console.log('  1. Setup backend:');
console.log('     cd server');
console.log('     npm install');
console.log('     copy .env.example .env');
console.log('     (Edit .env with your MongoDB URI and JWT secrets)');
console.log('     npm run dev');
console.log('');
console.log('  2. Setup frontend (new terminal):');
console.log('     cd client');
console.log('     npm install');
console.log('     copy .env.local.example .env.local');
console.log('     npm run dev');
console.log('');
console.log('  3. Open browser:');
console.log('     🛍️  Storefront : http://localhost:3000');
console.log('     ⚙️  Admin Panel: http://localhost:3000/dashboard');
console.log('     🔌 API Health  : http://localhost:5000/api/health');
console.log('');