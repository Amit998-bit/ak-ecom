import CartService  from './cart.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

class CartController {
  getCart = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart(req.user._id);
    res.json(new ApiResponse(200, cart));
  });

  addItem = asyncHandler(async (req, res) => {
    const cart = await CartService.addItem(req.user._id, req.body);
    res.status(201).json(new ApiResponse(201, cart, 'Item added to cart'));
  });

  updateItem = asyncHandler(async (req, res) => {
    const cart = await CartService.updateItem(req.user._id, req.params.itemId, req.body.quantity);
    res.json(new ApiResponse(200, cart, 'Cart updated'));
  });

  removeItem = asyncHandler(async (req, res) => {
    const cart = await CartService.removeItem(req.user._id, req.params.itemId);
    res.json(new ApiResponse(200, cart, 'Item removed'));
  });

  clearCart = asyncHandler(async (req, res) => {
    const cart = await CartService.clearCart(req.user._id);
    res.json(new ApiResponse(200, cart, 'Cart cleared'));
  });

  applyCoupon = asyncHandler(async (req, res) => {
    const cart = await CartService.applyCoupon(req.user._id, req.body.code);
    res.json(new ApiResponse(200, cart, 'Coupon applied'));
  });
}

export default new CartController();
