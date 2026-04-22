import Product  from './product.model.js';
import { ApiError }           from '../../utils/ApiError.util.js';
import { generateUniqueSlug } from '../../utils/slug.util.js';
import APIFeatures            from '../../utils/apiFeatures.util.js';

class ProductService {
  async create(data) {
    const slug = data.slug || await generateUniqueSlug(Product, data.title);
    if (data.slug) {
      const exists = await Product.findOne({ slug: data.slug });
      if (exists) throw new ApiError(400, 'Slug already exists');
    }
    return Product.create({ ...data, slug, publishedAt: data.isPublished ? new Date() : null });
  }

  async getAll(query) {
    const features = new APIFeatures(Product.find().populate('category'), query)
      .search(['title', 'shortDescription'])
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const [products, total] = await Promise.all([
      features.query,
      Product.countDocuments(),
    ]);

    return { products, pagination: { ...features.pagination, total, pages: Math.ceil(total / features.pagination.limit) } };
  }

  async getBySlug(slug) {
    const product = await Product.findOne({ slug })
      .populate('category')
      .populate({ path: 'reviews', match: { isApproved: true }, populate: { path: 'customer', select: 'firstName lastName avatar' } });

    if (!product) throw new ApiError(404, 'Product not found');
    product.viewCount++;
    await product.save();
    return product;
  }

  async getById(id) {
    const product = await Product.findById(id).populate('category');
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
  }

  async update(id, data) {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');

    if (data.title && data.title !== product.title && !data.slug) {
      data.slug = await generateUniqueSlug(Product, data.title, id);
    }
    if (data.isPublished && !product.isPublished) data.publishedAt = new Date();

    Object.assign(product, data);
    return product.save();
  }

  async delete(id) {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    await product.deleteOne();
  }

  async getFeatured(limit = 8) {
    return Product.find({ isFeatured: true, isPublished: true }).populate('category').limit(limit).sort('-createdAt');
  }

  async getLatest(limit = 12) {
    return Product.find({ isPublished: true }).populate('category').limit(limit).sort('-createdAt');
  }
}

export default new ProductService();
