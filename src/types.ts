export type Role = 'SUPER_ADMIN' | 'ADMIN_SUCURSAL' | 'VENDEDOR' | 'CLIENTE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  stock: number;
  price: number;
  category: string;
  branchId: string;
  image?: string;
  description?: string;
  specifications?: string[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
}

export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CartItem extends SaleItem {
  image?: string;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  type: 'CONTADO' | 'CREDITO';
  customerName: string;
  sellerId: string;
  branchId: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  documentId?: string;
  address?: string;
  totalPurchases: number;
  lastVisit: string;
  branchId: string;
}

export interface TechnicalService {
  id: string;
  customerName: string;
  customerPhone?: string;
  device: string;
  issue: string;
  status: 'RECIBIDO' | 'EN_REPARACION' | 'LISTO' | 'ENTREGADO';
  cost: number;
  date: string;
  branchId: string;
  technicianNotes?: string;
  estimatedDeliveryDate?: string;
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'PENDIENTE' | 'PAGADO' | 'ATRASADO';
}

export interface Credit {
  id: string;
  saleId: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDIENTE' | 'PAGADO' | 'ATRASADO';
  installments: Installment[];
}

export interface Movement {
  id: string;
  date: string;
  type: 'INGRESO' | 'EGRESO' | 'TRASLADO';
  category: 'CAJA' | 'INVENTARIO';
  description: string;
  amount?: number;
  productId?: string;
  productName?: string;
  quantity?: number;
  branchId: string;
  targetBranchId?: string;
  userId: string;
  userName: string;
}
