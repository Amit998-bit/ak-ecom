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
