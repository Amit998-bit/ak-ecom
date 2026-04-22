import express         from 'express';
import OrderController from './order.controller.js';
import { protect }     from '../../middlewares/auth.middleware.js';
import { authorize }   from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/',             OrderController.create);
router.get('/my-orders',     OrderController.getMyOrders);
router.get('/:id',           OrderController.getById);
router.get('/',              authorize('ADMIN', 'STAFF'), OrderController.getAllOrders);
router.put('/:id/status',    authorize('ADMIN', 'STAFF'), OrderController.updateStatus);

export default router;
