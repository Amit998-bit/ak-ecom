import express        from 'express';
import CartController from './cart.controller.js';
import { protect }    from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/',                    CartController.getCart);
router.post('/items',              CartController.addItem);
router.put('/items/:itemId',       CartController.updateItem);
router.delete('/items/:itemId',    CartController.removeItem);
router.delete('/',                 CartController.clearCart);
router.post('/apply-coupon',       CartController.applyCoupon);

export default router;
