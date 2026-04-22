import Category  from './category.model.js';
import { ApiError }          from '../../utils/ApiError.util.js';
import { generateUniqueSlug } from '../../utils/slug.util.js';

class CategoryService {
  async create(data) {
    const slug = data.slug || await generateUniqueSlug(Category, data.name);
    return Category.create({ ...data, slug });
  }

  async getAll() {
    return Category.find({ isActive: true }).populate('children').sort('order');
  }

  async getBySlug(slug) {
    const cat = await Category.findOne({ slug }).populate('parent').populate('children');
    if (!cat) throw new ApiError(404, 'Category not found');
    return cat;
  }

  async update(id, data) {
    if (data.name && !data.slug) {
      data.slug = await generateUniqueSlug(Category, data.name, id);
    }
    const cat = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!cat) throw new ApiError(404, 'Category not found');
    return cat;
  }

  async delete(id) {
    const cat = await Category.findById(id);
    if (!cat) throw new ApiError(404, 'Category not found');
    await Category.updateMany({ parent: id }, { parent: null });
    await cat.deleteOne();
  }
}

export default new CategoryService();
