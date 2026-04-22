import { body } from 'express-validator';

export const productValidation = {
  create: [
    body('title').notEmpty().withMessage('Title is required').isLength({ min: 3 }).withMessage('Min 3 characters'),
    body('basePrice').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Must be positive'),
    body('category').notEmpty().withMessage('Category is required').isMongoId().withMessage('Invalid category ID'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be positive integer'),
  ],
  update: [
    body('title').optional().isLength({ min: 3 }).withMessage('Min 3 characters'),
    body('basePrice').optional().isFloat({ min: 0 }).withMessage('Must be positive'),
    body('category').optional().isMongoId().withMessage('Invalid category ID'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be positive integer'),
  ],
};
