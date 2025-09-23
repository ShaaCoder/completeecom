/**
 * API Client
 * 
 * Client for making API requests with authentication and error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);

      let data: any = null;
      try {
        data = await response.json();
      } catch (err) {
        // No JSON response received
      }

      if (!response.ok) {
        throw new Error(data?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth methods
  async register(userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const response = await this.request<{ user: any; token: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });


    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{ user: any; token: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });


    return response;
  }

  async logout() {
    return { success: true, message: 'Logged out' } as unknown as ApiResponse<null>;
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  async updateProfile(userData: { 
    name: string; 
    phone?: string; 
    username?: string;
  }) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async addAddress(address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
  }) {
    return this.request<{ user: any }>('/auth/profile/address', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }

  // Product methods
  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    brand?: string[];
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sort?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
    
    const queryString = searchParams.toString();
    return this.request<any[]>(`/products?${queryString}`);
  }

  async getProductBySlug(slug: string) {
    return this.request<any>(`/products/${slug}`);
  }

  async createProduct(product: any) {
    return this.request<any>(`/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(slug: string, updates: any) {
    return this.request<any>(`/products/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(slug: string) {
    return this.request<any>(`/products/${slug}`, {
      method: 'DELETE',
    });
  }

  async getFeaturedProducts() {
    return this.request<any[]>('/products/featured');
  }

  // Category methods
  async getCategories() {
    return this.request<any[]>('/categories');
  }

  async createCategory(category: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    subcategories?: string[];
    isActive?: boolean;
  }) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    subcategories?: string[];
    isActive?: boolean;
  }) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Order methods
  async createOrder(orderData: {
    items: Array<{
      productId: string;
      quantity: number;
    }>;
    shippingAddress: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    paymentMethod: string;
    couponCode?: string;
  }) {
    return this.request<{ order: any; paymentDetails?: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(params: { page?: number; limit?: number; status?: string } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any[]>(`/orders?${searchParams.toString()}`);
  }

  async getOrderById(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async updateOrder(id: string, updates: { status?: string; paymentStatus?: string; trackingNumber?: string; carrier?: string; expectedDeliveryAt?: string; shippedAt?: string; deliveredAt?: string; paymentAt?: string; confirmedAt?: string }) {
    return this.request<any>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteOrder(id: string) {
    return this.request<any>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async cancelOrder(id: string, reason?: string) {
    return this.request<any>(`/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // Payment methods
  async createPaymentIntent(data: { orderId: string; amount: number }) {
    return this.request<any>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCheckoutSession(data: {
    items: Array<{
      productId: string;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }>;
    shippingAddress: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    total: number;
  }) {
    return this.request<any>('/payments/create-checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCODOrder(data: {
    items: Array<{
      productId: string;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }>;
    shippingAddress: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    couponCode?: string;
  }) {
    return this.request<any>('/orders/create-cod', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyPayment(paymentIntentId: string) {
    return this.request<any>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }

  // Delivery methods
  async createShipment(orderId: string, provider: 'delhivery' | 'shiprocket' = 'delhivery') {
    return this.request<any>(`/delivery/create-shipment`, {
      method: 'POST',
      body: JSON.stringify({ orderId, provider }),
    });
  }

  async checkServiceability(input: { fromPincode: string; toPincode: string; weight: number; codAmount?: number }) {
    return this.request<any>(`/delivery/serviceability`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

}

export const apiClient = new ApiClient();
