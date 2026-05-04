import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Order } from "../types/models";
import type { StaffFeedbackRow } from "../api/staffApi";

export type HomeStackParamList = {
  Home: undefined;
};

/** Catalogue: products, designers, custom design (Shop tab) */
export type ShopStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string; /** Opened from Home hub — back returns to Home tab */ fromHome?: boolean };
  DesignerList: undefined;
  DesignerDetail: { id: string; fromHome?: boolean };
  CustomDesign: { fromHome?: boolean } | undefined;
};

/** @deprecated Use ShopStackParamList — kept only to avoid breaking any deep imports */
export type DesignersStackParamList = {
  DesignerList: undefined;
  DesignerDetail: { id: string };
};

export type CartStackParamList = {
  CartMain: undefined;
  Checkout: undefined;
};

export type AccountStackParamList = {
  Dashboard: undefined;
  Login: undefined;
  Register: undefined;
  StaffLogin: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  Profile: undefined;
  Feedback: undefined;
  ForgotPassword: undefined;
};

export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Shop: NavigatorScreenParams<ShopStackParamList>;
  Cart: NavigatorScreenParams<CartStackParamList>;
  Account: NavigatorScreenParams<AccountStackParamList>;
};

/** Root native stack: customer tabs vs staff workspace */
export type RootStackParamList = {
  CustomerTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  StaffWorkspace: undefined;
};

/** Serializable product snapshot for navigation */
export type ProductLike = {
  _id: string;
  productName: string;
  productDescription?: string;
  productCategory: string;
  productPrice: number;
  stockQuantity: number;
  isActive: boolean;
  productImage?: string;
  metalMaterial?: string;
  gemType?: string;
};

export type StaffDiscountLike = {
  _id: string;
  discountName: string;
  campaignTheme?: string;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  promoScope: "coupon" | "site_wide";
  discountCoupon: string;
  startDate?: string;
  endDate?: string;
  minSubtotal?: number | null;
  maxUses?: number | null;
};

export type StaffStackParamList = {
  StaffHome: undefined;
  StaffProducts: undefined;
  StaffProductEditor: { product?: ProductLike } | undefined;
  StaffDiscounts: undefined;
  StaffDiscountEditor: { discount?: StaffDiscountLike } | undefined;
  StaffPortfolios: undefined;
  /** Admin/product manager: create portfolio for a designer who doesn’t have one yet */
  StaffPortfolioCreate: undefined;
  /** `mine: true` = designer’s own portfolio (/me). `id` = admin/viewer portfolio. */
  StaffPortfolioEditor: { id?: string; mine?: boolean };
  StaffTeam: undefined;
  StaffFeedback: undefined;
  StaffFeedbackDetail: { item: StaffFeedbackRow };
  StaffOrders: undefined;
  StaffOrderDetail: { order: Order };
  StaffCustomDesignRequests: undefined;
};
