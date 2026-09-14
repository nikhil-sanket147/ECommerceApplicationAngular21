export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
  stockQuantity?: number;
  isAvailable?: boolean;
}

// Model for paginated product API responses
export interface ProductListResponse {
  items: Product[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}