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
  max:      10000000,
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
