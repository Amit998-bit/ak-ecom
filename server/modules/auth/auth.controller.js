import AuthService   from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.util.js';
import ApiResponse      from '../../utils/ApiResponse.util.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json(new ApiResponse(201, { user: result.user, accessToken: result.accessToken }, 'Registered successfully'));
  });

  login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(new ApiResponse(200, { user: result.user, accessToken: result.accessToken }, 'Login successful'));
  });

  refreshToken = asyncHandler(async (req, res) => {
    const result = await AuthService.refreshToken(req.cookies.refreshToken);
    res.status(200).json(new ApiResponse(200, result, 'Token refreshed'));
  });

  logout = asyncHandler(async (req, res) => {
    await AuthService.logout(req.user._id);
    res.clearCookie('refreshToken');
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  });

  me = asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.user._id);
    res.status(200).json(new ApiResponse(200, user, 'User fetched'));
  });
}

export default new AuthController();
