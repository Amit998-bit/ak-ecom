import Order   from './order.model.js';
import Cart    from '../cart/cart.model.js';
import Product from '../product/product.model.js';
import { ApiError }    from '../../utils/ApiError.util.js';
import APIFeatures     from '../../utils/apiFeatures.util.js';

class OrderService {
  async create(userId, orderData) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty');

    const items = cart.items.map((item) => ({
      product:  item.product._id,
      title:    item.product.title,
      quantity: item.quantity,
      price:    item.price,
      total:    item.price * item.quantity,
    }));

    const subtotal = cart.subtotal;
    const total    = cart.total + (orderData.shippingCost || 0);

    const order = await Order.create({
      customer:        userId,
      items,
      subtotal,
      discount:        cart.discount,
      shippingCost:    orderData.shippingCost || 0,
      tax:             orderData.tax          || 0,
      total,
      shippingAddress: orderData.shippingAddress,
      paymentMethod:   orderData.paymentMethod || 'COD',
    });

    // Decrement stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
      });
    }

    // Clear cart
    cart.items         = [];
    cart.appliedCoupon = null;
    cart.discount      = 0;
    await cart.save();

    return order;
  }

  async getUserOrders(userId, query) {
    const features = new APIFeatures(Order.find({ customer: userId }), query)
      .filter().sort().paginate();
    const [orders, total] = await Promise.all([
      features.query.populate('items.product', 'title images'),
      Order.countDocuments({ customer: userId }),
    ]);
    return { orders, pagination: { ...features.pagination, total } };
  }

  async getById(id, userId, role) {
    const query = role === 'CUSTOMER' ? { _id: id, customer: userId } : { _id: id };
    const order = await Order.findOne(query).populate('customer', 'firstName lastName email').populate('items.product', 'title images');
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }

  async getAllOrders(query) {
    const features = new APIFeatures(Order.find(), query).filter().sort().paginate();
    const [orders, total] = await Promise.all([
      features.query.populate('customer', 'firstName lastName email'),
      Order.countDocuments(),
    ]);
    return { orders, pagination: { ...features.pagination, total } };
  }

  async updateStatus(id, status, adminNote) {
    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    const dateMap = {
      CONFIRMED:  'confirmedAt',
      SHIPPED:    'shippedAt',
      DELIVERED:  'deliveredAt',
      CANCELLED:  'cancelledAt',
    };

    order.status = status;
    if (dateMap[status]) order[dateMap[status]] = new Date();
    if (adminNote) order.adminNote = adminNote;

    return order.save();
  }
}

export default new OrderService();
