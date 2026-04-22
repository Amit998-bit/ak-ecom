import express           from 'express';
import ProductController from './product.controller.js';
import { protect }       from '../../middlewares/auth.middleware.js';
import { checkPermission } from '../../middlewares/rbac.middleware.js';
import { productValidation } from './product.validation.js';
import { validate }          from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.get('/',          ProductController.getAll);
router.get('/featured',  ProductController.getFeatured);
router.get('/latest',    ProductController.getLatest);
router.get('/:slug',     ProductController.getBySlug);

router.post('/',   protect, checkPermission('product:create'), productValidation.create, validate, ProductController.create);
router.put('/:id', protect, checkPermission('product:update'), productValidation.update, validate, ProductController.update);
router.delete('/:id', protect, checkPermission('product:delete'), ProductController.delete);

export default router;
