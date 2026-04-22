import ProductService from './product.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

class ProductController {
  create = asyncHandler(async (req, res) => {
    const product = await ProductService.create(req.body);
    res.status(201).json(new ApiResponse(201, product, 'Product created'));
  });

  getAll = asyncHandler(async (req, res) => {
    const result = await ProductService.getAll(req.query);
    res.json(new ApiResponse(200, result));
  });

  getBySlug = asyncHandler(async (req, res) => {
    const product = await ProductService.getBySlug(req.params.slug);
    res.json(new ApiResponse(200, product));
  });

  update = asyncHandler(async (req, res) => {
    const product = await ProductService.update(req.params.id, req.body);
    res.json(new ApiResponse(200, product, 'Product updated'));
  });

  delete = asyncHandler(async (req, res) => {
    await ProductService.delete(req.params.id);
    res.json(new ApiResponse(200, null, 'Product deleted'));
  });

  getFeatured = asyncHandler(async (req, res) => {
    const products = await ProductService.getFeatured(parseInt(req.query.limit) || 8);
    res.json(new ApiResponse(200, products));
  });

  getLatest = asyncHandler(async (req, res) => {
    const products = await ProductService.getLatest(parseInt(req.query.limit) || 12);
    res.json(new ApiResponse(200, products));
  });
}

export default new ProductController();
