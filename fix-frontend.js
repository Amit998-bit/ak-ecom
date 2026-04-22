// fix-frontend.js
// Run: node fix-frontend.js

import fs   from 'fs';
import path from 'path';

const files = {};

// ============================================
// CONFIGURATION FILES
// ============================================

files['client/tsconfig.json'] = `
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

files['client/next.config.js'] = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
`;

files['client/postcss.config.js'] = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

files['client/tailwind.config.ts'] = `
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        accent:    'var(--accent-color)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
`;

files['client/package.json'] = `
{
  "name": "ecommerce-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^2.0.1",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18",
    "react-redux": "^9.0.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
`;

files['client/.env.local.example'] = `
NEXT_PUBLIC_API_URL=http://localhost:5000/api
`;

files['client/.gitignore'] = `
node_modules/
.next/
.env.local
*.log
.DS_Store
`;

// ============================================
// LIB FILES
// ============================================

files['client/lib/store.ts'] = `
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
`;

files['client/lib/hooks.ts'] = `
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/store';

export const useAppDispatch: () => AppDispatch              = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
`;

files['client/lib/api-client.ts'] = `
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          BASE_URL + '/auth/refresh',
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        original.headers.Authorization = 'Bearer ' + newToken;
        return apiClient(original);
      } catch {
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
`;

// ============================================
// REDUX SLICES
// ============================================

files['client/features/auth/authSlice.ts'] = `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

interface User {
  id:        string;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
}

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  loading:         boolean;
  error:           string | null;
}

const initialState: AuthState = {
  user:            null,
  isAuthenticated: false,
  loading:         false,
  error:           null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/auth/login', credentials);
      if (typeof window !== 'undefined')
        localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    userData: { firstName: string; lastName: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.post('/auth/register', userData);
      if (typeof window !== 'undefined')
        localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/auth/me');
      return data.data as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true;  s.user = a.payload; s.error = null; })
      .addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(register.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true;  s.user = a.payload; s.error = null; })
      .addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(fetchCurrentUser.fulfilled, (s, a) => { s.isAuthenticated = true;  s.user = a.payload; })
      .addCase(fetchCurrentUser.rejected,  (s)    => { s.isAuthenticated = false; s.user = null; })

      .addCase(logout.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; s.error = null; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
`;

files['client/features/cart/cartSlice.ts'] = `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

interface CartItem {
  _id:      string;
  product:  any;
  variant?: string;
  quantity: number;
  price:    number;
}

interface CartState {
  items:    CartItem[];
  subtotal: number;
  total:    number;
  discount: number;
  loading:  boolean;
  error:    string | null;
}

const initialState: CartState = {
  items: [], subtotal: 0, total: 0, discount: 0, loading: false, error: null,
};

const applyCart = (state: CartState, cart: any) => {
  state.items    = cart.items    ?? [];
  state.subtotal = cart.subtotal ?? 0;
  state.total    = cart.total    ?? 0;
  state.discount = cart.discount ?? 0;
  state.loading  = false;
  state.error    = null;
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try { const { data } = await apiClient.get('/cart'); return data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to fetch cart'); }
});

export const addToCart = createAsyncThunk(
  'cart/add',
  async (item: { productId: string; variantId?: string; quantity: number }, { rejectWithValue }) => {
    try { const { data } = await apiClient.post('/cart/items', item); return data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to add item'); }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { rejectWithValue }) => {
    try { const { data } = await apiClient.put('/cart/items/' + itemId, { quantity }); return data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to update'); }
  }
);

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId: string, { rejectWithValue }) => {
  try { const { data } = await apiClient.delete('/cart/items/' + itemId); return data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to remove'); }
});

export const clearCartItems = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try { const { data } = await apiClient.delete('/cart'); return data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to clear'); }
});

export const applyCoupon = createAsyncThunk('cart/coupon', async (code: string, { rejectWithValue }) => {
  try { const { data } = await apiClient.post('/cart/apply-coupon', { code }); return data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Invalid coupon'); }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending,       (s) => { s.loading = true; })
      .addCase(addToCart.pending,       (s) => { s.loading = true; })
      .addCase(fetchCart.fulfilled,     (s, a) => applyCart(s, a.payload))
      .addCase(addToCart.fulfilled,     (s, a) => applyCart(s, a.payload))
      .addCase(updateCartItem.fulfilled,(s, a) => applyCart(s, a.payload))
      .addCase(removeFromCart.fulfilled,(s, a) => applyCart(s, a.payload))
      .addCase(clearCartItems.fulfilled,(s, a) => applyCart(s, a.payload))
      .addCase(applyCoupon.fulfilled,   (s, a) => applyCart(s, a.payload))
      .addCase(fetchCart.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(addToCart.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export const { clearCartError } = cartSlice.actions;
export default cartSlice.reducer;
`;

files['client/features/product/productSlice.ts'] = `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

interface Pagination { page: number; limit: number; total: number; pages: number; }

interface ProductState {
  products:   any[];
  product:    any | null;
  featured:   any[];
  latest:     any[];
  pagination: Pagination | null;
  loading:    boolean;
  error:      string | null;
}

const initialState: ProductState = {
  products: [], product: null, featured: [], latest: [],
  pagination: null, loading: false, error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (query?: { page?: number; limit?: number; search?: string; category?: string; sort?: string }, { rejectWithValue } = {} as any) => {
    try { const { data } = await apiClient.get('/products', { params: query }); return data.data; }
    catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed'); }
  }
);

export const fetchProductBySlug = createAsyncThunk('products/fetchOne', async (slug: string, { rejectWithValue }) => {
  try { const { data } = await apiClient.get('/products/' + slug); return data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Not found'); }
});

export const fetchFeaturedProducts = createAsyncThunk('products/featured', async (limit: number = 8, { rejectWithValue } = {} as any) => {
  try { const { data } = await apiClient.get('/products/featured', { params: { limit } }); return data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed'); }
});

export const fetchLatestProducts = createAsyncThunk('products/latest', async (limit: number = 12, { rejectWithValue } = {} as any) => {
  try { const { data } = await apiClient.get('/products/latest', { params: { limit } }); return data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed'); }
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProduct: (state) => { state.product = null; },
    clearError:   (state) => { state.error   = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, a) => { s.loading = false; s.products = a.payload.products; s.pagination = a.payload.pagination; })
      .addCase(fetchProducts.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(fetchProductBySlug.pending,   (s) => { s.loading = true; })
      .addCase(fetchProductBySlug.fulfilled, (s, a) => { s.loading = false; s.product = a.payload; })
      .addCase(fetchProductBySlug.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(fetchFeaturedProducts.fulfilled, (s, a) => { s.featured = a.payload; })
      .addCase(fetchLatestProducts.fulfilled,   (s, a) => { s.latest   = a.payload; });
  },
});

export const { clearProduct, clearError } = productSlice.actions;
export default productSlice.reducer;
`;

// ============================================
// APP FILES
// ============================================

files['client/app/globals.css'] = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-color:   #3B82F6;
  --secondary-color: #10B981;
  --accent-color:    #F59E0B;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1F2937;
  background: #F9FAFB;
}

/* Custom scrollbar */
::-webkit-scrollbar        { width: 6px; }
::-webkit-scrollbar-track  { background: #F1F5F9; }
::-webkit-scrollbar-thumb  { background: #CBD5E1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

/* Line clamp utilities */
.line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
.line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
`;

files['client/app/layout.tsx'] = `
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:       { default: 'ShopMERN', template: '%s | ShopMERN' },
  description: 'Your one-stop shop for everything',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;

files['client/app/providers.tsx'] = `
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
`;

// ─── STOREFRONT LAYOUT ──────────────────────────────────────────────────────

files['client/app/(storefront)/layout.tsx'] = `
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
`;

// ─── STOREFRONT PAGES ───────────────────────────────────────────────────────

files['client/app/(storefront)/page.tsx'] = `
import HeroBanner       from '@/components/storefront/HeroBanner';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import LatestProducts   from '@/components/storefront/LatestProducts';
import PromoStrip       from '@/components/storefront/PromoStrip';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <PromoStrip />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        <FeaturedProducts />
        <LatestProducts />
      </div>
    </>
  );
}
`;

files['client/app/(storefront)/products/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams }     from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchProducts }  from '@/features/product/productSlice';
import ProductCard        from '@/components/storefront/ProductCard';
import ProductCardSkeleton from '@/components/storefront/ProductCardSkeleton';
import Pagination         from '@/components/ui/Pagination';

export default function ProductsPage() {
  const dispatch     = useAppDispatch();
  const searchParams = useSearchParams();
  const { products, loading, pagination } = useAppSelector((s) => s.products);

  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState('-createdAt');
  const [page,   setPage]   = useState(1);

  useEffect(() => {
    dispatch(fetchProducts({ page, limit: 12, search, sort }));
  }, [dispatch, page, search, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">{pagination.total} products found</p>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="-createdAt">Newest</option>
            <option value="basePrice">Price: Low to High</option>
            <option value="-basePrice">Price: High to Low</option>
            <option value="-salesCount">Best Selling</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🛍️</p>
          <p className="text-xl font-semibold text-gray-700">No products found</p>
          <p className="text-gray-500 mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-12">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
`;

files['client/app/(storefront)/products/[slug]/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { useParams }           from 'next/navigation';
import Image                   from 'next/image';
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchProductBySlug } from '@/features/product/productSlice';
import { addToCart }          from '@/features/cart/cartSlice';
import toast                  from '@/lib/toast';

export default function ProductDetailPage() {
  const { slug }   = useParams<{ slug: string }>();
  const dispatch   = useAppDispatch();
  const { product, loading } = useAppSelector((s) => s.products);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity,      setQuantity]      = useState(1);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [adding,        setAdding]        = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchProductBySlug(slug as string));
  }, [dispatch, slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-xl font-semibold">Product not found</p>
      </div>
    </div>
  );

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    setAdding(true);
    await dispatch(addToCart({ productId: product._id, quantity }));
    setAdding(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.title}
                fill className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={\`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition \${
                    selectedImage === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'
                  }\`}
                >
                  <Image src={img.url} alt={img.alt || ''} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-blue-600 font-medium mb-2">
              {product.category?.name}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-gray-900">
              ₹{product.basePrice?.toLocaleString()}
            </span>
            {product.comparePrice && (
              <span className="text-2xl text-gray-400 line-through">
                ₹{product.comparePrice?.toLocaleString()}
              </span>
            )}
            {discount > 0 && (
              <span className="text-green-600 font-semibold text-lg">
                {discount}% off
              </span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Variants */}
          {product.options?.map((option: any) => (
            <div key={option.name}>
              <p className="text-sm font-semibold text-gray-700 mb-2">{option.name}</p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((val: string) => (
                  <button
                    key={val}
                    onClick={() => setSelectedAttrs((prev) => ({ ...prev, [option.name]: val }))}
                    className={\`px-4 py-2 border-2 rounded-lg text-sm font-medium transition \${
                      selectedAttrs[option.name] === val
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }\`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-gray-400 transition"
              >−</button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-gray-400 transition"
              >+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShoppingCart className="w-5 h-5" />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:text-red-500 transition">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {[
              { icon: <Truck className="w-5 h-5" />,    text: 'Free Shipping' },
              { icon: <Shield className="w-5 h-5" />,   text: 'Secure Payment' },
              { icon: <RefreshCw className="w-5 h-5" />, text: 'Easy Returns' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 text-center text-xs text-gray-500">
                <span className="text-blue-500">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Long description */}
      {product.longDescription && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: product.longDescription }}
          />
        </div>
      )}
    </div>
  );
}
`;

files['client/app/(storefront)/cart/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import Link                    from 'next/link';
import Image                   from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchCart, removeFromCart, updateCartItem, clearCartItems, applyCoupon } from '@/features/cart/cartSlice';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, subtotal, total, discount, loading, error } = useAppSelector((s) => s.cart);

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg,  setCouponMsg]  = useState('');
  const [applying,   setApplying]   = useState(false);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    const result = await dispatch(applyCoupon(couponCode));
    if (applyCoupon.fulfilled.match(result)) {
      setCouponMsg('✅ Coupon applied successfully!');
    } else {
      setCouponMsg('❌ ' + (result.payload as string));
    }
    setApplying(false);
  };

  if (!loading && items.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-500">Add some products to get started!</p>
        <Link href="/products" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
          Browse Products
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="text-gray-500 text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm p-5 flex gap-5">
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {item.product?.images?.[0] ? (
                    <Image src={item.product.images[0].url} alt={item.product.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.product?.title}</h3>
                  <p className="text-blue-600 font-bold mt-1">₹{item.price?.toLocaleString()}</p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => item.quantity > 1 && dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-40"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subtotal + Remove */}
                <div className="flex flex-col items-end justify-between">
                  <p className="font-bold text-gray-900">₹{(item.price * item.quantity)?.toLocaleString()}</p>
                  <button
                    onClick={() => dispatch(removeFromCart(item._id))}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Clear cart */}
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearCartItems())}
                className="text-sm text-red-500 hover:text-red-700 transition"
              >
                Clear entire cart
              </button>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Coupon Code
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={applying}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {applying ? '...' : 'Apply'}
                </button>
              </div>
              {couponMsg && <p className="text-sm mt-2">{couponMsg}</p>}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Order Summary</h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{subtotal?.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>₹{total?.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition text-center"
              >
                Proceed to Checkout
              </Link>

              <Link href="/products" className="block text-center text-sm text-blue-600 hover:underline">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/checkout/page.tsx'] = `
'use client';
import { useState }  from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { clearCartItems } from '@/features/cart/cartSlice';
import apiClient from '@/lib/api-client';

interface Address {
  fullName: string; phone: string; addressLine1: string;
  addressLine2: string; city: string; state: string;
  postalCode: string; country: string;
}

const emptyAddress: Address = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: 'India',
};

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { items, total } = useAppSelector((s) => s.cart);
  const user             = useAppSelector((s) => s.auth.user);

  const [address,  setAddress]  = useState<Address>(emptyAddress);
  const [payment,  setPayment]  = useState('COD');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setLoading(true); setError('');
    try {
      await apiClient.post('/orders', { shippingAddress: address, paymentMethod: payment });
      dispatch(clearCartItems());
      router.push('/orders/success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Shipping Address</h2>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'fullName', label: 'Full Name', type: 'text', colSpan: 2 },
                  { name: 'phone', label: 'Phone Number', type: 'tel', colSpan: 1 },
                  { name: 'addressLine1', label: 'Address Line 1', type: 'text', colSpan: 2 },
                  { name: 'addressLine2', label: 'Address Line 2 (Optional)', type: 'text', colSpan: 2 },
                  { name: 'city',  label: 'City',    type: 'text', colSpan: 1 },
                  { name: 'state', label: 'State',   type: 'text', colSpan: 1 },
                  { name: 'postalCode', label: 'Postal Code', type: 'text', colSpan: 1 },
                  { name: 'country',    label: 'Country',     type: 'text', colSpan: 1 },
                ].map(({ name, label, type, colSpan }) => (
                  <div key={name} className={colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={type} name={name}
                      value={(address as any)[name]}
                      onChange={handleChange}
                      required={name !== 'addressLine2'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'COD',      label: 'Cash on Delivery',   desc: 'Pay when your order arrives' },
                  { value: 'RAZORPAY', label: 'Razorpay',           desc: 'UPI, Cards, Net Banking' },
                  { value: 'STRIPE',   label: 'Stripe',             desc: 'International cards' },
                ].map(({ value, label, desc }) => (
                  <label key={value} className={\`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition \${payment === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}\`}>
                    <input type="radio" name="payment" value={value} checked={payment === value} onChange={(e) => setPayment(e.target.value)} className="accent-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item: any) => (
                  <div key={item._id} className="flex gap-3 text-sm">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] && (
                        <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product?.title}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity)?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{total?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">Free</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                  <span>Total</span><span>₹{total?.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="mt-6 w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 text-lg"
              >
                {loading ? 'Placing Order...' : 'Place Order →'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/login/page.tsx'] = `
'use client';
import { useState }    from 'react';
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { login, clearError } from '@/features/auth/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      router.push(result.payload.role === 'ADMIN' || result.payload.role === 'STAFF' ? '/dashboard' : '/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600">ShopMERN</h1>
            <p className="text-gray-500 mt-2">Welcome back! Sign in to your account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Your password"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-semibold">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/register/page.tsx'] = `
'use client';
import { useState }    from 'react';
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { register, clearError } from '@/features/auth/authSlice';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form,    setForm]    = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600">ShopMERN</h1>
            <p className="text-gray-500 mt-2">Create your account to get started</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                <input type="text" required value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input type="text" required value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Min 8 chars, uppercase & number" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 text-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/orders/success/page.tsx'] = `
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-md">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
        <p className="text-gray-500">
          Thank you for your order. We will send you a confirmation email shortly.
          Your order is being processed.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/account/orders"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
            Track Orders
          </Link>
          <Link href="/products"
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
`;

// ─── ADMIN LAYOUT & PAGES ───────────────────────────────────────────────────

files['client/app/(admin)/layout.tsx'] = `
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader  from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, Eye } from 'lucide-react';
import Link    from 'next/link';
import apiClient from '@/lib/api-client';

interface Stats {
  totalRevenue:  number;
  totalOrders:   number;
  totalUsers:    number;
  totalProducts: number;
  recentOrders:  any[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100   text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED:    'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100  text-green-700',
  CANCELLED:  'bg-red-100    text-red-700',
};

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Total Revenue',   value: '₹' + ((stats?.totalRevenue  || 0).toLocaleString()), icon: <DollarSign  className="w-6 h-6" />, color: 'from-blue-500   to-blue-600',   link: '/dashboard/orders'   },
    { title: 'Total Orders',    value: stats?.totalOrders   || 0,                             icon: <ShoppingBag className="w-6 h-6" />, color: 'from-green-500  to-green-600',  link: '/dashboard/orders'   },
    { title: 'Total Customers', value: stats?.totalUsers    || 0,                             icon: <Users       className="w-6 h-6" />, color: 'from-yellow-500 to-yellow-600', link: '/dashboard/users'    },
    { title: 'Total Products',  value: stats?.totalProducts || 0,                             icon: <Package     className="w-6 h-6" />, color: 'from-purple-500 to-purple-600', link: '/dashboard/products' },
  ];

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, here's what's happening today</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <Link key={card.title} href={card.link}
            className={'bg-gradient-to-br ' + card.color + ' rounded-2xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer'}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-xl">{card.icon}</div>
              <TrendingUp className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-white/80 text-sm mt-1">{card.title}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline font-medium">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Customer', 'Total', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recentOrders?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No orders yet</td></tr>
              ) : (
                stats?.recentOrders?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customer?.firstName} {order.customer?.lastName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.total?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + (STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600')}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Link href={'/dashboard/orders/' + order._id} className="text-blue-500 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/products/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import Link    from 'next/link';
import Image   from 'next/image';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    apiClient.get('/products', { params: { limit: 50 } })
      .then(({ data }) => setProducts(data.data.products))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await apiClient.delete('/products/' + id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link href="/dashboard/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text" placeholder="Search products..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} products</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'Price', 'Stock', 'Category', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products found</td></tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <Image src={product.images[0].url} alt={product.title} width={48} height={48} className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">{product.title}</p>
                            <p className="text-xs text-gray-400">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.basePrice?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.stock}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + (product.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={'/products/' + product.slug} target="_blank" className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={'/dashboard/products/' + product._id + '/edit'} className="p-1.5 hover:bg-blue-50 rounded-lg transition text-blue-500 hover:text-blue-700">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(product._id)} className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/orders/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100   text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED:    'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100  text-green-700',
  CANCELLED:  'bg-red-100    text-red-700',
};

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');

  const loadOrders = () => {
    setLoading(true);
    apiClient.get('/orders', { params: { limit: 50, ...(filter && { status: filter }) } })
      .then(({ data }) => setOrders(data.data.orders))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await apiClient.put('/orders/' + id + '/status', { status });
    loadOrders();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')}
          className={'px-4 py-2 rounded-xl text-sm font-medium transition ' + (!filter ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200')}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={'px-4 py-2 rounded-xl text-sm font-medium transition ' + (filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200')}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Update'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                      <td className="px-5 py-4 text-sm">{order.customer?.firstName} {order.customer?.lastName}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{order.items?.length} item(s)</td>
                      <td className="px-5 py-4 text-sm font-bold">₹{order.total?.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={'text-xs px-2 py-1 rounded-full font-medium ' + (order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + (STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600')}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`;

// ─── STOREFRONT COMPONENTS ──────────────────────────────────────────────────

files['client/components/storefront/Header.tsx'] = `
'use client';
import Link            from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Heart, User, Search, Menu, X } from 'lucide-react';
import { useState }    from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/features/auth/authSlice';

export default function Header() {
  const dispatch  = useAppDispatch();
  const pathname  = usePathname();
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const user      = useAppSelector((s) => s.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);

  const navLinks = [
    { href: '/',          label: 'Home'       },
    { href: '/products',  label: 'Products'   },
    { href: '/categories',label: 'Categories' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-extrabold text-blue-600 flex-shrink-0">ShopMERN</Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                className={'px-4 py-2 rounded-xl text-sm font-medium transition ' + (pathname === href ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link href="/wishlist" className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
              <Heart className="w-5 h-5" />
            </Link>

            <Link href="/cart" className="relative p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button onClick={() => setUserOpen(!userOpen)}
                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                <User className="w-5 h-5" />
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <Link href="/account" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">My Account</Link>
                      <Link href="/account/orders" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">My Orders</Link>
                      {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                        <Link href="/dashboard" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 transition">Admin Panel</Link>
                      )}
                      <button onClick={() => { dispatch(logout()); setUserOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login"    onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">Sign In</Link>
                      <Link href="/register" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">Create Account</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl transition">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={'block px-4 py-2.5 rounded-xl text-sm font-medium transition ' + (pathname === href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50')}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
`;

files['client/components/storefront/Footer.tsx'] = `
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-white font-extrabold text-xl mb-3">ShopMERN</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Your one-stop shop for everything you need. Quality products at unbeatable prices.</p>
            <div className="flex gap-3 mt-5">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Shop',    links: [{ label: 'All Products', href: '/products' }, { label: 'Categories', href: '/categories' }, { label: 'Featured', href: '/products?featured=true' }] },
            { title: 'Account', links: [{ label: 'Login',        href: '/login' }, { label: 'Register',    href: '/register' }, { label: 'My Orders', href: '/account/orders' }] },
            { title: 'Help',    links: [{ label: 'Contact Us',   href: '/contact' }, { label: 'FAQ',       href: '/faq' }, { label: 'Returns',   href: '/returns' }] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-400 hover:text-white transition">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} ShopMERN. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-white transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
`;

files['client/components/storefront/HeroBanner.tsx'] = `
import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center">
        <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-medium rounded-full mb-6">
          🎉 New Collection Available
        </span>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
          Shop the Best<br />
          <span className="text-yellow-300">Deals Online</span>
        </h1>

        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10 leading-relaxed">
          Discover thousands of products at unbeatable prices.
          Free shipping on orders over ₹999. Shop with confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products"
            className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition text-lg shadow-lg hover:shadow-xl">
            Shop Now →
          </Link>
          <Link href="/categories"
            className="px-8 py-4 border-2 border-white/50 text-white font-bold rounded-2xl hover:bg-white/10 transition text-lg">
            Browse Categories
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16 text-center">
          {[
            { value: '10K+', label: 'Products' },
            { value: '50K+', label: 'Customers' },
            { value: '99%',  label: 'Satisfaction' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-extrabold text-white">{value}</p>
              <p className="text-blue-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

files['client/components/storefront/PromoStrip.tsx'] = `
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

const perks = [
  { icon: <Truck       className="w-5 h-5" />, title: 'Free Shipping',   desc: 'On orders over ₹999' },
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Payments', desc: '100% secure & safe'   },
  { icon: <RefreshCw   className="w-5 h-5" />, title: 'Easy Returns',    desc: '30-day return policy' },
  { icon: <Headphones  className="w-5 h-5" />, title: '24/7 Support',    desc: 'Always here to help'  },
];

export default function PromoStrip() {
  return (
    <div className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
          {perks.map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 py-5 px-6">
              <div className="text-blue-600 flex-shrink-0">{icon}</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;

files['client/components/storefront/FeaturedProducts.tsx'] = `
'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchFeaturedProducts } from '@/features/product/productSlice';
import ProductCard               from './ProductCard';
import ProductCardSkeleton       from './ProductCardSkeleton';
import Link                      from 'next/link';

export default function FeaturedProducts() {
  const dispatch = useAppDispatch();
  const { featured, loading } = useAppSelector((s) => s.products);

  useEffect(() => { dispatch(fetchFeaturedProducts(8)); }, [dispatch]);

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <p className="text-gray-500 mt-1">Handpicked products just for you</p>
        </div>
        <Link href="/products?featured=true" className="text-sm text-blue-600 hover:underline font-medium">View all →</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : featured.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p>No featured products yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </section>
  );
}
`;

files['client/components/storefront/LatestProducts.tsx'] = `
'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLatestProducts } from '@/features/product/productSlice';
import ProductCard             from './ProductCard';
import ProductCardSkeleton     from './ProductCardSkeleton';
import Link                    from 'next/link';

export default function LatestProducts() {
  const dispatch = useAppDispatch();
  const { latest } = useAppSelector((s) => s.products);

  useEffect(() => { dispatch(fetchLatestProducts(8)); }, [dispatch]);

  if (!latest.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Latest Arrivals</h2>
          <p className="text-gray-500 mt-1">Fresh products just added</p>
        </div>
        <Link href="/products?sort=-createdAt" className="text-sm text-blue-600 hover:underline font-medium">View all →</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {latest.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
`;

files['client/components/storefront/ProductCard.tsx'] = `
'use client';
import Image from 'next/image';
import Link  from 'next/link';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useAppDispatch } from '@/lib/hooks';
import { addToCart }      from '@/features/cart/cartSlice';
import { useState }       from 'react';

interface ProductCardProps {
  product: {
    _id:          string;
    title:        string;
    slug:         string;
    basePrice:    number;
    comparePrice?: number;
    images:       { url: string; alt?: string }[];
    isFeatured?:  boolean;
    salesCount?:  number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const [adding, setAdding] = useState(false);

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    setAdding(false);
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount}%</span>
        )}
        {product.isFeatured && (
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">⭐ Featured</span>
        )}
      </div>

      {/* Wishlist */}
      <button className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
        <Heart className="w-4 h-4" />
      </button>

      <Link href={'/products/' + product.slug}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.images?.[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.title}
              fill className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">📦</div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{product.title}</h3>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">₹{product.basePrice?.toLocaleString()}</span>
            {product.comparePrice && (
              <span className="text-sm text-gray-400 line-through">₹{product.comparePrice?.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <ShoppingCart className="w-4 h-4" />
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
`;

files['client/components/storefront/ProductCardSkeleton.tsx'] = `
export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
        <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
        <div className="h-6 bg-gray-200 rounded-lg w-1/3" />
        <div className="h-9 bg-gray-200 rounded-xl mt-2" />
      </div>
    </div>
  );
}
`;

// ─── ADMIN COMPONENTS ───────────────────────────────────────────────────────

files['client/components/admin/AdminSidebar.tsx'] = `
'use client';
import Link           from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, FolderOpen, ShoppingBag,
  Users, Tag, Star, Settings, Palette, Home, ChevronRight,
} from 'lucide-react';

const links = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/dashboard/products',    icon: Package,         label: 'Products'    },
  { href: '/dashboard/categories',  icon: FolderOpen,      label: 'Categories'  },
  { href: '/dashboard/orders',      icon: ShoppingBag,     label: 'Orders'      },
  { href: '/dashboard/users',       icon: Users,           label: 'Users'       },
  { href: '/dashboard/coupons',     icon: Tag,             label: 'Coupons'     },
  { href: '/dashboard/reviews',     icon: Star,            label: 'Reviews'     },
  { href: '/dashboard/homepage',    icon: Home,            label: 'Homepage'    },
  { href: '/dashboard/theme',       icon: Palette,         label: 'Theme'       },
  { href: '/dashboard/settings',    icon: Settings,        label: 'Settings'    },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <span className="text-xl font-extrabold text-blue-400">ShopMERN</span>
        <span className="ml-2 text-xs text-gray-500 font-medium">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-6 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Main Menu</p>
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={'flex items-center gap-3 px-5 py-2.5 mx-2 rounded-xl text-sm font-medium transition ' + (active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-800">
        <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition">
          <span>←</span>
          <span>Back to Store</span>
        </Link>
      </div>
    </aside>
  );
}
`;

files['client/components/admin/AdminHeader.tsx'] = `
'use client';
import { Bell, LogOut, User } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/features/auth/authSlice';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const user     = useAppSelector((s) => s.auth.user);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
            {user?.firstName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition font-medium">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
`;

// ─── SHARED UI COMPONENTS ───────────────────────────────────────────────────

files['client/components/ui/Pagination.tsx'] = `
'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage:  number;
  totalPages:   number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {visiblePages.map((page, idx) => {
        const prev = visiblePages[idx - 1];
        return (
          <>
            {prev && page - prev > 1 && (
              <span key={'ellipsis-' + page} className="px-2 text-gray-400">...</span>
            )}
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={'w-10 h-10 rounded-xl text-sm font-semibold transition ' + (page === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50')}
            >
              {page}
            </button>
          </>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
`;

files['client/lib/toast.ts'] = `
// Simple toast utility (no extra library needed)
const toast = {
  success: (msg: string) => console.log('✅ ' + msg),
  error:   (msg: string) => console.error('❌ ' + msg),
  info:    (msg: string) => console.info('ℹ️ '  + msg),
};

export default toast;
`;

// ============================================
// WRITE ALL FILES
// ============================================

let created = 0;
let skipped = 0;
let errors  = 0;

console.log('\n🚀 Generating frontend files...\n');

for (const [filePath, content] of Object.entries(files)) {
  try {
    const fullPath = path.resolve(filePath);
    const dir      = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content.trimStart(), 'utf8');
    console.log('✅  ' + filePath);
    created++;
  } catch (err) {
    console.error('❌  ' + filePath + ' — ' + err);
    errors++;
  }
}

console.log('\n' + '═'.repeat(55));
console.log('📊  SUMMARY');
console.log('═'.repeat(55));
console.log('✅  Created : ' + created + ' files');
console.log('❌  Errors  : ' + errors  + ' files');
console.log('═'.repeat(55));
console.log('\n🎉  Frontend generated!\n');
console.log('📋  NEXT STEPS:\n');
console.log('  cd client');
console.log('  npm install');
console.log('  copy .env.local.example .env.local');
console.log('  npm run dev\n');
console.log('  Open: http://localhost:3000\n');