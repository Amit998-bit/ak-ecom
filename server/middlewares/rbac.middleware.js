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
