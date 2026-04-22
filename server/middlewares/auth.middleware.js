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
