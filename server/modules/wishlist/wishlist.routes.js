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
