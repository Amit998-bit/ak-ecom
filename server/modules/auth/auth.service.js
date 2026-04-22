import User from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token.util.js';

class AuthService {
  async register(userData) {
    const { email } = userData;
    if (await User.findOne({ email })) throw new ApiError(400, 'Email already registered');

    const user         = await User.create({ ...userData, role: 'CUSTOMER' });
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user:  { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user)           throw new ApiError(401, 'Invalid credentials');
    if (!user.isActive)  throw new ApiError(403, 'Account is deactivated');

    const valid = await user.comparePassword(password);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    return {
      user:  { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) throw new ApiError(401, 'Refresh token required');

    const decoded = verifyRefreshToken(refreshToken);
    const user    = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken)
      throw new ApiError(401, 'Invalid refresh token');

    return { accessToken: generateAccessToken(user._id) };
  }

  async logout(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    user.refreshToken = null;
    await user.save();
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}

export default new AuthService();
