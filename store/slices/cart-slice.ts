import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  originalPrice?: number
  image: string
  quantity: number
  size: string
  color: string
  stock: number
  customization?: {
    design?: string
    text?: string
    position?: { x: number; y: number }
  }
  seller: {
    id: string
    name: string
  }
}

interface CartState {
  items: CartItem[]
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode?: string
  loading: boolean
  error: string | null
}

const initialState: CartState = {
  items: [],
  total: 0,
  subtotal: 0,
  shipping: 0,
  tax: 0,
  discount: 0,
  loading: false,
  error: null,
}

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const response = await fetch("/api/cart")
  if (!response.ok) throw new Error("Failed to fetch cart")
  const data = await response.json()
  
  // Transform API response to match Redux state structure
  const transformedItems = data.items.map((item: any) => ({
    id: item._id,
    productId: item.product._id,
    name: item.product.name,
    price: item.product.price,
    originalPrice: item.product.originalPrice,
    image: item.product.images[0] || "/placeholder.svg",
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    customization: item.customization,
    seller: {
      id: item.product.seller._id,
      name: item.product.seller.name,
    },
    stock: item.product.stock,
  }))
  
  return {
    ...data,
    items: transformedItems,
  }
})

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (item: {
    productId: string
    quantity: number
    size: string
    color: string
    customization?: any
  }) => {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to add to cart")
    }
    const data = await response.json()
    
    // Transform API response to match Redux state structure
    const transformedItems = data.items.map((item: any) => ({
      id: item._id,
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      image: item.product.images[0] || "/placeholder.svg",
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      customization: item.customization,
      seller: {
        id: item.product.seller._id,
        name: item.product.seller.name,
      },
      stock: item.product.stock,
    }))
    
    return {
      ...data,
      items: transformedItems,
    }
  },
)

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
    const response = await fetch(`/api/cart/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    })
    if (!response.ok) throw new Error("Failed to update cart item")
    const data = await response.json()
    
    // Transform API response to match Redux state structure
    const transformedItems = data.items.map((item: any) => ({
      id: item._id,
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      image: item.product.images[0] || "/placeholder.svg",
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      customization: item.customization,
      seller: {
        id: item.product.seller._id,
        name: item.product.seller.name,
      },
      stock: item.product.stock,
    }))
    
    return {
      ...data,
      items: transformedItems,
    }
  },
)

export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (itemId: string) => {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to remove from cart")
  const data = await response.json()
  
  // Transform API response to match Redux state structure
  const transformedItems = data.items.map((item: any) => ({
    id: item._id,
    productId: item.product._id,
    name: item.product.name,
    price: item.product.price,
    originalPrice: item.product.originalPrice,
    image: item.product.images[0] || "/placeholder.svg",
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    customization: item.customization,
    seller: {
      id: item.product.seller._id,
      name: item.product.seller.name,
    },
    stock: item.product.stock,
  }))
  
  return {
    ...data,
    items: transformedItems,
  }
})

export const applyCoupon = createAsyncThunk("cart/applyCoupon", async (couponCode: string) => {
  const response = await fetch("/api/cart/coupon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: couponCode }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Invalid coupon code")
  }
  return response.json()
})

export const removeCoupon = createAsyncThunk("cart/removeCoupon", async () => {
  const response = await fetch("/api/cart/coupon", {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to remove coupon")
  }
  return response.json()
})

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = []
      state.total = 0
      state.subtotal = 0
      state.discount = 0
      state.couponCode = undefined
    },
    calculateTotals: (state) => {
      state.subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      state.tax = state.subtotal * 0.18 // 18% GST
      state.shipping = state.subtotal > 999 ? 0 : 99
      state.total = state.subtotal + state.tax + state.shipping - state.discount
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.couponCode = action.payload.couponCode
        state.discount = action.payload.discount
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch cart"
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.discount = action.payload.discount
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.discount = action.payload.discount
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.total = action.payload.total
        state.subtotal = action.payload.subtotal
        state.shipping = action.payload.shipping
        state.tax = action.payload.tax
        state.discount = action.payload.discount
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.discount = action.payload.discount
        state.couponCode = action.payload.couponCode
      })
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.discount = 0
        state.couponCode = undefined
      })
  },
})

export const { clearCart, calculateTotals } = cartSlice.actions
export default cartSlice.reducer
