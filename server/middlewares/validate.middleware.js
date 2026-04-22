import { validationResult } from 'express-validator';
import { ApiError }         from '../utils/ApiError.util.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extracted = errors.array().map((e) => ({
      field:   e.param,
      message: e.msg,
    }));
    throw new ApiError(422, 'Validation Error', extracted);
  }
  next();
};
