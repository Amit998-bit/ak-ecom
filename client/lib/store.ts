import { configureStore } from '@reduxjs/toolkit';
import authReducer    from '@/features/auth/authSlice';
import cartReducer    from '@/features/cart/cartSlice';
import productReducer from '@/features/product/productSlice';

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    cart:     cartReducer,
    products: productReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
