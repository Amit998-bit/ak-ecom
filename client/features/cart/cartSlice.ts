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
