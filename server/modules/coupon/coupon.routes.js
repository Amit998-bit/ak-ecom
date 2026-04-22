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
