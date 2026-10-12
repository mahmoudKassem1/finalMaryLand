import apiClient from './client';

export interface OrderItemPayload {
  product: string;
  quantity: number;
}

export interface ShippingAddressPayload {
  street?: string;
  city?: string;
  phone?: string;
}

export interface CreateOrderPayload {
  orderItems: OrderItemPayload[];
  shippingAddress?: ShippingAddressPayload;
  notes?: string;
}

export interface OrderRecord {
  _id: string;
  user: string;
  orderItems: {
    product: {
      _id: string;
      title: string;
      image?: string;
      price?: number;
    };
    quantity?: number;
    qty?: number;
    price?: number;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    phone: string;
  };
  notes?: string;
  status: 'Inquiry Received' | 'Confirmed via WhatsApp' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export const ordersApi = {
  // POST /orders
  createOrder: async (payload: CreateOrderPayload): Promise<OrderRecord> => {
    const res = await apiClient.post('/orders', payload);
    return res.data;
  },

  // GET /orders/myorders
  getMyOrders: async (): Promise<OrderRecord[]> => {
    const res = await apiClient.get('/orders/myorders');
    return res.data;
  },

  // GET /orders/:id
  getOrderById: async (id: string): Promise<OrderRecord> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },
};

export default ordersApi;
