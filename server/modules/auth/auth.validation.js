import { body } from 'express-validator';

export const authValidation = {
  register: [
    body('firstName').notEmpty().withMessage('First name is required').isLength({ min: 2 }).withMessage('Min 2 characters'),
    body('lastName').notEmpty().withMessage('Last name is required').isLength({ min: 2 }).withMessage('Min 2 characters'),
    body('email').notEmpty().withMessage('Email required').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password required')
      .isLength({ min: 8 }).withMessage('Min 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Must contain uppercase, lowercase and number'),
  ],
  login: [
    body('email').notEmpty().withMessage('Email required').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
};
