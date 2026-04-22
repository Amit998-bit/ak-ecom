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
