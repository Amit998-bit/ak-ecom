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
