export interface CartItem{
    id?: string | number;
    productId: string | number;
    productName: string;
    unitPrice: number;
    quantity: number;
    imageUrl?:string;
}

export interface Cart {
  id?: string | number;
  userId?: string;
  items: CartItem[];
  totalAmount?: number;
}

export interface AddCartItemRequest {
  productId: string | number;
  productName: string;
  unitPrice:number;
  quantity:number;
  imageUrl:string | undefined;
}

export interface UpdateCartItemRequest {
  productId: string | number;
  quantity: number;
}