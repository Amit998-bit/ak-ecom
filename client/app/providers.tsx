'use client';
import { Provider }  from 'react-redux';
import { store }     from '@/lib/store';
import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import { fetchCart }        from '@/features/cart/cartSlice';

function AppInit() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchCurrentUser());
      dispatch(fetchCart());
    }
  }, [dispatch]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInit />
      {children}
    </Provider>
  );
}
