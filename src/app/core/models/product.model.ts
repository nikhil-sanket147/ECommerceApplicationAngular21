export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  stockQuantity?: number;
  categoryId?: string | number;
  categoryName?: string;
  imageUrl?: string;
}

export interface Category {
  id: string | number;
  name: string;
  description: string;
}

export interface CreateProductRequest{
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string | number;
}

export interface ProductListResponse {
  items: Product[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}