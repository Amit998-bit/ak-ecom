import express            from 'express';
import CategoryController from './category.controller.js';
import { protect }        from '../../middlewares/auth.middleware.js';
import { authorize }      from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.get('/',      CategoryController.getAll);
router.get('/:slug', CategoryController.getBySlug);
router.post('/',     protect, authorize('ADMIN'), CategoryController.create);
router.put('/:id',   protect, authorize('ADMIN'), CategoryController.update);
router.delete('/:id',protect, authorize('ADMIN'), CategoryController.delete);

export default router;
