import OrderService from './order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

class OrderController {
  create = asyncHandler(async (req, res) => {
    const order = await OrderService.create(req.user._id, req.body);
    res.status(201).json(new ApiResponse(201, order, 'Order placed successfully'));
  });

  getMyOrders = asyncHandler(async (req, res) => {
    const result = await OrderService.getUserOrders(req.user._id, req.query);
    res.json(new ApiResponse(200, result));
  });

  getById = asyncHandler(async (req, res) => {
    const order = await OrderService.getById(req.params.id, req.user._id, req.user.role);
    res.json(new ApiResponse(200, order));
  });

  getAllOrders = asyncHandler(async (req, res) => {
    const result = await OrderService.getAllOrders(req.query);
    res.json(new ApiResponse(200, result));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateStatus(req.params.id, req.body.status, req.body.adminNote);
    res.json(new ApiResponse(200, order, 'Order status updated'));
  });
}

export default new OrderController();
