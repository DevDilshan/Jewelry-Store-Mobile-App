export type Product = {
  _id: string;
  productName: string;
  productDescription?: string;
  productCategory: string;
  productPrice: number;
  compareAtPrice?: number;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  productImage?: string;
  metalMaterial?: string;
  gemType?: string;
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
};

/** Backend staff (store team) — separate session from customer auth */
export type StaffUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
};

/** Mirrors web `shopCartStorage` lines: full product + optional selection for checkout */
export type CartLine = {
  productId: string;
  quantity: number;
  product: Product;
  selected?: boolean;
};

export type ReviewItem = {
  _id: string;
  customerName?: string;
  title?: string;
  text?: string;
  feedback?: string;
  rating?: number;
  createdAt?: string;
  source?: string;
  staffReply?: string;
};

export type ProductPageBundle = {
  product: Product;
  reviews: ReviewItem[];
  mine: {
    productReview: ReviewItem | null;
    orderFeedback: ReviewItem | null;
  };
};

export type OrderLine = {
  product: Product;
  quantity: number;
  price: number;
};

export type Order = {
  _id: string;
  items: OrderLine[];
  subtotal: number;
  discountAmount?: number;
  discountCode?: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus?: string;
  createdAt?: string;
};

export type CustomerOrderFeedback = {
  _id: string;
  order?: Order;
  customerName?: string;
  title?: string;
  feedback?: string;
  rating?: number;
  createdAt?: string;
  staffReply?: string;
};

export type DesignerPortfolioPublic = {
  _id: string;
  displayName: string;
  headline?: string;
  bio?: string;
  specialties?: string[];
  /** Whole years, 0–80 when set by API */
  yearsOfExperience?: number;
  /** Count of delivered projects, 0–100_000 when set by API */
  completedProjects?: number;
  images: { _id: string; relPath: string; caption?: string; /** From API when server builds absolute URLs */ url?: string }[];
  staff?: { firstName?: string; lastName?: string; jobTitle?: string };
};
