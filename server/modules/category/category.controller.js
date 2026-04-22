import CategoryService from './category.service.js';
import { asyncHandler }  from '../../utils/asyncHandler.util.js';
import ApiResponse       from '../../utils/ApiResponse.util.js';

class CategoryController {
  create = asyncHandler(async (req, res) => {
    const cat = await CategoryService.create(req.body);
    res.status(201).json(new ApiResponse(201, cat, 'Category created'));
  });

  getAll = asyncHandler(async (req, res) => {
    const cats = await CategoryService.getAll();
    res.json(new ApiResponse(200, cats));
  });

  getBySlug = asyncHandler(async (req, res) => {
    const cat = await CategoryService.getBySlug(req.params.slug);
    res.json(new ApiResponse(200, cat));
  });

  update = asyncHandler(async (req, res) => {
    const cat = await CategoryService.update(req.params.id, req.body);
    res.json(new ApiResponse(200, cat, 'Category updated'));
  });

  delete = asyncHandler(async (req, res) => {
    await CategoryService.delete(req.params.id);
    res.json(new ApiResponse(200, null, 'Category deleted'));
  });
}

export default new CategoryController();
