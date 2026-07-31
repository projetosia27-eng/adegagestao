export type UserRole = 'customer' | 'vendor' | 'both';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  zipCode?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  user_metadata?: any;
  createdAt: string;
}

export type WineType = 'red' | 'white' | 'sparkling' | 'rose' | 'fortified' | 'dessert';

export interface Wine {
  id: string;
  title: string;
  producer: string;
  region: string;
  country: string;
  vintageYear: number;
  grapeVarietal: string;
  type: WineType;
  price: number;
  stockQuantity: number;
  description?: string;
  imageUrl?: string;
  rating?: number;
  storeId?: string;
}

export interface CellarItem {
  id: string;
  userId: string;
  wineId: string;
  wine?: Wine;
  quantity: number;
  idealDrinkStartYear?: number;
  idealDrinkEndYear?: number;
  shelfLocation?: string;
  personalRating?: number;
  tastingNotes?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  rating: number;
  totalSales: number;
  city: string;
  state: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  wineId: string;
  wineTitle: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  storeId: string;
  storeName: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}
