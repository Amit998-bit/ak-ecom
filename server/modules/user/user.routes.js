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
