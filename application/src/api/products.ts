import apiClient from './client';
import { ProductItem } from '../components/ProductCard';

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  lowStock?: boolean;
  sort?: 'latest' | 'featured' | 'name';
}

export interface ProductsResponse {
  products: ProductItem[];
  page: number;
  pages: number;
  total: number;
  hasMore: boolean;
}

export const productsApi = {
  // GET /products
  getProducts: async (params?: ProductsQueryParams): Promise<ProductsResponse> => {
    const query = new URLSearchParams();

    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.lowStock) query.append('lowStock', 'true');
    if (params?.sort) query.append('sort', params.sort);

    const queryString = query.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    const res = await apiClient.get(endpoint);
    return res.data;
  },

  // GET /products/:id
  getProductById: async (id: string): Promise<ProductItem> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },

  // Helper: fetch Maryland exclusive items
  getMarylandProducts: async (limit = 6): Promise<ProductItem[]> => {
    const res = await apiClient.get(`/products?category=maryland-products&limit=${limit}`);
    return res.data.products || [];
  },
};

export default productsApi;