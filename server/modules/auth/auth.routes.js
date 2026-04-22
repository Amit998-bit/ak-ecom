import express         from 'express';
import AuthController  from './auth.controller.js';
import { protect }     from '../../middlewares/auth.middleware.js';
import { authValidation } from './auth.validation.js';
import { validate }       from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.post('/register', authValidation.register, validate, AuthController.register);
router.post('/login',    authValidation.login,    validate, AuthController.login);
router.post('/refresh',  AuthController.refreshToken);
router.post('/logout',   protect, AuthController.logout);
router.get('/me',        protect, AuthController.me);

export default router;
