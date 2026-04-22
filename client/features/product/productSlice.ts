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
