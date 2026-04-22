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
