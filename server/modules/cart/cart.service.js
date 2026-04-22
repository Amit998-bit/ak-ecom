import Cart    from './cart.model.js';
import Product from '../product/product.model.js';
import Coupon  from '../coupon/coupon.model.js';
import { ApiError } from '../../utils/ApiError.util.js';

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) cart = await Cart.create({ user: userId, items: [] });
    return cart;
  }

  async addItem(userId, { productId, variantId, quantity }) {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (!product.isInStock(quantity)) throw new ApiError(400, 'Insufficient stock');

    let price = product.basePrice;
    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) throw new ApiError(404, 'Variant not found');
      price = variant.price;
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && (!variantId || item.variant?.toString() === variantId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, variant: variantId, quantity, price });
    }

    return cart.save();
  }

  async updateItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.id(itemId);
    if (!item) throw new ApiError(404, 'Cart item not found');

    item.quantity = quantity;
    return cart.save();
  }

  async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    return cart.save();
  }

  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');
    cart.items         = [];
    cart.appliedCoupon = null;
    cart.discount      = 0;
    return cart.save();
  }

  async applyCoupon(userId, code) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) throw new ApiError(404, 'Coupon not found');

    const validity = coupon.isValid();
    if (!validity.valid) throw new ApiError(400, validity.message);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');

    const subtotal = cart.subtotal;
    if (subtotal < coupon.minPurchase)
      throw new ApiError(400, 'Minimum purchase of ' + coupon.minPurchase + ' required');

    cart.appliedCoupon = coupon._id;
    cart.discount      = coupon.calculateDiscount(subtotal);
    return cart.save();
  }
}

export default new CartService();
