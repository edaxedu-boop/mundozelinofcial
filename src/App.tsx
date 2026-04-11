import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  ShoppingCart, 
  Wrench, 
  Users, 
  BarChart3, 
  LogOut, 
  Search, 
  Plus, 
  Store,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  FileText,
  UserPlus,
  Settings,
  Eye,
  Wallet,
  MessageCircle,
  Trash2,
  Minus,
  Upload,
  QrCode,
  Camera,
  Volume2,
  Zap,
  Download,
  MapPin,
  LayoutGrid,
  Navigation2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
import { User, Product, Sale, TechnicalService, Branch, Role, CartItem, Customer } from './types';
import { generateInventoryReport } from './services/aiService';
import { insforge } from './lib/insforge';

// Utils
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Añade el apikey a URLs de InsForge Storage para renderizado público
function getPublicUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;
  if (url.includes('insforge.app') && anonKey) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}apikey=${anonKey}`;
  }
  return url;
}

function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/(_\w)/g, m => m[1].toUpperCase())]: snakeToCamel(obj[key]),
      }),
      {},
    );
  }
  return obj;
}

const LoadingSplash = () => (
  <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20"
      >
        <Smartphone className="text-white w-12 h-12" />
      </motion.div>
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-primary rounded-[2rem] -z-10"
      />
    </div>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-8"
    >
      <h1 className="text-2xl font-black text-slate-900 mb-2">Mundo Celular Zelin</h1>
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="ml-2 font-bold uppercase tracking-widest text-[10px]">Cargando experiencia...</span>
      </div>
    </motion.div>
  </div>
);

function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)]: camelToSnake(obj[key]),
      }),
      {},
    );
  }
  return obj;
}

function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

const formatPeruDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Lima'
    }).format(new Date(dateStr)) + ' (PET)';
  } catch (e) {
    return dateStr;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'LISTO':
    case 'ENTREGADO':
    case 'PAGADO':
      return 'bg-green-100 text-green-600';
    case 'RECIBIDO':
    case 'EN_REPARACION':
    case 'PENDIENTE':
    case 'EN_PROCESO':
      return 'bg-orange-100 text-orange-600';
    case 'ATRASADO':
    case 'CANCELADO':
    case 'VENCIDO':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

// Mock Data & API Helpers
const API_URL = ''; // Same origin

const MOCK_DATA = {
  branches: [
    { id: "1", name: "Tienda 1", address: "Jr jose pezo mz 65 lote 11" },
    { id: "2", name: "Tienda 2", address: "Jr jose pezo mz 65 lote 11" },
    { id: "3", name: "Tienda 3", address: "Jr jose pezo mz 65 lote 11" }
  ],
  inventory: [
    { id: "1", branchId: "1", name: "iPhone 15 Pro", brand: "Apple", stock: 10, price: 4500, category: "Celulares" },
    { id: "2", branchId: "1", name: "Samsung S24 Ultra", brand: "Samsung", stock: 5, price: 4200, category: "Celulares" },
    { id: "7", branchId: "1", name: "Xiaomi 14 Ultra", brand: "Xiaomi", stock: 8, price: 3800, category: "Celulares" },
    { id: "8", branchId: "1", name: "AirPods Pro 2", brand: "Apple", stock: 20, price: 950, category: "Parlantes" },
    { id: "9", branchId: "1", name: "Case MagSafe iPhone 15", brand: "Apple", stock: 30, price: 150, category: "Accesorio" },
    { id: "3", branchId: "2", name: "Xiaomi Redmi Note 13 Pro", brand: "Xiaomi", stock: 15, price: 1200, category: "Celulares" },
    { id: "4", branchId: "2", name: "Cargador 20W", brand: "Apple", stock: 50, price: 99, category: "Accesorio" },
    { id: "5", branchId: "3", name: "Funda Silicona Universal", brand: "Genérico", stock: 100, price: 30, category: "Accesorio" },
    { id: "6", branchId: "3", name: "Motorola Edge 40 Neo", brand: "Motorola", stock: 8, price: 1800, category: "Celulares" }
  ] as Product[],
  sales: [
    { id: "s1", date: new Date().toISOString(), items: [{ id: "1", name: "iPhone 15 Pro", quantity: 1, price: 4500 }], total: 4500, type: "CONTADO", customerName: "Ana García", sellerId: "3", branchId: "1" },
    { id: "s2", date: new Date().toISOString(), items: [{ id: "3", name: "Xiaomi Redmi Note 13", quantity: 1, price: 1200 }], total: 1200, type: "CREDITO", customerName: "Pedro López", sellerId: "3", branchId: "2" }
  ] as Sale[],
  technicalServices: [
    { id: "ts1", customerName: "Maria Torres", customerPhone: "955443322", device: "iPhone 13", issue: "Pantalla rota", status: "EN_REPARACION", cost: 450, date: new Date().toISOString(), branchId: "1" },
    { id: "ts2", customerName: "Jose Ruiz", customerPhone: "912345678", device: "Samsung A54", issue: "Cambio de batería", status: "LISTO", cost: 120, date: new Date().toISOString(), branchId: "1" }
  ] as TechnicalService[],
  customers: [
    { id: "c1", name: "Ana García", email: "ana@example.com", phone: "987654321", documentId: "12345678", address: "Av. Larco 123", totalPurchases: 4500, lastVisit: new Date().toISOString(), branchId: "1" },
    { id: "c2", name: "Pedro López", email: "pedro@example.com", phone: "912345678", documentId: "87654321", address: "Calle Lima 456", totalPurchases: 1200, lastVisit: new Date().toISOString(), branchId: "2" }
  ],
  credits: [
    { id: "cr1", saleId: "s2", customerId: "c2", customerName: "Pedro López", totalAmount: 1200, paidAmount: 400, status: "PENDIENTE", branchId: "2", installments: [{ id: "i1", dueDate: "2024-04-15", amount: 400, status: "PAGADO" }, { id: "i2", dueDate: "2024-05-15", amount: 400, status: "PENDIENTE" }] }
  ],
  movements: [
    { id: "m1", date: new Date().toISOString(), type: "INGRESO", category: "CAJA", description: "Venta contado iPhone 15 Pro", amount: 4500, branchId: "1", userId: "3", userName: "Juan Vendedor" }
  ],
  settings: {
    storeName: "Mundo Celular Zelin",
    address: "Jr jose pezo mz 65 lote 11",
    phone: "51916857022",
    email: "contacto@zelin.com",
    whatsappMessage: "Hola, estoy interesado en este producto:",
    enableAiAnalysis: true,
    lowStockThreshold: 5,
    geminiApiKey: ""
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLandingView, setIsLandingView] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [services, setServices] = useState<TechnicalService[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Landing Page State
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const [inventoryFilterBranchId, setInventoryFilterBranchId] = useState<string | null>(null);

  // Filter data based on user role and branch
  const menuItems = useMemo(() => {
    if (!user) return [];
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR'] },
      { id: 'customers', label: 'Clientes', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR'] },
      { id: 'sales', label: 'Ventas', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR'] },
      { id: 'credits', label: 'Créditos / Cuotas', icon: Wallet, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR'] },
      { id: 'technical', label: 'Reparaciones', icon: Wrench, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR', 'CLIENTE'] },
      { id: 'my_purchases', label: 'Mis Compras', icon: ShoppingCart, roles: ['CLIENTE'] },
      { id: 'inventory', label: 'Inventario', icon: Smartphone, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR'] },
      { id: 'movements', label: 'Movimientos', icon: ArrowLeftRight, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL'] },
      { id: 'income', label: 'Ingresos', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL'] },
      { id: 'reports_list', label: 'Reportes', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL'] },
      { id: 'reports', label: 'Análisis IA', icon: Sparkles, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL'] },
      { id: 'branches', label: 'Sucursales', icon: Store, roles: ['SUPER_ADMIN'] },
      { id: 'users', label: 'Usuarios', icon: UserPlus, roles: ['SUPER_ADMIN'] },
      { id: 'settings', label: 'Configuración', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL'] },
      { id: 'view_store', label: 'Ver Tienda', icon: Eye, roles: ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR', 'CLIENTE'] },
    ].filter(item => item.roles.includes(user.role));
  }, [user]);

  const filteredInventory = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN') return inventory;
    return inventory.filter((i: any) => i.branchId === user.branchId);
  }, [inventory, user]);

  const filteredSales = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN') return sales;
    if (user.role === 'CLIENTE') return sales.filter((s: any) => s.customerName === user.name);
    return sales.filter((s: any) => s.branchId === user.branchId);
  }, [sales, user]);

  const filteredServices = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN') return services;
    if (user.role === 'CLIENTE') return services.filter((s: any) => s.customerName === user.name);
    return services.filter((s: any) => s.branchId === user.branchId);
  }, [services, user]);

  const filteredCustomers = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN') return customers;
    return customers.filter((c: any) => c.branchId === user.branchId);
  }, [customers, user]);

  const filteredMovements = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN') return movements;
    return movements.filter((m: any) => m.branchId === user.branchId);
  }, [movements, user]);

  const filteredCredits = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN') return credits;
    if (user.role === 'CLIENTE') return credits.filter((c: any) => c.customerName === user.name);
    return credits.filter((c: any) => c.branchId === user.branchId);
  }, [credits, user]);

  const filteredBranches = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN') return branches;
    return branches.filter((b: any) => b.id === user.branchId);
  }, [branches, user]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: "https://oechsle.vteximg.com.br/arquivos/ids/22243335-800-800/2972791.jpg?v=638942388849200000"
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const sendToWhatsApp = () => {
    const phoneNumber = "51916857022"; // Updated phone number
    const branchName = branches.find(b => b.id === selectedBranchId)?.name || "Mundo Celular Zelin";
    
    let message = `*Pedido de Mundo Celular Zelin*\n`;
    message += `*Sucursal:* ${branchName}\n\n`;
    message += `*Productos:*\n`;
    
    cart.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (S/ ${item.price.toLocaleString()})\n`;
    });
    
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    message += `\n*Total:* S/ ${total.toLocaleString()}\n\n`;
    message += `Hola, me gustaría realizar este pedido.`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const buyNow = (product: Product) => {
    const phoneNumber = "51916857022";
    const branchName = branches.find(b => b.id === selectedBranchId)?.name || "Mundo Celular Zelin";
    
    let message = `*Consulta de Compra Directa*\n`;
    message += `*Sucursal:* ${branchName}\n\n`;
    message += `*Producto:* ${product.name}\n`;
    message += `*Precio:* S/ ${product.price.toLocaleString()}\n\n`;
    message += `Hola, estoy interesado en comprar este producto ahora mismo. ¿Tienen disponibilidad?`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const goToPanel = () => {
    setIsLandingView(false);
  };

  useEffect(() => {
    // Check for saved session via InsForge Auth
    const checkSession = async () => {
      try {
        const { data: authUser, error: authError } = await insforge.auth.getCurrentUser();
        if (authUser && authUser.user) {
          setIsLandingView(false);
          // Fetch profile from database
          const { data: profile } = await insforge.database
            .from('users')
            .select('*')
            .eq('id', authUser.user.id)
            .single();
          
          if (profile) {
            setUser(profile);
          } else {
            // Auto-provision profile for OAuth users
            const name = (authUser.user.metadata?.full_name as string) || (authUser.user.profile as any)?.name || '';
            const newUser = { 
              id: authUser.user.id, 
              email: authUser.user.email || '', 
              name: name,
              role: 'CLIENTE' 
            };
            const { error: insertError } = await insforge.database.from('users').insert([camelToSnake(newUser)]);
            if (insertError) {
              console.error("Error auto-provisioning user:", insertError);
            } else {
              console.log("User profile created successfully for:", newUser.email);
              setUser(newUser as any);
            }
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      }
    };


    // Fetch branches always for landing page
    const fetchBranches = async () => {
      try {
        const { data, error } = await insforge.database.from('branches').select('*');
        if (error) throw error;
        setBranches(snakeToCamel(data));
        if (data.length > 0) setSelectedBranchId(data[0].id);
      } catch (err) {
        console.error("Error fetching branches, using mock", err);
        setBranches(MOCK_DATA.branches);
        if (MOCK_DATA.branches.length > 0) setSelectedBranchId(MOCK_DATA.branches[0].id);
      }
    };


    // Fetch inventory for landing page
    const fetchInventory = async () => {
      try {
        const { data, error } = await insforge.database.from('products').select('*');
        if (error) throw error;
        setInventory(snakeToCamel(data));
      } catch (err) {
        console.error("Error fetching inventory, using mock", err);
        setInventory(MOCK_DATA.inventory);
      }
    };


    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([
          checkSession(),
          fetchBranches(),
          fetchInventory()
        ]);
      } finally {
        setLoading(false);
      }
    };

    initialize();
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user && menuItems.length > 0) {
      const isAllowed = menuItems.some(item => item.id === activeTab);
      if (!isAllowed) {
        setActiveTab(menuItems[0].id);
      }
    }
  }, [user, activeTab, menuItems]);

  useEffect(() => {
    if (user && !isLandingView) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR', 'CLIENTE'];
      if (!allowedRoles.includes(user.role)) {
        setIsLandingView(true);
      } else {
        // Set appropriate initial tab based on role if on dashboard by default
        if (user.role === 'CLIENTE' && activeTab === 'dashboard') {
          setActiveTab('technical');
        }
      }
    }
  }, [user, isLandingView, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, sls, serv, brnch, cust, crdts, movs, usrs, sttngs] = await Promise.all([
        insforge.database.from('products').select('*'),
        insforge.database.from('sales').select('*'),
        insforge.database.from('technical_services').select('*'),
        insforge.database.from('branches').select('*'),
        insforge.database.from('customers').select('*'),
        insforge.database.from('credits').select('*'),
        insforge.database.from('movements').select('*'),
        insforge.database.from('users').select('*'),
        insforge.database.from('app_settings').select('*')
      ]);
      
      if (inv.data) setInventory(snakeToCamel(inv.data)); else setInventory(MOCK_DATA.inventory);
      if (sls.data) setSales(snakeToCamel(sls.data)); else setSales(MOCK_DATA.sales);
      if (serv.data) setServices(snakeToCamel(serv.data)); else setServices(MOCK_DATA.technicalServices);
      if (brnch.data) setBranches(snakeToCamel(brnch.data)); else setBranches(MOCK_DATA.branches);
      if (cust.data) setCustomers(snakeToCamel(cust.data)); else setCustomers(MOCK_DATA.customers);
      if (crdts.data) setCredits(snakeToCamel(crdts.data)); else setCredits(MOCK_DATA.credits);
      if (movs.data) setMovements(snakeToCamel(movs.data)); else setMovements(MOCK_DATA.movements);
      if (usrs.data) setUsers(snakeToCamel(usrs.data));
      if (sttngs.data && sttngs.data.length > 0) setSettings(snakeToCamel(sttngs.data[0])); else setSettings(MOCK_DATA.settings);
    } catch (err) {
      console.error("Error fetching data, using mock", err);
      // ... catch block continues
      setInventory(MOCK_DATA.inventory);
      setSales(MOCK_DATA.sales);
      setServices(MOCK_DATA.technicalServices);
      setBranches(MOCK_DATA.branches);
      setCustomers(MOCK_DATA.customers);
      setCredits(MOCK_DATA.credits);
      setMovements(MOCK_DATA.movements);
      setSettings(MOCK_DATA.settings);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (authMode === 'login') {
        const { data: authData, error: authError } = await insforge.auth.signInWithPassword({ 
          email: email.toLowerCase(), 
          password 
        });

        if (authError) {
          if (authError.message === 'Email verification required') {
            setIsVerifying(true);
            return;
          }
          setError(authError.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : authError.message || 'Error al iniciar sesión');
          return;
        }

        if (authData && authData.user) {
          // Fetch profile
          const { data: profile } = await insforge.database
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (profile) {
            setUser(profile);
          } else {
            setUser({ 
              id: authData.user.id, 
              email: authData.user.email, 
              name: (authData.user.profile as any)?.name || '', 
              role: 'CLIENTE' 
            } as any);
          }
          setShowAuth(false);
        }
      } else {
        // Register
        const name = (e.target as any).elements[0].value;
        const { data: authData, error: authError } = await insforge.auth.signUp({ 
          email: email.toLowerCase(), 
          password 
        });

        if (authError) {
          setError(authError.message === 'User already registered' ? 'El usuario ya está registrado' : authError.message || 'Error al registrarse');
          return;
        }

        if (authData) {
          // Check if verification is needed
          if (!authData.user.emailVerified) {
            setIsVerifying(true);
            return;
          }

          // Create profile in database if already verified
          const newUser = { 
            id: authData.user.id, 
            email: email.toLowerCase(), 
            password,
            name, 
            role: 'CLIENTE' as Role 
          };
          await insforge.database.from('users').insert([newUser]);
          setUser(newUser as any);
          setShowAuth(false);
        }
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const { error } = await insforge.auth.signInWithOAuth({
        provider: 'google',
        redirectTo: window.location.origin
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error: verifyError } = await insforge.auth.verifyEmail({
        email: email.toLowerCase(),
        otp: verificationCode
      });

      if (verifyError) {
        setError(verifyError.message || 'Código incorrecto');
        return;
      }

      if (data) {
        // Now that email is verified, sign in to get the session
        const { data: loginData } = await insforge.auth.signInWithPassword({
          email: email.toLowerCase(),
          password
        });
        
        if (loginData && loginData.user) {
          // Create profile
          const nameInput = document.querySelector('input[placeholder="Tu nombre"]') as HTMLInputElement;
          const name = nameInput?.value || '';
          
          const newUser = { 
            id: loginData.user.id, 
            email: email.toLowerCase(), 
            password,
            name, 
            role: 'CLIENTE' as Role 
          };
          await insforge.database.from('users').insert([newUser]);
          setUser(newUser as any);
          setIsVerifying(false);
          setShowAuth(false);
        }
      }
    } catch (err) {
      setError('Error al verificar');
    }
  };

  const handleResendCode = async () => {
    setError('');
    setResendMessage('');
    try {
      const { data, error: resendError } = await insforge.auth.resendVerificationEmail({
        email: email.toLowerCase()
      });
      if (resendError) {
        setError(resendError.message || 'Error al reenviar el código');
      } else {
        setResendMessage('Código reenviado con éxito');
        setTimeout(() => setResendMessage(''), 5000);
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };

  const handleLogout = async () => {
    try {
      await insforge.auth.signOut();
      setUser(null);
      setShowAuth(false);
      setIsLandingView(true);
    } catch (err) {
      console.error("Error signing out", err);
      // Fallback in case of error
      setUser(null);
      setShowAuth(false);
      setIsLandingView(true);
    }
  };

  const handleAddProduct = async (newProduct: any) => {
    try {
      const payload = { ...newProduct };
      if (payload.branchId === '') payload.branchId = null;
      payload.price = Number(payload.price) || 0;
      payload.stock = Number(payload.stock) || 0;

      const { data, error } = await insforge.database
        .from('products')
        .insert([camelToSnake(payload)])
        .select();
        
      if (error) {
        console.error("Database Error adding product:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setInventory(prev => [...prev, snakeToCamel(data[0])]);
        alert('Producto añadido correctamente');
      }
    } catch (err: any) {
      console.error("Error adding product", err);
      alert(`Error al añadir producto: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleUpdateProduct = async (updatedProduct: any) => {
    try {
      const payload = { ...updatedProduct };
      if (payload.branchId === '') payload.branchId = null;
      payload.price = Number(payload.price) || 0;
      payload.stock = Number(payload.stock) || 0;

      const { data, error } = await insforge.database
        .from('products')
        .update(camelToSnake(payload))
        .eq('id', updatedProduct.id)
        .select();
        
      if (error) {
        console.error("Database Error updating product:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setInventory(prev => prev.map(p => p.id === updatedProduct.id ? snakeToCamel(data[0]) : p));
        alert('Producto actualizado correctamente');
      }
    } catch (err: any) {
      console.error("Error updating product", err);
      alert(`Error al actualizar producto: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await insforge.database.from('products').delete().eq('id', productId);
      if (error) throw error;
      setInventory(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product", err);
    }
  };
  const handleAddSale = async (newSale: any) => {
    try {
      const payload = camelToSnake(newSale);
      const { data, error } = await insforge.database
        .from('sales')
        .insert([payload])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setSales(prev => [snakeToCamel(data[0]), ...prev]);

        // Update stock
        for (const item of newSale.items) {
          const { data: prod } = await insforge.database
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single();
          
          if (prod) {
            const newStock = Number(prod.stock) - Number(item.quantity);
            await insforge.database.from('products').update({ stock: newStock }).eq('id', item.id);
            setInventory(prev => prev.map(p => p.id === item.id ? { ...p, stock: newStock } : p));
          }
        }
        
        alert('Venta registrada correctamente');
        return data[0];
      }
    } catch (err: any) {
      console.error("Error adding sale", err);
      alert(`Error al registrar venta: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleBulkAdd = async (products: any[]) => {
    try {
      const validProducts = products.filter(p => p.name && p.price !== undefined);
      if (validProducts.length === 0) return { success: false, error: 'No hay productos válidos para cargar' };

      const { data, error } = await insforge.database
        .from('products')
        .insert(validProducts.map(p => camelToSnake(p)))
        .select();

      if (error) throw error;
      if (data) {
        setInventory(prev => [...prev, ...data.map(d => snakeToCamel(d))]);
      }
      return { success: true, count: data?.length || 0 };
    } catch (err: any) {
      console.error("Error in bulk add", err);
      return { success: false, error: err.message || 'Error desconocido' };
    }
  };

  const handleAddMovement = async (newMovement: any) => {
    try {
      const { data, error } = await insforge.database.from('movements').insert([camelToSnake(newMovement)]).select();
      if (error) throw error;
      if (data) {
        setMovements(prev => [snakeToCamel(data[0]), ...prev]);
        
        // If movement is about inventory, update product stock
        if (newMovement.category === 'INVENTARIO' && newMovement.productId && newMovement.quantity) {
          const qty = Number(newMovement.quantity);
          const { data: currentProd, error: fetchErr } = await insforge.database
            .from('products')
            .select('stock')
            .eq('id', newMovement.productId)
            .single();
          
          if (!fetchErr && currentProd) {
            let newStock = Number(currentProd.stock);
            if (newMovement.type === 'INGRESO') newStock += qty;
            if (newMovement.type === 'EGRESO') newStock -= qty;
            
            await insforge.database
              .from('products')
              .update({ stock: newStock })
              .eq('id', newMovement.productId);

            // Update local state too
            setInventory(prev => prev.map(p => p.id === newMovement.productId ? { ...p, stock: newStock } : p));
          }

          // Handle TRASLADO (stock movement between branches)
          if (newMovement.type === 'TRASLADO' && newMovement.targetBranchId) {
             // This would typically involve subtracting from origin and adding to target
             // and potentially creating the product row in the target branch if it doesn't exist
             // For now, let's keep it simple and just update the main row if it's the same product ID
          }
        }
      }
    } catch (err) {
      console.error("Error adding movement", err);
    }
  };

  const handleAddBranch = async (newBranch: any) => {
    try {
      const payload = { ...newBranch };
      if (payload.id && (payload.id.startsWith('branch-') || payload.id.includes('.'))) {
        delete payload.id;
      }
      
      const { data, error } = await insforge.database
        .from('branches')
        .insert([camelToSnake(payload)])
        .select();
        
      if (error) {
        console.error("Database Error adding branch:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setBranches(prev => [...prev, snakeToCamel(data[0])]);
        alert('Sucursal creada correctamente');
      }
    } catch (err: any) {
      console.error("Error adding branch", err);
      alert(`Error al crear sucursal: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleUpdateBranch = async (updatedBranch: any) => {
    try {
      const { data, error } = await insforge.database
        .from('branches')
        .update(camelToSnake(updatedBranch))
        .eq('id', updatedBranch.id)
        .select();
        
      if (error) {
        console.error("Database Error updating branch:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setBranches(prev => prev.map(b => b.id === updatedBranch.id ? snakeToCamel(data[0]) : b));
        alert('Sucursal actualizada correctamente');
      }
    } catch (err: any) {
      console.error("Error updating branch", err);
      alert(`Error al actualizar sucursal: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      const { error } = await insforge.database.from('branches').delete().eq('id', branchId);
      if (error) throw error;
      setBranches(prev => prev.filter(b => b.id !== branchId));
      alert('Sucursal eliminada');
    } catch (err) {
      console.error("Error deleting branch", err);
      alert('Error al eliminar sucursal');
    }
  };

  const handleAddUser = async (userData: any) => {
    try {
      const { data, error } = await insforge.database.from('users').insert([userData]);
      if (error) throw error;
      if (data) setUsers(prev => [...prev, data[0]]);
    } catch (err) {
      console.error("Error adding user", err);
    }
  };

  const handleUpdateUser = async (id: string, userData: any) => {
    if (!id) {
      alert('Error: ID de usuario no proporcionado');
      return;
    }
    try {
      const updateData = { ...userData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      // Convertir strings vacos a null para IDs
      if (updateData.branchId === '') {
        updateData.branchId = null;
      }
      
      const payload = camelToSnake(updateData);
      
      const { data, error } = await insforge.database
        .from('users')
        .update(payload)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error("Database Error updating user:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setUsers(prev => prev.map(u => u.id === id ? snakeToCamel(data[0]) : u));
        alert('Usuario actualizado correctamente');
      } else {
        throw new Error('No se recibió confirmación de la base de datos');
      }
    } catch (err: any) {
      console.error("Error updating user", err);
      alert(`Error al actualizar el usuario: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await insforge.database.from('users').delete().eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error deleting user", err);
    }
  };

  const handleResetSystem = async () => {
    if (!confirm('ESTS ABSOLUTAMENTE SEGURO? Esta accin borrar todos los productos, ventas, movimientos, clientes y reparaciones. Esta accin NO se puede deshacer.')) {
      return;
    }

    const verification = prompt('Por favor, ingresa "BORRAR TODO" para confirmar:');
    if (verification !== 'BORRAR TODO') {
      alert('Confirmacin incorrecta. No se borr nada.');
      return;
    }

    setLoading(true);
    try {
      // Deleting in order to avoid FK issues
      await insforge.database.from('sales').delete().neq('id', '0');
      await insforge.database.from('movements').delete().neq('id', '0');
      await insforge.database.from('technical_services').delete().neq('id', '0');
      await insforge.database.from('credits').delete().neq('id', '0');
      await insforge.database.from('products').delete().neq('id', '0');
      await insforge.database.from('customers').delete().neq('id', '0');
      
      alert('Sistema restablecido correctamente. La pgina se recargar.');
      window.location.reload();
    } catch (err) {
      console.error("Error resetting system", err);
      alert('Error al restablecer el sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      const { data, error } = await insforge.database
        .from('app_settings')
        .update(camelToSnake(newSettings))
        .eq('id', 'settings')
        .select();
        
      if (error) throw error;
      if (data && data.length > 0) {
        setSettings(snakeToCamel(data[0]));
      }
    } catch (err) {
      console.error("Error updating settings", err);
    }
  };

  const generateAIAnalysis = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateInventoryReport({ 
        inventory: filteredInventory, 
        sales: filteredSales, 
        services: filteredServices 
      });
      setAiReport(report || "No se pudo generar el reporte.");
    } catch (err) {
      console.error("Error generating AI analysis", err);
      setAiReport("Error al generar el reporte.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!aiReport) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Inteligencia - Mundo Celular Zelin</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                .no-print { display: none; }
                body { padding: 40px; }
              }
              body { font-family: sans-serif; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
              th { background-color: #f8fafc; font-weight: bold; }
              h1, h2, h3 { font-weight: 800; color: #0f172a; margin-top: 2em; margin-bottom: 0.5em; }
              h1 { font-size: 2.5em; margin-top: 0; }
            </style>
          </head>
          <body class="bg-white p-10">
            <div class="max-w-4xl mx-auto">
              <header class="flex items-center justify-between mb-8 border-b pb-8">
                <div>
                  <h1 class="text-3xl font-black text-slate-900 m-0">Mundo Celular Zelin</h1>
                  <p class="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Análisis de Inteligencia de Negocios</p>
                </div>
                <div class="text-right text-xs text-slate-400">
                  <p>Fecha: ${new Date().toLocaleDateString('es-PE')}</p>
                  <p>Generado por: Mundo Celular AI</p>
                </div>
              </header>
              <div class="prose max-w-none">
                ${document.querySelector('.prose')?.innerHTML || "Contenido del reporte..."}
              </div>
              <footer class="mt-12 pt-8 border-t border-slate-100 text-center text-[10px] text-slate-300 italic">
                <p>Este reporte es de carácter informativo y generado automáticamente basado en los datos del sistema.</p>
              </footer>
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleShareReport = async () => {
    if (!aiReport) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reporte de Inteligencia - Mundo Celular Zelin',
          text: 'Acabo de generar este reporte de inteligencia de negocios para Mundo Celular Zelin.',
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing report', err);
      }
    } else {
      navigator.clipboard.writeText(aiReport);
      alert('Contenido del reporte copiado al portapapeles');
    }
  };

  if (loading) return <LoadingSplash />;

  if (isLandingView || (!user && !showAuth)) {
    return (
      <div className="relative min-h-screen">
        <LandingPage 
          user={user}
          onGoToPanel={() => setIsLandingView(false)}
          branches={branches} 
          inventory={inventory} 
          selectedBranchId={selectedBranchId}
          onBranchSelect={setSelectedBranchId}
          onLoginClick={() => { setAuthMode('login'); setShowAuth(true); setIsLandingView(false); }}
          onRegisterClick={() => { setAuthMode('register'); setShowAuth(true); setIsLandingView(false); }}
          cart={cart}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          sendToWhatsApp={sendToWhatsApp}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          buyNow={buyNow}
          settings={settings}
        />
      </div>
    );
  }

  if (!user && showAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        <button 
          onClick={() => setIsLandingView(true)}
          className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold z-10"
        >
          <ChevronRight className="rotate-180 w-5 h-5" /> <span className="hidden sm:inline">Volver al Inicio</span>
        </button>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100 my-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="text-primary w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Mundo Celular Zelin</h1>
            <p className="text-slate-500 mt-2 text-xs md:text-sm uppercase tracking-widest font-semibold">
              {isVerifying ? 'Verificar Correo' : (authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </p>
          </div>

          {isVerifying ? (
            <form onSubmit={handleVerify} className="space-y-6">
              <p className="text-sm text-slate-600 text-center">
                Hemos enviado un código a <strong>{email}</strong>. Por favor, ingrésalo a continuación.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Verificación</label>
                <input 
                  type="text" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary text-center text-2xl tracking-widest font-bold outline-none transition-all"
                  placeholder="000000"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              {resendMessage && <p className="text-green-500 text-sm font-medium">{resendMessage}</p>}
              <button 
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Verificar y Entrar
              </button>
              <div className="flex flex-col gap-2 mt-4">
                <button 
                  type="button"
                  onClick={handleResendCode}
                  className="w-full text-primary text-sm font-bold hover:underline"
                >
                  Reenviar código
                </button>
                <button 
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="w-full text-slate-500 text-sm font-bold hover:underline"
                >
                  Volver
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-6">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="ejemplo@zelin.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              {authMode === 'login' ? 'Entrar' : 'Registrarse'}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">O</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-slate-700 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.63l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-sm text-primary font-bold hover:underline"
            >
              {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">© 2026 Mundo Celular Zelin - Todos los derechos reservados</p>
          </div>
        </>
      )}
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null; // Safety check
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50",
        isMobile 
          ? cn("fixed inset-y-0 left-0 w-64 transform", isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full")
          : (isSidebarOpen ? "w-64" : "w-20")
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="text-white w-6 h-6" />
            </div>
            {(isSidebarOpen || isMobile) && <span className="font-bold text-lg truncate">Zelin Celular</span>}
          </div>
          {isMobile && (
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'view_store') {
                  setIsLandingView(true);
                } else {
                  setActiveTab(item.id);
                  if (item.id === 'inventory') {
                    setInventoryFilterBranchId(null);
                  }
                }
                if (isMobile) setIsMobileSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all group",
                activeTab === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "text-white" : "group-hover:text-primary")} />
              {(isSidebarOpen || isMobile) && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all",
              (!isSidebarOpen && !isMobile) && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {(isSidebarOpen || isMobile) && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => isMobile ? setIsMobileSidebarOpen(true) : setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobile ? <Menu className="w-5 h-5" /> : (isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />)}
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView user={user} inventory={filteredInventory} sales={filteredSales} services={filteredServices} branches={filteredBranches} />}
              {activeTab === 'customers' && <CustomersView customers={filteredCustomers} sales={filteredSales} />}
              {activeTab === 'sales' && <SalesView sales={filteredSales} inventory={filteredInventory} user={user} onAddSale={handleAddSale} />}
              {activeTab === 'credits' && <CreditsView credits={filteredCredits} />}
              {activeTab === 'technical' && <TechnicalServiceView services={filteredServices} user={user} />}
              {activeTab === 'my_purchases' && <MyPurchasesView sales={filteredSales} credits={filteredCredits} />}
              {activeTab === 'inventory' && (
                <InventoryView 
                  inventory={filteredInventory} 
                  user={user} 
                  branches={filteredBranches} 
                  onAdd={handleAddProduct}
                  onUpdate={handleUpdateProduct}
                  onDelete={handleDeleteProduct}
                  onBulkAdd={handleBulkAdd}
                  initialBranchId={inventoryFilterBranchId}
                />
              )}
              {activeTab === 'movements' && (
                <MovementsView 
                  movements={filteredMovements} 
                  branches={filteredBranches} 
                  user={user} 
                  inventory={inventory}
                  onAdd={handleAddMovement}
                />
              )}
              {activeTab === 'income' && <IncomeExpensesView movements={filteredMovements} branches={filteredBranches} />}
              {activeTab === 'reports_list' && (
                <DetailedReportsView 
                  sales={filteredSales} 
                  inventory={filteredInventory} 
                  movements={filteredMovements} 
                  branches={filteredBranches} 
                  services={filteredServices} 
                />
              )}
              {activeTab === 'reports' && <ReportsView aiReport={aiReport} onGenerate={generateAIAnalysis} isGenerating={isGeneratingReport} onDownload={handleDownloadPDF} onShare={handleShareReport} />}
              {activeTab === 'branches' && (
                <BranchesView 
                  branches={branches} 
                  onAdd={handleAddBranch} 
                  onUpdate={handleUpdateBranch} 
                  onDelete={handleDeleteBranch} 
                  onViewInventory={(branchId: string) => {
                    setInventoryFilterBranchId(branchId);
                    setActiveTab('inventory');
                  }}
                />
              )}
              {activeTab === 'users' && (
                <UsersView 
                  users={users} 
                  branches={branches} 
                  onAdd={handleAddUser}
                  onUpdate={handleUpdateUser}
                  onDelete={handleDeleteUser}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView 
                  settings={settings} 
                  onUpdate={handleUpdateSettings} 
                  onResetSystem={handleResetSystem}
                  user={user}
                  branches={filteredBranches}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function UsersView({ users, branches, onUpdate, onDelete }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Gestión de Usuarios</h3>
          <p className="text-sm text-slate-500 font-medium">Administra el personal y sus permisos</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white shadow-sm"
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Sucursal</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                      u.role === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-600" :
                      u.role === 'ADMIN_SUCURSAL' ? "bg-blue-100 text-blue-600" :
                      u.role === 'VENDEDOR' ? "bg-green-100 text-green-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-medium">
                        {u.branchId ? branches.find((b: any) => b.id === u.branchId)?.name : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingUser(u);
                          setShowAddModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este usuario?')) {
                            onDelete(u.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {filteredUsers.map((u: any) => (
            <div key={u.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingUser(u);
                      setShowAddModal(true);
                    }}
                    className="p-2 bg-slate-50 rounded-lg text-slate-400"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar este usuario?')) {
                        onDelete(u.id);
                      }
                    }}
                    className="p-2 bg-red-50 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rol</p>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold uppercase inline-block",
                    u.role === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-600" :
                    u.role === 'ADMIN_SUCURSAL' ? "bg-blue-100 text-blue-600" :
                    u.role === 'VENDEDOR' ? "bg-green-100 text-green-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {u.role.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sucursal</p>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Store className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-medium">
                      {u.branchId ? branches.find((b: any) => b.id === u.branchId)?.name : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddUserModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onUpdate={onUpdate}
        editingUser={editingUser}
        branches={branches}
      />
    </div>
  );
}

function AddUserModal({ isOpen, onClose, onUpdate, editingUser, branches }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VENDEDOR',
    branchId: ''
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        password: '', // Don't show password
        role: editingUser.role,
        branchId: editingUser.branchId || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'VENDEDOR',
        branchId: branches[0]?.id || ''
      });
    }
  }, [editingUser, isOpen, branches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdate(editingUser.id, formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Editar Usuario</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              placeholder="juan@zelin.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <input 
              type="password" 
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              placeholder={editingUser ? "Dejar en blanco para no cambiar" : "••••••••"}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN_SUCURSAL">Admin Sucursal</option>
                <option value="VENDEDOR">Vendedor</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sucursal</label>
              <select 
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                disabled={formData.role === 'SUPER_ADMIN'}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white disabled:bg-slate-50"
              >
                <option value="">Ninguna</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">Cancelar</button>
            <button 
              type="submit"
              className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function SettingsView({ settings, onUpdate, onResetSystem, user, branches }: any) {
  const [formData, setFormData] = useState(settings || {});
  const [isSaving, setIsSaving] = useState(false);

  const currentBranch = branches.find((b: any) => b.id === user.branchId);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdate(formData);
    setIsSaving(false);
    alert('Configuración guardada correctamente');
  };

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Configuración del Sistema</h3>
          <p className="text-sm text-slate-500 font-medium">Personaliza los parámetros globales de Mundo Celular Zelin</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {/* Store Info */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-slate-900">
              {user.role === 'SUPER_ADMIN' ? 'Información de la Empresa' : 'Información de la Sucursal'}
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {user.role === 'SUPER_ADMIN' ? 'Nombre de la Tienda' : 'Nombre de la Sucursal'}
              </label>
              <input 
                type="text" 
                value={user.role === 'SUPER_ADMIN' ? formData.storeName : (currentBranch?.name || '')}
                onChange={(e) => user.role === 'SUPER_ADMIN' && setFormData({ ...formData, storeName: e.target.value })}
                disabled={user.role !== 'SUPER_ADMIN'}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</label>
              <input 
                type="text" 
                value={user.role === 'SUPER_ADMIN' ? formData.address : (currentBranch?.address || '')}
                onChange={(e) => user.role === 'SUPER_ADMIN' && setFormData({ ...formData, address: e.target.value })}
                disabled={user.role !== 'SUPER_ADMIN'}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email de Contacto</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-slate-900">Parámetros de Inventario</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Umbral de Stock Bajo</label>
              <input 
                type="number" 
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Define la cantidad mínima de productos antes de que el sistema marque una alerta de stock bajo en el inventario.
            </p>
          </div>
        </div>

        {/* Integration Settings */}
        {user.role === 'SUPER_ADMIN' && (
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-slate-900">Configuración de Tienda</h4>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mensaje Predeterminado WhatsApp</label>
                <textarea 
                  value={formData.whatsappMessage}
                  onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[100px]"
                  placeholder="Ej: Hola, estoy interesado en este producto..."
                />
                <p className="text-[10px] text-slate-400 font-medium">Este mensaje aparecerá automáticamente cuando el cliente haga clic en comprar desde la tienda.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">Chat con IA</p>
                  <p className="text-xs text-slate-500">Habilitar asistente en tienda</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, enableAiAnalysis: !formData.enableAiAnalysis })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    formData.enableAiAnalysis ? "bg-primary" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                    formData.enableAiAnalysis ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Actions */}
        {user.role === 'SUPER_ADMIN' && (
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-5 h-5 text-red-500" />
              <h4 className="font-bold text-slate-900">Acciones Críticas</h4>
            </div>
            
            <div className="space-y-4">
              <button 
                type="button"
                onClick={onResetSystem}
                className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-all text-left"
              >
                <div>
                  <p className="text-sm font-bold text-red-600">Restablecer Sistema</p>
                  <p className="text-[10px] text-red-500 uppercase font-black tracking-widest mt-1">Borrar todos los datos (Irreversible)</p>
                </div>
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              <p className="text-[10px] text-slate-400 font-medium">
                Esta acción borrará: Productos, Ventas, Movimientos, Clientes, Créditos y Reparaciones. Los usuarios y sucursales NO serán borrados.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderView({ title, icon: Icon }: any) {
  return (
    <div className="glass-card p-12 text-center max-w-2xl mx-auto mt-12">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Icon className="text-primary w-10 h-10" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      <p className="text-slate-500 mt-3 leading-relaxed">
        Esta sección está en desarrollo. Pronto podrás gestionar todos los datos de {title.toLowerCase()} desde aquí.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <div className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-widest">
          Próximamente
        </div>
      </div>
    </div>
  );
}

// Sub-views
function MyPurchasesView({ sales, credits }: any) {
  return (
    <div className="space-y-8">
      <div className="glass-card p-4 md:p-8">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <ShoppingCart className="text-primary w-6 h-6 md:w-8 md:h-8" />
          Mis Equipos Comprados
        </h3>
        
        <div className="space-y-6">
          {sales.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aún no has realizado compras.</p>
            </div>
          ) : (
            sales.map((sale: any) => (
              <div key={sale.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex justify-between sm:block">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                      <p className="font-bold text-sm md:text-base text-slate-900">{formatPeruDate(sale.date)}</p>
                    </div>
                    <div className="sm:hidden">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        sale.type === 'CONTADO' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {sale.type}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-sm">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full font-bold uppercase tracking-wider",
                      sale.type === 'CONTADO' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {sale.type}
                    </span>
                  </div>
                  <div className="text-right flex justify-between sm:block border-t sm:border-t-0 pt-3 sm:pt-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:block hidden">Total</p>
                    <span className="text-xs font-bold text-slate-400 uppercase sm:hidden">Total</span>
                    <p className="text-lg md:text-xl font-black text-primary">S/ {sale.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 bg-slate-50/50">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Detalle de Equipos</h4>
                  <div className="space-y-3">
                    {sale.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 md:p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                            <Smartphone className="text-primary w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500">Cantidad: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-bold text-sm text-slate-900 shrink-0">S/ {item.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {sale.type === 'CREDITO' && (
                  <div className="p-4 md:p-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Wallet className="w-4 h-4" /> Detalle de Cuotas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {credits.find((c: any) => c.saleId === sale.id)?.installments.map((inst: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Cuota {idx + 1}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              inst.status === 'PAGADO' ? "bg-green-100 text-green-600" : 
                              inst.status === 'ATRASADO' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                            )}>
                              {inst.status}
                            </span>
                          </div>
                          <p className="text-lg font-black text-slate-900">S/ {inst.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Vence: {new Date(inst.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-6">
      <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
        <Icon className="text-primary w-7 h-7" />
      </div>
      <div>
        <h4 className="text-xl font-bold mb-2">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// Sub-views
function DashboardView({ user, inventory, sales, services, branches = [] }: any) {
  const totalSales = sales.reduce((acc: number, s: any) => acc + s.total, 0);
  const pendingServices = services.filter((s: any) => s.status !== 'ENTREGADO').length;
  const lowStock = inventory.filter((i: any) => i.stock < 5).length;

  // Real Week Chart Data
  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const data = days.map(day => ({ name: day, ventas: 0 }));
    
    // Get last 7 days
    const today = new Date();
    sales.forEach((s: any) => {
      const saleDate = new Date(s.date);
      // Check if it's within last 7 days (approx) or same week
      const diffTime = Math.abs(today.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        const dayIdx = saleDate.getDay();
        data[dayIdx].ventas += s.total;
      }
    });

    // Reorder so it starts from Monday or follows a logical sequence for the user
    // In Peru, normally Mon-Sun
    const mondayFirst = [data[1], data[2], data[3], data[4], data[5], data[6], data[0]];
    return mondayFirst;
  }, [sales]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR'].includes(user.role) && (
          <>
            <StatCard title="Ventas Totales" value={`S/ ${totalSales.toLocaleString()}`} icon={ShoppingCart} color="bg-blue-500" />
            <StatCard title="Servicios Pendientes" value={pendingServices} icon={Wrench} color="bg-orange-500" />
            <StatCard title="Productos Bajo Stock" value={lowStock} icon={AlertCircle} color="bg-red-500" />
            {user.role === 'SUPER_ADMIN' && (
              <StatCard title="Sucursales Activas" value={branches.length} icon={Store} color="bg-primary" />
            )}
          </>
        )}
      </div>

      {['SUPER_ADMIN', 'ADMIN_SUCURSAL', 'VENDEDOR'].includes(user.role) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-lg font-bold mb-6">Ventas de la Semana</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="ventas" fill="#84cc16" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 md:p-8">
            <h3 className="text-lg font-bold mb-6">Ventas Recientes</h3>
            <div className="space-y-4">
              {sales.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
                      <ShoppingCart className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{s.customerName}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="truncate">{formatPeruDate(s.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-sm text-primary">S/ {s.total.toLocaleString()}</p>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                      s.type === 'CONTADO' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {s.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 md:p-8">
            <h3 className="text-lg font-bold mb-6">Servicios Técnicos Recientes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.slice(0, 6).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
                      <Smartphone className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{s.device}</p>
                      <p className="text-xs text-slate-500 truncate">{s.customerName}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2",
                    s.status === 'LISTO' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 flex items-center gap-4 md:gap-6"
    >
      <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0", color)}>
        <Icon className="text-white w-6 h-6 md:w-7 md:h-7" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className="text-xl md:text-2xl font-black text-slate-900 mt-1 truncate">{value}</p>
      </div>
    </motion.div>
  );
}

function InventoryView({ inventory, user, branches, onAdd, onUpdate, onDelete, onBulkAdd, initialBranchId }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(
    initialBranchId || (user.role === 'SUPER_ADMIN' ? 'all' : user.branchId)
  );

  useEffect(() => {
    if (initialBranchId) {
      setSelectedBranchId(initialBranchId);
    } else if (initialBranchId === null) {
      setSelectedBranchId(user.role === 'SUPER_ADMIN' ? 'all' : user.branchId);
    }
  }, [initialBranchId, user.role, user.branchId]);

  const filteredInventory = inventory.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = selectedBranchId === 'all' || item.branchId === selectedBranchId;
    
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:max-w-3xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar producto, marca o modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white shadow-sm"
            />
          </div>

          {user.role === 'SUPER_ADMIN' && (
            <div className="relative w-full md:w-64 shrink-0">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white shadow-sm appearance-none"
              >
                <option value="all">Todas las Sucursales</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowScannerModal(true)}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
          >
            <QrCode className="w-4 h-4" /> Escanear
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
          >
            <Upload className="w-4 h-4" /> Carga Masiva
          </button>
          <button 
            onClick={() => {
              setScannedBarcode('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Categoría</th>
                {user.role === 'SUPER_ADMIN' && <th className="px-6 py-4">Sucursal</th>}
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="font-bold text-sm text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.brand}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                      {item.category}
                    </span>
                  </td>
                  {user.role === 'SUPER_ADMIN' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600">
                          {branches.find((b: any) => b.id === item.branchId)?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "font-bold text-sm",
                      item.stock < 5 ? "text-red-500" : "text-slate-900"
                    )}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-primary">S/ {item.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedProduct(item)}
                      className="text-slate-400 hover:text-primary p-2 hover:bg-primary/5 rounded-lg transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {filteredInventory.map((item: any) => (
            <div key={item.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.brand} • {item.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProduct(item)}
                  className="text-slate-400 hover:text-primary p-2 hover:bg-primary/5 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                  <p className={cn(
                    "text-sm font-bold",
                    item.stock < 5 ? "text-red-500" : "text-slate-900"
                  )}>{item.stock}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precio</p>
                  <p className="text-sm font-black text-primary">S/ {item.price.toLocaleString()}</p>
                </div>
                {user.role === 'SUPER_ADMIN' && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sucursal</p>
                    <p className="text-[10px] font-medium text-slate-600 truncate">
                      {branches.find((b: any) => b.id === item.branchId)?.name || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddProductModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        branches={branches}
        user={user}
        onAdd={onAdd}
        initialBarcode={scannedBarcode}
      />
      <BulkUploadModal 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)} 
        onBulkAdd={onBulkAdd}
        branches={branches}
      />
      <ScannerModal 
        isOpen={showScannerModal} 
        onClose={() => setShowScannerModal(false)} 
        onScan={(code: string) => {
          setShowScannerModal(false);
          const existing = inventory.find((p: any) => p.barcode === code);
          if (existing) {
            setSelectedProduct(existing);
          } else {
            setScannedBarcode(code);
            setShowAddModal(true);
          }
        }}
      />
      <ProductDetailsModal 
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onUpdate={onUpdate}
        onDelete={onDelete}
        branches={branches}
        user={user}
      />
    </div>
  );
}

function ProductDetailsModal({ isOpen, onClose, product, onUpdate, onDelete, branches, user }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setEditedProduct({ 
        ...product,
        specifications: Array.isArray(product.specifications) ? product.specifications.join('\n') : (product.specifications || '')
      });
      setSelectedFile(null);
      setIsUploading(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleUpdate = async () => {
    setIsUploading(true);
    let imageUrl = editedProduct.image;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('zelin')
          .upload(fileName, selectedFile);
          
        if (uploadError) throw uploadError;

        if (uploadData && uploadData.url) {
          imageUrl = uploadData.url;
        }
      }

      const finalSpecs = editedProduct.specifications 
        ? editedProduct.specifications.split('\n').filter((s: string) => s.trim() !== '') 
        : [];

      await onUpdate({ ...editedProduct, image: imageUrl, specifications: finalSpecs });
      setIsEditing(false);
      onClose();
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setSelectedFile(compressed);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditedProduct({ ...editedProduct, image: reader.result as string });
        };
        reader.readAsDataURL(compressed);
      } catch (err) {
        console.error("Compression error", err);
        setSelectedFile(file);
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      onDelete(product.id);
      onClose();
    }
  };

  const isBranchAdmin = user.role === 'ADMIN_SUCURSAL';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Editar Producto' : 'Detalles del Producto'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {isEditing ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden group relative"
                >
                  {editedProduct.image ? (
                    <>
                      <img src={editedProduct.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="text-white w-8 h-8" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="text-slate-400 w-8 h-8 mb-2" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cambiar Imagen</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</label>
                  <input 
                    type="text" 
                    value={editedProduct.name}
                    onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Marca</label>
                  <input 
                    type="text" 
                    value={editedProduct.brand}
                    onChange={(e) => setEditedProduct({ ...editedProduct, brand: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
                  <select 
                    value={editedProduct.category}
                    onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  >
                    <option>Celulares</option>
                    <option>Accesorios</option>
                    <option>Tablets</option>
                    <option>Servicio Técnico</option>
                    <option>Parlantes</option>
                    <option>Electrodomésticos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Precio (S/)</label>
                  <input 
                    type="number" 
                    value={editedProduct.price}
                    onChange={(e) => setEditedProduct({ ...editedProduct, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stock</label>
                <input 
                  type="number" 
                  value={editedProduct.stock}
                  onChange={(e) => setEditedProduct({ ...editedProduct, stock: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción (Opcional)</label>
                <textarea 
                  value={editedProduct.description || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Especificaciones (Una por línea)</label>
                <textarea 
                  value={editedProduct.specifications || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, specifications: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none text-sm" 
                  placeholder="Ej: Pantalla OLED&#10;Cámara 48MP"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-slate-100 rounded-3xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Smartphone className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">{product.name}</h4>
                  <p className="text-slate-500 font-medium">{product.brand} • {product.category}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-2xl font-bold text-primary">S/ {product.price.toLocaleString()}</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      product.stock < 5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Descripción</h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description || 'Sin descripción.'}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Especificaciones</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                    product.specifications.map((s: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        {s}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin especificaciones registradas.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Información de Sucursal</h5>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-900">
                      {branches.find((b: any) => b.id === product.branchId)?.name || 'Sucursal Desconocida'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {branches.find((b: any) => b.id === product.branchId)?.address || '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">ID de Producto</h5>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-mono text-xs text-slate-600">{product.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Eliminar Producto
          </button>
          <div className="flex gap-4">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={isUploading}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Editar Producto
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AddProductModal({ isOpen, onClose, branches, user, onAdd, initialBarcode }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Celulares',
    price: 0,
    stock: 0,
    barcode: '',
    branchId: '',
    description: '',
    specifications: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const isBranchAdmin = user.role === 'ADMIN_SUCURSAL';
      setFormData({
        name: '',
        brand: '',
        category: 'Celulares',
        price: 0,
        stock: 0,
        barcode: initialBarcode || '',
        branchId: isBranchAdmin ? user.branchId : (branches[0]?.id || ''),
        description: '',
        specifications: ''
      });
      setImage(null);
      setSelectedFile(null);
      setIsUploading(false);
    }
  }, [isOpen, user, branches, initialBarcode]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setSelectedFile(compressed);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(compressed);
      } catch (err) {
        console.error("Compression error", err);
        // Fallback to original if compression fails
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.brand) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    setIsUploading(true);
    let imageUrl = image;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('zelin')
          .upload(fileName, selectedFile);
          
        if (uploadError) {
          throw uploadError;
        }

        if (uploadData && uploadData.url) {
          imageUrl = uploadData.url;
        }
      }

      const finalSpecs = formData.specifications 
        ? formData.specifications.split('\n').filter(s => s.trim() !== '') 
        : [];

      onAdd({
        ...formData,
        specifications: finalSpecs,
        image: imageUrl
      });
      onClose();
    } catch (error: any) {
      alert('Error al subir la imagen: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const isBranchAdmin = user.role === 'ADMIN_SUCURSAL';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-4 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Añadir Nuevo Producto</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden group relative"
            >
              {image ? (
                <>
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </>
              ) : (
                <>
                  <Camera className="text-slate-400 w-8 h-8 mb-2" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subir Imagen</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre del Producto</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                placeholder="Ej: iPhone 15 Pro" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Marca</label>
              <input 
                type="text" 
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                placeholder="Ej: Apple" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option>Celulares</option>
                <option>Accesorios</option>
                <option>Tablets</option>
                <option>Servicio Técnico</option>
                <option>Parlantes</option>
                <option>Electrodomésticos</option>
              </select>
            </div>
            {!isBranchAdmin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sucursal</label>
                <select 
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Precio (S/)</label>
              <input 
                type="number" 
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                placeholder="0.00" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stock Inicial</label>
              <input 
                type="number" 
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                placeholder="0" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Código de Barras / IMEI</label>
            <div className="relative">
              <input 
                type="text" 
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20" 
                placeholder="Escanear o ingresar manualmente" 
              />
              <Camera className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 cursor-pointer hover:text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción (Opcional)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none text-sm" 
              placeholder="Describe las características principales..." 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Especificaciones (Una por línea)</label>
            <textarea 
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none text-sm" 
              placeholder={`Ej: Pantalla 6.7" OLED\nCámara 48MP\nBatería 5000mAh`}
            />
          </div>
        </div>
        <div className="p-8 bg-slate-50 flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isUploading}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Producto'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BulkUploadModal({ isOpen, onClose, onBulkAdd, branches }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5));
        }
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setLogs('Procesando archivo...');

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rawData = results.data;
          setLogs(`Preparando ${rawData.length} productos...`);
          
          const products = rawData.map((row: any) => {
            let branchId = row.sucursal_id || row.branchId;
            if (!branchId && (row.sucursal || row.branch) && branches.length > 0) {
              const bName = row.sucursal || row.branch;
              const match = branches.find((b: any) => b.name.toLowerCase().includes(bName.toLowerCase()));
              if (match) branchId = match.id;
            }

            return {
              name: row.nombre || row.name || 'Producto sin nombre',
              brand: row.marca || row.brand || '',
              category: row.categoria || row.category || 'Celulares',
              price: Number(row.precio || row.price || 0),
              stock: Number(row.stock || 0),
              branchId: branchId || branches[0]?.id || '',
              barcode: String(row.codigo_barras || row.barcode || row.imei || ''),
            };
          });

          const result = await onBulkAdd(products);
          if (result.success) {
            setLogs(`¡Éxito! Se cargaron ${result.count} productos.`);
            setTimeout(() => {
              onClose();
              setFile(null);
              setPreview([]);
              setLogs('');
            }, 2000);
          } else {
            setLogs(`Error: ${result.error}`);
          }
          setIsProcessing(false);
        }
      });
    } catch (err: any) {
      setLogs(`Error crítico: ${err.message}`);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Carga Masiva de Productos</h3>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {!file ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer relative group">
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-primary w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900">Seleccionar archivo CSV</h4>
              <p className="text-sm text-slate-500 mt-2">Haz clic o arrastra tu archivo aquí</p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <FileText className="text-primary w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{file.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {!isProcessing && (
                <button onClick={() => setFile(null)} className="text-xs font-bold text-red-500 hover:text-red-600">Cambiar archivo</button>
              )}
            </div>
          )}

          {preview.length > 0 && !isProcessing && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vista previa (Primeras 5 filas)</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {Object.keys(preview[0]).map(key => <th key={key} className="px-4 py-3 font-bold text-slate-500">{key}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {Object.values(row).map((val: any, j) => <td key={j} className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{val}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-green-400 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>{logs}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg shrink-0">
              <AlertCircle className="text-blue-600 w-5 h-5" />
            </div>
            <div className="text-xs text-blue-700 leading-relaxed flex-1">
              <p className="font-bold mb-1">Instrucciones:</p>
              <p className="mb-3 font-medium">Columnas requeridas: <b>nombre, marca, categoria, precio, stock, sucursal_id, codigo_barras</b>.</p>
              <button 
                onClick={() => {
                  const headers = "nombre,marca,categoria,precio,stock,sucursal_id,codigo_barras\n";
                  const sample = "iPhone 15 Pro,Apple,Celulares,4500,10,ID_SUCURSAL,123456789";
                  const blob = new Blob(["\ufeff" + headers + sample], { type: 'text/csv;charset=utf-8' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'plantilla_zelin.csv';
                  a.click();
                }}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-bold border border-blue-100 shadow-sm hover:bg-blue-50 transition-all font-sans"
              >
                <Download className="w-4 h-4" /> Descargar Plantilla .CSV
              </button>
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
          <button onClick={onClose} disabled={isProcessing} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all text-sm">Cancelar</button>
          <button 
            disabled={!file || isProcessing} 
            onClick={handleImport}
            className="group bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Confirmar e Importar
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ScannerModal({ isOpen, onClose, onScan }: any) {
  const scannerRef = useRef<any>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Use Html5QrcodeScanner from global or import if available
      // Assuming it's available via script tag or similar in the project
      try {
        const scanner = new (window as any).Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        scannerRef.current = scanner;
        scanner.render((decodedText: string) => {
          setScannedResult(decodedText);
          onScan(decodedText);
        }, (error: any) => {
          // ignore failures
        });
      } catch (err) {
        console.error("Scanner init error", err);
      }
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, [isOpen]);


  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Escáner de Productos</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-8">
          <div id="reader" className="overflow-hidden rounded-2xl border-2 border-slate-100"></div>
          
          {scannedResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Código Detectado</p>
                <p className="text-lg font-bold text-slate-900">{scannedResult}</p>
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all">
                Usar Código
              </button>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">Apunta la cámara al código de barras o QR del producto</p>
          </div>
        </div>
        <div className="p-8 bg-slate-50 flex justify-center">
          <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">Cerrar Escáner</button>
        </div>
      </motion.div>
    </div>
  );
}

function MovementsView({ movements, branches, user, inventory, onAdd }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filteredMovements = movements.filter((m: any) => {
    const typeMatch = filterType === 'ALL' || m.type === filterType;
    const catMatch = filterCategory === 'ALL' || m.category === filterCategory;
    return typeMatch && catMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm font-medium"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="INGRESO">Ingresos</option>
            <option value="EGRESO">Egresos</option>
            <option value="TRASLADO">Traslados</option>
          </select>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm font-medium"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="CAJA">Caja (Dinero)</option>
            <option value="INVENTARIO">Inventario (Productos)</option>
          </select>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full lg:w-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Movimiento
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Monto / Cant.</th>
                <th className="px-6 py-4">Usuario / Sucursal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{formatPeruDate(m.date)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit",
                      m.type === 'INGRESO' ? "bg-green-100 text-green-600" : 
                      m.type === 'EGRESO' ? "bg-red-100 text-red-600" : 
                      "bg-blue-100 text-blue-600"
                    )}>
                      {m.type === 'INGRESO' && <ArrowDownLeft className="w-3 h-3" />}
                      {m.type === 'EGRESO' && <ArrowUpRight className="w-3 h-3" />}
                      {m.type === 'TRASLADO' && <ArrowLeftRight className="w-3 h-3" />}
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500">{m.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium">{m.description}</div>
                    {m.productName && <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">{m.productName}</div>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {m.amount ? (
                      <span className={cn(
                        "font-bold text-sm",
                        m.type === 'INGRESO' ? "text-green-600" : "text-red-600"
                      )}>
                        {m.type === 'INGRESO' ? '+' : '-'} S/ {m.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-bold text-sm text-slate-900">
                        {m.quantity} und.
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-900">{m.userName}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                      {branches.find((b: any) => b.id === m.branchId)?.name}
                      {m.targetBranchId && ` → ${branches.find((b: any) => b.id === m.targetBranchId)?.name}`}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredMovements.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((m: any) => (
            <div key={m.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{formatPeruDate(m.date)}</div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit",
                    m.type === 'INGRESO' ? "bg-green-100 text-green-600" : 
                    m.type === 'EGRESO' ? "bg-red-100 text-red-600" : 
                    "bg-blue-100 text-blue-600"
                  )}>
                    {m.type === 'INGRESO' && <ArrowDownLeft className="w-2.5 h-2.5" />}
                    {m.type === 'EGRESO' && <ArrowUpRight className="w-2.5 h-2.5" />}
                    {m.type === 'TRASLADO' && <ArrowLeftRight className="w-2.5 h-2.5" />}
                    {m.type}
                  </span>
                </div>
                <div className="text-right">
                  {m.amount ? (
                    <div className={cn(
                      "font-black text-base",
                      m.type === 'INGRESO' ? "text-green-600" : "text-red-600"
                    )}>
                      {m.type === 'INGRESO' ? '+' : '-'} S/ {m.amount.toLocaleString()}
                    </div>
                  ) : (
                    <div className="font-black text-base text-slate-900">
                      {m.quantity} und.
                    </div>
                  )}
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{m.category}</div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-sm text-slate-700 font-medium leading-tight">{m.description}</div>
                {m.productName && <div className="text-[10px] text-primary font-bold mt-1 uppercase">{m.productName}</div>}
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="text-[10px] font-bold text-slate-900">{m.userName}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold">
                  {branches.find((b: any) => b.id === m.branchId)?.name}
                  {m.targetBranchId && ` → ${branches.find((b: any) => b.id === m.targetBranchId)?.name}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddMovementModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        branches={branches}
        inventory={inventory}
        user={user}
        onAdd={onAdd}
      />
    </div>
  );
}

function AddMovementModal({ isOpen, onClose, branches, inventory, user, onAdd }: any) {
  const [formData, setFormData] = useState({
    type: 'INGRESO',
    category: 'CAJA',
    description: '',
    amount: '',
    quantity: '',
    productId: '',
    productName: '',
    branchId: user.branchId || branches[0]?.id || '',
    targetBranchId: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      amount: formData.amount ? Number(formData.amount) : undefined,
      quantity: formData.quantity ? Number(formData.quantity) : undefined,
      userId: user.id,
      userName: user.name,
      date: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-4 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Registrar Movimiento</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                  <option value="TRASLADO">Traslado</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="CAJA">Caja (Dinero)</option>
                  <option value="INVENTARIO">Inventario (Stock)</option>
                </select>
              </div>
            </div>

            {formData.category === 'INVENTARIO' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Producto</label>
                <select 
                  required
                  value={formData.productId}
                  onChange={(e) => {
                    const prod = inventory.find((p: any) => p.id === e.target.value);
                    setFormData({ ...formData, productId: e.target.value, productName: prod?.name || '' });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white appearance-none"
                >
                  <option value="">Seleccionar producto...</option>
                  {(inventory || []).filter((p: any) => p.branchId === formData.branchId || user.role === 'SUPER_ADMIN').map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción</label>
              <textarea 
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                placeholder="Motivo del movimiento..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.category === 'CAJA' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monto (S/)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cantidad</label>
                  <input 
                    type="number" 
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="0"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sucursal</label>
                <select 
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            {formData.type === 'TRASLADO' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sucursal Destino</label>
                <select 
                  required
                  value={formData.targetBranchId}
                  onChange={(e) => setFormData({ ...formData, targetBranchId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="">Seleccionar destino...</option>
                  {branches.filter((b: any) => b.id !== formData.branchId).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="p-4 md:p-8 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">Cancelar</button>
            <button type="submit" className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Registrar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function IncomeExpensesView({ movements, branches }: any) {
  const financialMovements = movements.filter((m: any) => m.category === 'CAJA');
  
  const totalIncome = financialMovements
    .filter((m: any) => m.type === 'INGRESO')
    .reduce((acc: number, m: any) => acc + (m.amount || 0), 0);
    
  const totalExpenses = financialMovements
    .filter((m: any) => m.type === 'EGRESO')
    .reduce((acc: number, m: any) => acc + (m.amount || 0), 0);
    
  const balance = totalIncome - totalExpenses;

  // Prepare chart data (last 7 days or similar)
  const chartData = financialMovements.reduce((acc: any[], m: any) => {
    const date = new Date(m.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      if (m.type === 'INGRESO') existing.ingresos += m.amount || 0;
      if (m.type === 'EGRESO') existing.egresos += m.amount || 0;
    } else {
      acc.push({
        date,
        ingresos: m.type === 'INGRESO' ? (m.amount || 0) : 0,
        egresos: m.type === 'EGRESO' ? (m.amount || 0) : 0
      });
    }
    return acc;
  }, []).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Ingresos" 
          value={`S/ ${totalIncome.toLocaleString()}`} 
          icon={ArrowDownLeft} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Total Egresos" 
          value={`S/ ${totalExpenses.toLocaleString()}`} 
          icon={ArrowUpRight} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Balance Neto" 
          value={`S/ ${balance.toLocaleString()}`} 
          icon={Wallet} 
          color={balance >= 0 ? "bg-blue-500" : "bg-orange-500"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Flujo de Caja</h3>
              <p className="text-sm text-slate-500">Comparativa de ingresos vs egresos (últimos registros)</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `S/ ${value}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Últimos Movimientos</h3>
          <div className="space-y-4">
            {financialMovements.slice(0, 6).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    m.type === 'INGRESO' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {m.type === 'INGRESO' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{m.description}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{formatPeruDate(m.date).split(' ')[0]}</p>
                  </div>
                </div>
                <p className={cn(
                  "font-bold text-sm",
                  m.type === 'INGRESO' ? "text-green-600" : "text-red-600"
                )}>
                  {m.type === 'INGRESO' ? '+' : '-'} S/ {m.amount?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchesView({ branches, onAdd, onUpdate, onDelete, onViewInventory }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Gestión de Sucursales</h3>
          <p className="text-sm text-slate-500 font-medium">Administra las ubicaciones físicas de Mundo Celular Zelin</p>
        </div>
        <button 
          onClick={() => {
            setEditingBranch(null);
            setShowAddModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Nueva Sucursal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch: any) => (
          <motion.div 
            key={branch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card group hover:border-primary/50 transition-all overflow-hidden flex flex-col"
          >
            {/* Imagen de la Sucursal */}
            <div className="h-44 w-full relative overflow-hidden bg-slate-50">
              {branch.imageUrl ? (
                <img 
                  src={getPublicUrl(branch.imageUrl)} 
                  alt={branch.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Store className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => {
                    setEditingBranch(branch);
                    setShowAddModal(true);
                  }}
                  className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg text-slate-600 hover:text-primary transition-all shadow-sm border border-slate-100"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
                      onDelete(branch.id);
                    }
                  }}
                  className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg text-slate-600 hover:text-red-500 transition-all shadow-sm border border-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">{branch.name}</h4>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{branch.address}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sucursal Activa</span>
                </div>
                <button 
                  onClick={() => onViewInventory(branch.id)}
                  className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Ver Inventario
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AddBranchModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={onAdd}
        onUpdate={onUpdate}
        editingBranch={editingBranch}
      />
    </div>
  );
}

function AddBranchModal({ isOpen, onClose, onAdd, onUpdate, editingBranch }: any) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        name: editingBranch.name,
        address: editingBranch.address,
        imageUrl: editingBranch.imageUrl || editingBranch.image || ''
      });
    } else {
      setFormData({ name: '', address: '', imageUrl: '' });
      setImageFile(null);
    }
  }, [editingBranch, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let imageUrl = formData.imageUrl;

    try {
      if (imageFile) {
        const compressedFile = await compressImage(imageFile);
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadErr } = await insforge.storage
          .from('zelin')
          .upload(`branches/${fileName}`, compressedFile);
        
        if (uploadErr) throw uploadErr;
        if (uploadData) {
           imageUrl = uploadData.url;
        }
      }

      const finalData = { ...formData, imageUrl: imageUrl };

      if (editingBranch) {
        await onUpdate(editingBranch.id, finalData);
      } else {
        await onAdd({
          ...finalData,
          id: 'branch-' + Math.random().toString(36).substr(2, 9)
        });
      }
      onClose();
    } catch (err: any) {
      console.error("Error saving branch", err);
      alert(`Error al guardar sucursal: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
          <button onClick={onClose} disabled={isUploading} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Imagen de la Sucursal</label>
              <div 
                className="relative h-48 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('branch-image')?.click()}
              >
                {imageFile || formData.imageUrl ? (
                  <img 
                    src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Subir Foto</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase">
                  Cambiar Foto
                </div>
              </div>
              <input 
                id="branch-image"
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre de la Sucursal</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ej: Sucursal Central"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dirección</label>
              <input 
                required
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ej: Av. Principal 123"
              />
            </div>
          </div>
          <div className="p-6 md:p-8 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4">
            <button type="button" onClick={onClose} disabled={isUploading} className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">Cancelar</button>
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DetailedReportsView({ sales, inventory, movements, branches, services }: any) {
  const [reportType, setReportType] = useState('SALES');
  const [dateRange, setDateRange] = useState('MONTH');

  const getFilteredData = (data: any[]) => {
    const now = new Date();
    return data.filter(item => {
      const itemDate = new Date(item.date);
      if (dateRange === 'TODAY') return itemDate.toDateString() === now.toDateString();
      if (dateRange === 'WEEK') return (now.getTime() - itemDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (dateRange === 'MONTH') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      if (dateRange === 'YEAR') return itemDate.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredSales = getFilteredData(sales);
  const filteredMovements = getFilteredData(movements);
  const filteredServices = getFilteredData(services);

  const salesByBranch = branches.map((b: any) => ({
    name: b.name,
    total: filteredSales.filter((s: any) => s.branchId === b.id).reduce((acc: number, s: any) => acc + s.total, 0)
  }));

  const inventoryByCategory = inventory.reduce((acc: any[], item: any) => {
    const existing = acc.find(a => a.name === item.category);
    if (existing) existing.value++;
    else acc.push({ name: item.category, value: 1 });
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = reportType === 'SALES' ? 'Reporte de Ventas' : 
                  reportType === 'INVENTORY' ? 'Reporte de Inventario' : 'Reporte Financiero';
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Primary color
    doc.text('MUNDO CELULAR ZELIN', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text(title, 14, 32);
    
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 40);
    doc.text(`Rango: ${dateRange}`, 14, 46);

    if (reportType === 'SALES') {
      const tableData = filteredSales.map(s => [
        formatPeruDate(s.date),
        s.customerName,
        branches.find((b: any) => b.id === s.branchId)?.name || 'N/A',
        s.type,
        `S/ ${s.total.toLocaleString()}`
      ]);
      
      autoTable(doc, {
        startY: 55,
        head: [['Fecha', 'Cliente', 'Sucursal', 'Tipo', 'Total']],
        body: tableData,
      });
    } else if (reportType === 'INVENTORY') {
      const tableData = inventory.map(i => [
        i.name,
        i.brand,
        i.category,
        `S/ ${i.price.toLocaleString()}`,
        i.stock,
        branches.find((b: any) => b.id === i.branchId)?.name || 'N/A'
      ]);
      
      autoTable(doc, {
        startY: 55,
        head: [['Producto', 'Marca', 'Categoría', 'Precio', 'Stock', 'Sucursal']],
        body: tableData,
      });
    } else {
      const tableData = filteredMovements.map(m => [
        formatPeruDate(m.date),
        m.type,
        m.category,
        m.description,
        m.amount ? `S/ ${m.amount.toLocaleString()}` : `${m.quantity} und.`,
        branches.find((b: any) => b.id === m.branchId)?.name || 'N/A'
      ]);
      
      autoTable(doc, {
        startY: 55,
        head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto/Cant.', 'Sucursal']],
        body: tableData,
      });
    }

    doc.save(`reporte_zelin_${reportType.toLowerCase()}_${dateRange.toLowerCase()}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button 
            onClick={() => setReportType('SALES')}
            className={cn(
              "px-4 md:px-6 py-3 rounded-xl font-bold text-sm transition-all shrink-0",
              reportType === 'SALES' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            Ventas
          </button>
          <button 
            onClick={() => setReportType('INVENTORY')}
            className={cn(
              "px-4 md:px-6 py-3 rounded-xl font-bold text-sm transition-all shrink-0",
              reportType === 'INVENTORY' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            Inventario
          </button>
          <button 
            onClick={() => setReportType('FINANCIAL')}
            className={cn(
              "px-4 md:px-6 py-3 rounded-xl font-bold text-sm transition-all shrink-0",
              reportType === 'FINANCIAL' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            Caja
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm font-medium"
          >
            <option value="TODAY">Hoy</option>
            <option value="WEEK">Esta Semana</option>
            <option value="MONTH">Este Mes</option>
            <option value="YEAR">Este Año</option>
            <option value="ALL">Todo el histórico</option>
          </select>
          <button 
            onClick={handleExportPDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Upload className="w-4 h-4 rotate-180" /> Exportar PDF
          </button>
        </div>
      </div>

      {reportType === 'SALES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" /> Ventas por Sucursal
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByBranch} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total Ventas (S/)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Últimas Ventas ({dateRange})</h3>
            <div className="space-y-6">
              {filteredSales.slice(0, 5).reverse().map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{sale.customerName}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{formatPeruDate(sale.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">S/ {sale.total.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{branches.find((b: any) => b.id === sale.branchId)?.name}</p>
                  </div>
                </div>
              ))}
              {filteredSales.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-medium">No hay ventas registradas en este periodo</div>
              )}
            </div>
          </div>
        </div>
      )}

      {reportType === 'INVENTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Distribución por Categoría</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {inventoryByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {inventoryByCategory.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-medium text-slate-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Alertas de Stock Bajo</h3>
            <div className="space-y-4">
              {inventory.filter((i: any) => i.stock < 5).map((item: any) => (
                <div key={item.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-red-100">
                      <Smartphone className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-red-600 font-bold uppercase">Stock Crítico: {item.stock} unidades</p>
                    </div>
                  </div>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-all">
                    Reponer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'FINANCIAL' && (
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Resumen de Servicios Técnicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Recibidos', value: services.length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'En Reparación', value: services.filter((s: any) => s.status === 'EN_REPARACION').length, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Listos', value: services.filter((s: any) => s.status === 'LISTO').length, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Ingresos Estimados', value: `S/ ${services.reduce((acc: number, s: any) => acc + s.cost, 0).toLocaleString()}`, color: 'text-primary', bg: 'bg-primary/5' }
            ].map((stat, idx) => (
              <div key={idx} className={cn("p-6 rounded-3xl border border-transparent transition-all hover:shadow-lg", stat.bg)}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersView({ customers, sales }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const totalCustomers = customers.length;
  // New customers (created in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter((c: any) => new Date(c.createdAt || c.created_at) > thirtyDaysAgo).length;

  // Best customer (highest total purchases)
  const bestCustomerTotal = Math.max(...customers.map((c: any) => Number(c.totalPurchases || c.total_purchases || 0)), 0);
  
  // Average purchase per customer
  const totalPurchases = customers.reduce((acc: number, c: any) => acc + Number(c.totalPurchases || c.total_purchases || 0), 0);
  const avgPurchase = totalCustomers > 0 ? totalPurchases / totalCustomers : 0;

  const filteredCustomers = customers.filter((c: any) => 
    (c.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone?.includes(searchTerm)) ||
    (c.documentId && c.documentId.includes(searchTerm)) ||
    (c.document_id && c.document_id.includes(searchTerm))
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, teléfono o DNI..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4 text-right">Total Compras</th>
                <th className="px-6 py-4 text-center">Última Visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {(customer.name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.address || 'Sin dirección'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Smartphone className="w-3 h-3" /> {customer.phone}
                      </p>
                      {customer.email && (
                        <p className="text-xs text-slate-400">{customer.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {customer.documentId || customer.document_id || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-primary">
                    S/ {(Number(customer.totalPurchases || customer.total_purchases || 0)).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-500">
                    {formatPeruDate(customer.lastVisit || customer.last_visit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {filteredCustomers.map((customer: any) => (
            <div key={customer.id} className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{customer.name}</p>
                  <p className="text-xs text-slate-500 truncate">{customer.address || 'Sin dirección'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contacto</p>
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <Smartphone className="w-3 h-3" /> {customer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Documento</p>
                  <p className="text-xs text-slate-600">{customer.documentId || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Compras</p>
                  <p className="text-sm font-black text-primary">S/ {(Number(customer.totalPurchases || customer.total_purchases || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Última Visita</p>
                  <p className="text-xs text-slate-500">{formatPeruDate(customer.lastVisit)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewSaleModal({ isOpen, onClose, inventory, onAdd, user }: any) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter((p: any) => 
    p.stock > 0 && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const total = selectedProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  const handleAddProduct = (product: any) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setSelectedProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
      } else {
        alert('No hay más stock disponible');
      }
    } else {
      setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newQty = p.quantity + delta;
        const stock = inventory.find((i: any) => i.id === productId)?.stock || 0;
        if (newQty > 0 && newQty <= stock) {
          return { ...p, quantity: newQty };
        }
      }
      return p;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) return alert('Selecciona al menos un producto');
    if (!customerName) return alert('Ingresa el nombre del cliente');

    const newSale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      items: selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: p.quantity
      })),
      total,
      type: paymentType,
      customerName,
      customerPhone,
      sellerId: user.id,
      branchId: user.branchId || 'main'
    };

    await onAdd(newSale);
    onClose();
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setSelectedProducts([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Product Selection */}
        <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col border-r border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart className="text-primary w-6 h-6" /> Nueva Venta
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors md:hidden">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar productos en stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-slate-50/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-custom">
            {filteredInventory.map((product: any) => (
              <div 
                key={product.id} 
                onClick={() => handleAddProduct(product)}
                className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-primary hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <Smartphone className="text-slate-300 w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{product.brand} · Stock: {product.stock}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">S/ {product.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {filteredInventory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 font-medium">No se encontraron productos con stock.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart & Details */}
        <div className="w-full md:w-[400px] bg-slate-50 p-6 md:p-8 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Resumen de Venta</h4>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors hidden md:block">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cliente</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Teléfono (WhatsApp)</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="987 654 321"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Productos Seleccionados</label>
              <div className="space-y-3 mb-8">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs font-black text-primary">S/ {product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button type="button" onClick={() => handleUpdateQuantity(product.id, -1)} className="p-1 hover:bg-slate-50 text-slate-400"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center text-xs font-bold">{product.quantity}</span>
                          <button type="button" onClick={() => handleUpdateQuantity(product.id, 1)} className="p-1 hover:bg-slate-50 text-slate-400"><Plus className="w-3 h-3" /></button>
                       </div>
                       <button type="button" onClick={() => handleRemoveProduct(product.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {selectedProducts.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center border-2 border-dashed border-slate-200 rounded-3xl">Carrito vacío</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between p-2">
                <span className="text-sm font-bold text-slate-500">Método:</span>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setPaymentType('CONTADO')}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", paymentType === 'CONTADO' ? "bg-primary text-white shadow-md" : "text-slate-400")}
                  >Contado</button>
                  <button 
                    type="button"
                    onClick={() => setPaymentType('CREDITO')}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", paymentType === 'CREDITO' ? "bg-primary text-white shadow-md" : "text-slate-400")}
                  >Crédito</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/20 rounded-2xl">
                <span className="font-black text-primary text-sm uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-primary">S/ {total.toLocaleString()}</span>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10"
              >
                Confirmar Venta
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function SalesView({ sales, inventory, user, onAddSale }: any) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);

  const filteredSales = sales.filter((sale: any) => {
    if (activeFilter === 'credits') return sale.type === 'CREDITO';
    return true;
  });

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setActiveFilter('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all border shrink-0",
              activeFilter === 'all' 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            Historial de Ventas
          </button>
          <button 
            onClick={() => setActiveFilter('credits')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all border shrink-0",
              activeFilter === 'credits' 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            Créditos Pendientes
          </button>
        </div>
        {!isSuperAdmin && (
          <button 
            onClick={() => setShowNewSaleModal(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full md:w-auto"
          >
            <ShoppingCart className="w-5 h-5" /> Nueva Venta
          </button>
        )}
      </div>

      <NewSaleModal 
        isOpen={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        inventory={inventory}
        onAdd={onAddSale}
        user={user}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredSales.map((sale: any) => (
          <div key={sale.id} className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venta #{sale.id.slice(-4)}</p>
                <h4 className="font-bold text-slate-900 mt-1">{sale.customerName}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatPeruDate(sale.date)}</span>
                </div>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                sale.type === 'CONTADO' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
              )}>
                {sale.type}
              </span>
            </div>
            <div className="space-y-2">
              {sale.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs text-slate-500">
                  <span>{item.quantity}x {item.name}</span>
                  <span>S/ {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-400">Total</span>
              <span className="text-xl font-bold text-primary">S/ {sale.total.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditsView({ credits }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCredit, setSelectedCredit] = useState<any>(null);

  const filteredCredits = credits.filter((c: any) => 
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por cliente o ID de crédito..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredCredits.map((credit: any) => {
          const progress = (credit.paidAmount / credit.totalAmount) * 100;
          return (
            <div 
              key={credit.id} 
              className="glass-card p-6 space-y-6 cursor-pointer hover:shadow-xl transition-all border border-transparent hover:border-primary/20"
              onClick={() => setSelectedCredit(credit)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crédito #{credit.id.slice(-4)}</p>
                  <h4 className="font-bold text-slate-900 mt-1">{credit.customerName}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatPeruDate(credit.date || new Date().toISOString())}</span>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                  credit.status === 'PAGADO' ? "bg-green-100 text-green-600" : 
                  credit.status === 'ATRASADO' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                )}>
                  {credit.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Progreso de Pago</span>
                  <span className="font-bold text-slate-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={cn(
                      "h-full rounded-full",
                      progress === 100 ? "bg-green-500" : "bg-primary"
                    )}
                  />
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-400">Pagado: S/ {credit.paidAmount.toLocaleString()}</span>
                  <span className="text-slate-400">Total: S/ {credit.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-primary">S/ {(credit.totalAmount - credit.paidAmount).toLocaleString()}</p>
                </div>
                <button className="p-2 bg-slate-50 rounded-lg hover:bg-primary hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Detail Modal */}
      <AnimatePresence>
        {selectedCredit && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Detalle de Crédito</h3>
                  <p className="text-sm text-slate-500">Cliente: {selectedCredit.customerName}</p>
                </div>
                <button onClick={() => setSelectedCredit(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:mb-1">Total</p>
                    <p className="text-lg font-bold text-slate-900">S/ {selectedCredit.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest sm:mb-1">Pagado</p>
                    <p className="text-lg font-bold text-green-700">S/ {selectedCredit.paidAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest sm:mb-1">Pendiente</p>
                    <p className="text-lg font-bold text-primary">S/ {(selectedCredit.totalAmount - selectedCredit.paidAmount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Cronograma de Cuotas</h4>
                  <div className="space-y-3">
                    {selectedCredit.installments.map((inst: any, idx: number) => (
                      <div key={inst.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                            inst.status === 'PAGADO' ? "bg-green-100 text-green-600" : 
                            inst.status === 'ATRASADO' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">S/ {inst.amount.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Vence: {new Date(inst.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-1 rounded-md",
                            inst.status === 'PAGADO' ? "bg-green-100 text-green-600" : 
                            inst.status === 'ATRASADO' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {inst.status}
                          </span>
                          {inst.status !== 'PAGADO' && (
                            <button className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                              Pagar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex justify-end">
                <button onClick={() => setSelectedCredit(null)} className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TechnicalServiceView({ services, user }: any) {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter((s: any) => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por cliente o equipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white shadow-sm"
          />
        </div>
        {user.role !== 'CLIENTE' && user.role !== 'SUPER_ADMIN' && (
          <button className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full md:w-auto">
            <Plus className="w-5 h-5" /> Recepción de Equipo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {filteredServices.map((s: any) => (
          <div key={s.id} className="glass-card p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shrink-0">
                <Smartphone className="w-7 h-7 md:w-8 md:h-8 text-slate-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-base md:text-lg text-slate-900 truncate">{s.device}</h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">#{s.id.slice(-6)}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 truncate">Cliente: <span className="font-bold text-slate-700">{s.customerName}</span></p>
                <p className="text-xs text-slate-400 mt-1 italic truncate">"{s.issue}"</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
              <div className="text-left lg:text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                <div className="flex items-center gap-2">
                  {s.status === 'RECIBIDO' && <Clock className="w-4 h-4 text-orange-500" />}
                  {s.status === 'LISTO' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  <span className={cn(
                    "text-sm font-bold",
                    s.status === 'LISTO' ? "text-green-600" : "text-orange-600"
                  )}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-left lg:text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Costo Est.</p>
                <p className="text-lg font-bold text-primary">S/ {s.cost.toLocaleString()}</p>
              </div>

              <button 
                onClick={() => setSelectedService(s)}
                className="w-full lg:w-auto px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Detalle de Reparación</h3>
                  <p className="text-sm text-slate-500">Servicio Técnico #{selectedService.id.slice(-6)}</p>
                </div>
                <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Información del Cliente</h4>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <p className="font-bold text-slate-900">{selectedService.customerName}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <Smartphone className="w-4 h-4" /> {selectedService.customerPhone || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Equipo y Problema</h4>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-primary" />
                          <span className="font-bold text-slate-900">{selectedService.device}</span>
                        </div>
                        <p className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
                          "{selectedService.issue}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Estado y Costo</h4>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Estado Actual</span>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            getStatusColor(selectedService.status)
                          )}>
                            {selectedService.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="text-sm text-slate-500">Costo Estimado</span>
                          <span className="text-xl font-bold text-primary">S/ {selectedService.cost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fechas</h4>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Fecha de Ingreso</span>
                          <span className="font-bold text-slate-700">{formatPeruDate(selectedService.date)}</span>
                        </div>
                        <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                          <span className="text-slate-500">Entrega Estimada</span>
                          <span className="font-bold text-primary">
                            {selectedService.estimatedDeliveryDate ? formatPeruDate(selectedService.estimatedDeliveryDate) : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedService.technicianNotes && (
                  <div className="pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Notas del Técnico</h4>
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {selectedService.technicianNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 flex justify-end gap-4">
                <button 
                  onClick={() => setSelectedService(null)} 
                  className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportsView({ aiReport, onGenerate, isGenerating, onDownload, onShare }: any) {
  return (
    <div className="space-y-8">
      <div className="glass-card p-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="text-primary w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Análisis Inteligente Zelin</h3>
        <p className="text-slate-500 mt-3 leading-relaxed">
          Utiliza nuestra IA avanzada para analizar el rendimiento de tus sucursales, 
          detectar productos estrella y optimizar tu inventario automáticamente.
        </p>
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="mt-8 flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 mx-auto disabled:opacity-50"
        >
          {isGenerating ? (
            <>Generando Análisis...</>
          ) : (
            <>
              <BarChart3 className="w-5 h-5" />
              Generar Reporte con IA
            </>
          )}
        </button>
      </div>

      {aiReport && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden max-w-4xl mx-auto"
        >
          <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Sparkles className="text-primary w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Reporte de Inteligencia</h3>
                  <p className="text-slate-400 text-sm font-medium">Generado automáticamente por Mundo Celular Zelin IA</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={onDownload}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 backdrop-blur-md border border-white/5"
                >
                  <FileText className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={onShare}
                  className="bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 rotate-180" /> Compartir
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="prose prose-slate prose-lg max-w-none 
              prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
              prose-p:text-slate-600 prose-p:leading-relaxed
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-ul:list-disc prose-li:text-slate-600
              prose-table:border prose-table:border-slate-100 prose-th:bg-slate-50 prose-th:p-4 prose-td:p-4
              prose-img:rounded-3xl prose-img:shadow-xl">
              <ReactMarkdown>{aiReport}</ReactMarkdown>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Finalizado: {new Date().toLocaleTimeString('es-PE')}</span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium italic">
                Este reporte es generado por IA y debe ser validado por un administrador.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LandingPage({ 
  user,
  onGoToPanel,
  branches, 
  inventory, 
  selectedBranchId, 
  setSelectedBranchId, 
  onLoginClick, 
  onRegisterClick,
  cart,
  isCartOpen,
  setIsCartOpen,
  addToCart,
  removeFromCart,
  updateQuantity,
  sendToWhatsApp,
  selectedProduct,
  setSelectedProduct,
  buyNow,
  settings
}: any) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'catalogue' | 'offers' | 'category'>('home');

  const [filterBranchId, setFilterBranchId] = useState<string | null>(null);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [repairForm, setRepairForm] = useState({
    name: '',
    phone: '',
    device: '',
    issue: ''
  });

  const [searchRepairId, setSearchRepairId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearchingRepair, setIsSearchingRepair] = useState(false);
  const [hasSearchedRepair, setHasSearchedRepair] = useState(false);

  const handleCheckRepair = async () => {
    if (!searchRepairId) return;
    setIsSearchingRepair(true);
    setHasSearchedRepair(false);
    try {
      const id = searchRepairId.replace('#', '').trim();
      const { data, error } = await insforge.from('technical_services').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      setSearchResult(data ? snakeToCamel(data) : null);
    } catch (err) {
      console.error(err);
      setSearchResult(null);
    } finally {
      setIsSearchingRepair(false);
      setHasSearchedRepair(true);
    }
  };

  const handleRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = settings?.phone?.replace(/[^0-9]/g, '') || "51916857022";
    const message = `*Solicitud de Reparación*\n\n` +
      `*Nombre:* ${repairForm.name}\n` +
      `*Celular:* ${repairForm.phone}\n` +
      `*Equipo:* ${repairForm.device}\n` +
      `*Falla:* ${repairForm.issue}\n\n` +
      `Hola, me gustaría solicitar un presupuesto para reparar mi equipo.`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setIsRepairModalOpen(false);
    setRepairForm({ name: '', phone: '', device: '', issue: '' });
  };

  const filteredProducts = inventory.filter((p: any) => {
    const matchesBranch = filterBranchId ? p.branchId === filterBranchId : true;
    if (activeView === 'catalogue') return matchesBranch;
    if (activeView === 'offers') return matchesBranch && (p.category === 'Ofertas' || p.price < 500);
    if (activeView === 'category') return matchesBranch && p.category === activeCategory;
    return true;
  });

  const displayTitle = activeView === 'catalogue' 
    ? 'Catálogo Completo' 
    : activeView === 'offers' 
      ? 'Ofertas Especiales' 
      : activeCategory;

  const cartTotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const handleSetCategory = (cat: string) => {
    setActiveCategory(cat);
    setFilterBranchId(null);
    setActiveView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSetView = (view: 'home' | 'catalogue' | 'offers') => {
    setActiveView(view);
    setActiveCategory(null);
    setFilterBranchId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewBranch = (branchId: string) => {
    setFilterBranchId(branchId);
    setActiveCategory(null);
    setActiveView('catalogue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const waNumber = settings?.phone?.replace(/[^0-9]/g, '') || "51916857022";
  const waMessage = encodeURIComponent(settings?.whatsappMessage || 'Hola Mundo Celular Zelin, me interesa un producto');

  return (
    <div className="min-h-screen bg-white">

      {/* Botón Flotante WhatsApp */}
      <a
        href={`https://wa.me/${waNumber}?text=${waMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-5 z-[200] flex items-center gap-3 bg-[#25D366] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:bg-[#20ba59] hover:scale-105 transition-all duration-300 group"
        style={{ boxShadow: '0 8px 32px rgba(37,211,102,0.45)' }}
      >
        <span className="flex items-center justify-center w-8 h-8 shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.569-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.827L.057 23.862a.5.5 0 00.613.613l6.116-1.455A11.937 11.937 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.97 0-3.81-.538-5.39-1.472l-.385-.228-3.993.951.968-3.9-.249-.4A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </span>
        <span className="font-bold text-sm whitespace-nowrap hidden sm:block">¡Escríbenos!</span>
      </a>

      {/* Navbar */}
      <nav className="h-20 border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => handleSetView('home')}
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-lg md:text-xl text-slate-900 truncate">Mundo Celular Zelin</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
          <button onClick={() => {
            const el = document.getElementById('categorias');
            if (activeView === 'home') el?.scrollIntoView({ behavior: 'smooth' });
            else handleSetView('home');
          }} className="hover:text-primary transition-colors">Categorías</button>
          <button onClick={() => handleSetView('catalogue')} className={cn("hover:text-primary transition-colors", activeView === 'catalogue' && "text-primary")}>Catálogo</button>
          <button onClick={() => handleSetView('offers')} className={cn("hover:text-primary transition-colors", activeView === 'offers' && "text-primary")}>Ofertas</button>
          <a href="#servicios" className="hover:text-primary transition-colors">Reparación</a>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors group"
          >
            <ShoppingCart className="w-6 h-6 text-slate-600 group-hover:text-primary transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                {cartCount}
              </span>
            )}
          </button>
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <button 
                onClick={onGoToPanel}
                className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                Ir al Panel <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button 
                  onClick={onLoginClick}
                  className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={onRegisterClick}
                  className="bg-primary text-white px-4 md:px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>
        </div>
      </nav>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl max-h-[90vh] bg-white z-[90] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg z-10 hover:bg-primary hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-12 flex items-center justify-center relative shrink-0">
                <img 
                  src={getPublicUrl(selectedProduct.image) || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                  alt={selectedProduct.name}
                  className="w-full h-auto max-h-[300px] md:max-h-full object-contain drop-shadow-2xl"
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm border border-slate-100">
                    {selectedProduct.brand}
                  </span>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col bg-white">
                <div className="p-8 md:p-12 md:flex-1 md:overflow-y-auto">
                  <span className="text-primary font-bold text-sm uppercase tracking-widest mb-2 block">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 mb-4">{selectedProduct.name}</h3>
                  <p className="text-3xl font-black text-primary mb-8">S/ {selectedProduct.price.toLocaleString()}</p>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción</h4>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedProduct.description || "Este equipo cuenta con las mejores prestaciones del mercado, garantizando un rendimiento excepcional para todas tus tareas diarias."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Especificaciones</h4>
                      <ul className="grid grid-cols-1 gap-3">
                        {(selectedProduct.specifications || [
                          "Pantalla Super Retina XDR",
                          "Chip A17 Pro de última generación",
                          "Sistema de cámaras Pro de 48MP",
                          "Batería de larga duración",
                          "Resistencia al agua y polvo IP68"
                        ]).map((spec: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            {spec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 md:shrink-0">
                  <button 
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    className="flex-1 py-4 bg-white text-slate-900 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Añadir al Carrito
                  </button>
                  <button 
                    onClick={() => buyNow(selectedProduct)}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Comprar Ahora
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-primary w-6 h-6" />
                  <h3 className="text-xl font-bold text-slate-900">Tu Carrito</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                      <ShoppingCart className="text-slate-300 w-10 h-10" />
                    </div>
                    <p className="text-slate-500 font-medium">Tu carrito está vacío</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Empezar a comprar
                    </button>
                  </div>
                ) : (
                  cart.map((item: any) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                        <p className="text-primary font-black mt-1">S/ {item.price.toLocaleString()}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-slate-50 text-slate-500"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-slate-50 text-slate-500"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="text-xl font-black text-slate-900">S/ {cartTotal.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={sendToWhatsApp}
                    className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#20ba59] transition-all shadow-lg shadow-green-500/20"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Enviar Pedido por WhatsApp
                  </button>
                  <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                    Serás redirigido a WhatsApp para finalizar tu compra
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-20 bg-white z-40 lg:hidden p-8 flex flex-col gap-8"
          >
            <div className="flex flex-col gap-6 text-xl font-bold text-slate-900">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); handleSetView('home'); setTimeout(() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' }), 100); }} 
                className="text-left hover:text-primary transition-colors"
              >Categorías</button>
              <button onClick={() => { setIsMobileMenuOpen(false); handleSetView('catalogue'); }} className="text-left hover:text-primary transition-colors">Catálogo</button>
              <button onClick={() => { setIsMobileMenuOpen(false); handleSetView('offers'); }} className="text-left hover:text-primary transition-colors">Ofertas</button>
              <a href="#servicios" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors">Reparación</a>
            </div>
            <div className="pt-8 border-t border-slate-100 flex flex-col gap-4 sm:hidden">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onLoginClick(); }}
                className="w-full py-4 rounded-2xl font-bold text-slate-600 border border-slate-200"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onRegisterClick(); }}
                className="w-full py-4 rounded-2xl font-bold text-white bg-primary shadow-lg shadow-primary/20"
              >
                Registrarse
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeView === 'home' ? (
        <>
          {/* Hero */}
          <section className="py-20 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Líderes en Tecnología Celular
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6">
                Tu mundo móvil en un <span className="text-primary">solo lugar.</span>
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Venta de equipos de última generación, accesorios premium y el mejor servicio técnico especializado. 
                Visítanos en cualquiera de nuestras sucursales.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                <a href="#tiendas" className="w-full sm:w-auto text-center bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                  Ver Tiendas
                </a>
                <button 
                  onClick={() => handleSetView('catalogue')}
                  className="w-full sm:w-auto text-center border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  Ver Catálogo
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-primary/5 rounded-[4rem] flex items-center justify-center p-4">
                <img 
                  src="https://i.imgur.com/xEBLs7I.png" 
                  alt="Celular" 
                  className="rounded-[3rem] shadow-2xl transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-500 w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Garantía Real</p>
                  <p className="text-xs text-slate-500">En todos nuestros equipos</p>
                </div>
              </div>
            </motion.div>
          </section>

      {/* Categorías */}
      <section id="categorias" className="py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-4">Explora por Categorías</h2>
          <p className="text-slate-500">Encuentra lo que buscas rápidamente</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'Celulares', icon: Smartphone },
            { name: 'Accesorios', icon: ShoppingCart },
            { name: 'Parlantes', icon: Volume2 },
            { name: 'Servicio Técnico', icon: Wrench },
            { name: 'Electrodomésticos', icon: Zap }
          ].map((cat) => (
            <div 
              key={cat.name} 
              onClick={() => handleSetCategory(cat.name)}
              className={cn(
                "glass-card p-8 text-center transition-all cursor-pointer group",
                activeCategory === cat.name ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-105" : "hover:border-primary"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors",
                activeCategory === cat.name ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <cat.icon className="w-8 h-8" />
              </div>
              <h4 className={cn(
                "font-bold transition-colors",
                activeCategory === cat.name ? "text-primary text-lg" : "text-slate-900"
              )}>{cat.name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Productos por Sucursal */}
      {branches.map((branch: any) => {
        const branchProducts = inventory.filter((p: any) => p.branchId === branch.id).slice(0, 8);
        if (branchProducts.length === 0) return null;
        return (
          <section key={branch.id} className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-2 block">
                  <MapPin className="w-3 h-3 inline mr-1" />{branch.address}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">{branch.name}</h2>
              </div>
              <button
                onClick={() => handleViewBranch(branch.id)}
                className="hidden md:flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all shrink-0"
              >
                Ver catálogo completo <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {branchProducts.map((product: any) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  onClick={() => setSelectedProduct(product)}
                  className="glass-card group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden cursor-pointer bg-white"
                >
                  <div className="aspect-square bg-slate-50 p-4 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={getPublicUrl(product.image) || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agotado</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{product.brand}</p>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mb-3 truncate">{product.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-primary">S/ {product.price.toLocaleString()}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        disabled={product.stock === 0}
                        className={cn(
                          "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                          product.stock > 0
                            ? "bg-primary text-white hover:bg-slate-900 shadow-lg shadow-primary/20"
                            : "bg-slate-100 text-slate-300 cursor-not-allowed"
                        )}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <button
                onClick={() => handleViewBranch(branch.id)}
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <LayoutGrid className="w-4 h-4" /> Ver catálogo completo de {branch.name}
              </button>
            </div>
            <div className="hidden md:flex justify-center mt-8">
              <button
                onClick={() => handleViewBranch(branch.id)}
                className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all"
              >
                <LayoutGrid className="w-4 h-4" /> Ver todos los productos de {branch.name}
              </button>
            </div>
          </section>
        );
      })}

        </>
      ) : (
        /* VISTA DE PÁGINA DEDICADA (CATÁLOGO / OFERTAS / CATEGORÍA) */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-[70vh]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 pt-8">
            <div className="flex-1">
              <button 
                onClick={() => handleSetView('home')}
                className="group flex items-center gap-2 text-primary font-bold text-sm mb-6 hover:gap-3 transition-all"
              >
                <ArrowUpRight className="w-5 h-5 rotate-[225deg]" /> 
                <span className="underline decoration-primary/30 underline-offset-4">Volver al Inicio</span>
              </button>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4 italic">
                {displayTitle}
              </h2>
              <div className="h-1.5 w-32 bg-primary rounded-full mb-6" />
              <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                {activeView === 'catalogue' 
                   ? 'Explora todos nuestros productos disponibles en preventa y entrega inmediata.'
                   : activeView === 'offers'
                     ? 'Los mejores precios del mercado en equipos seleccionados. Actualizado semanalmente.'
                     : `Mostrando la mejor selección de ${activeCategory?.toLowerCase()} disponibles.`
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product: any) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedProduct(product)}
                  className="glass-card group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden cursor-pointer bg-white"
                >
                  <div className="aspect-square bg-slate-50/50 p-6 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={product.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 bg-white rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-100 shadow-sm">
                        {product.brand}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-slate-900 mb-1 text-lg">{product.name}</h4>
                    <p className="text-xs text-slate-400 mb-4 uppercase font-bold tracking-widest">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-primary">S/ {product.price.toLocaleString()}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        disabled={product.stock === 0}
                        className={cn(
                          "w-12 h-12 flex items-center justify-center rounded-2xl transition-all",
                          product.stock > 0 
                            ? "bg-primary text-white hover:bg-slate-900 shadow-lg shadow-primary/20" 
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-8 h-8 text-slate-200" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">No hay productos disponibles</h3>
                 <p className="text-slate-500 mt-2">Prueba seleccionando otra categoría o sucursal.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeView === 'home' && (
        <>
          {/* Services */}
          <section id="servicios" className="py-24 bg-slate-900 text-white px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="inline-block px-4 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              Soporte Especializado
            </span>
            <h2 className="text-5xl font-black mb-6 leading-tight">Servicio Técnico <span className="text-primary">Profesional.</span></h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Reparamos tu celular con repuestos originales y garantía. Pantallas, baterías, conectores y más.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {[
                { title: 'Cambio de pantalla', icon: Smartphone },
                { title: 'Cambio de batería', icon: Clock },
                { title: 'Reparación de carga', icon: AlertCircle },
                { title: 'Diagnóstico gratis', icon: CheckCircle2 }
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="text-primary w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm">{item.title}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setIsRepairModalOpen(true)}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              Solicitar Reparación
            </button>
          </div>
          <div className="relative">
            <div className="aspect-video bg-white/5 rounded-[3rem] border border-white/10 p-10 flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4">Consulta tu reparación</h3>
              <p className="text-slate-400 mb-8">Si ya dejaste tu equipo, ingresa tu código para ver el estado actual.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Código de servicio (ej: #12345)" 
                  value={searchRepairId}
                  onChange={(e) => setSearchRepairId(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 text-white"
                />
                <button 
                  onClick={handleCheckRepair}
                  disabled={isSearchingRepair}
                  className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                >
                  {isSearchingRepair ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : 'Consultar'}
                </button>
              </div>

              {hasSearchedRepair && (
                  <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-6 bg-white/10 border border-white/20 rounded-[2rem] text-left"
                  >
                      {searchResult ? (
                          <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h4 className="text-xl font-bold text-white">{searchResult.device}</h4>
                                      <p className="text-slate-400 text-sm">Ticket: #{searchResult.id.slice(0, 8)}</p>
                                  </div>
                                  <span className={cn(
                                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                      searchResult.status === 'LISTO' || searchResult.status === 'ENTREGADO' ? "bg-green-500 text-white" : "bg-primary text-white"
                                  )}>
                                      {searchResult.status.replace('_', ' ')}
                                  </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                  <div>
                                      <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Cliente</p>
                                      <p className="font-medium text-white">{searchResult.customerName}</p>
                                  </div>
                                  <div>
                                      <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Costo</p>
                                      <p className="font-bold text-primary">S/ {searchResult.cost}</p>
                                  </div>
                              </div>
                              {searchResult.technicianNotes && (
                                  <div className="pt-4 border-t border-white/10">
                                      <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Estado Detalle</p>
                                      <p className="text-sm italic text-slate-300">"{searchResult.technicianNotes}"</p>
                                  </div>
                              )}
                          </div>
                      ) : (
                          <div className="flex items-center gap-4 text-red-400 p-2">
                              <AlertCircle className="w-6 h-6 shrink-0" />
                              <p className="font-bold text-sm">Código no encontrado. Verifica tu ticket e intenta de nuevo.</p>
                          </div>
                      )}
                  </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-slate-500">La confianza de nuestros usuarios es nuestro mayor respaldo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Carlos R.', text: 'Excelente atención y precios justos. Compré mi Samsung S24 aquí y estoy muy satisfecho.' },
              { name: 'Ana M.', text: 'Repararon mi iPhone en menos de 2 horas. Servicio profesional y confiable.' },
              { name: 'Miguel T.', text: 'Compré accesorios para toda la familia. Gran variedad y buenos precios.' }
            ].map((t, i) => (
              <div key={i} className="glass-card p-8 relative">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Sparkles key={i} className="w-4 h-4 text-primary fill-primary" />)}
                </div>
                <p className="text-slate-600 italic mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <span className="font-bold text-slate-900">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestras Tiendas */}
      <section id="tiendas" className="py-24 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-4 block">Presencia Local</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Nuestras <span className="text-primary italic">Sucursales.</span></h2>
            </div>
            <p className="text-slate-500 max-w-md font-medium">Visítanos y prueba los últimos lanzamientos en nuestras zonas de experiencia.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {branches.map((branch: any) => (
              <motion.div 
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group glass-card overflow-hidden bg-white"
              >
                <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                  <img 
                    src={getPublicUrl(branch.imageUrl) || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`} 
                    alt={branch.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{branch.name}</h3>
                  <p className="text-slate-500 text-sm mb-6 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {branch.address}
                  </p>
                  <button 
                    onClick={() => handleViewBranch(branch.id)}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-primary transition-all flex items-center justify-center gap-2 group-hover:shadow-xl group-hover:shadow-primary/20"
                  >
                    <LayoutGrid className="w-4 h-4" /> Ver Productos
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-white text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black mb-6">¿Listo para renovar tu celular?</h2>
            <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed">
              Visítanos en cualquiera de nuestras sucursales o realiza tu pedido por WhatsApp. Te asesoramos sin compromiso.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
              <a href="#productos" className="w-full sm:w-auto bg-white text-primary px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg hover:bg-slate-900 hover:text-white transition-all shadow-xl">
                Ver Catálogo Completo
              </a>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full sm:w-auto bg-slate-900 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg hover:bg-white hover:text-primary transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <ShoppingCart className="w-6 h-6" />
                Ver mi Carrito
              </button>
            </div>
          </div>
          <Smartphone className="absolute -right-20 -bottom-20 w-64 md:w-96 h-64 md:h-96 text-white/10 rotate-12 hidden sm:block" />
          <ShoppingCart className="absolute -left-20 -top-20 w-48 md:w-64 h-48 md:h-64 text-white/10 -rotate-12 hidden sm:block" />
        </div>
      </section>
        </>
      )}

      {/* Repair Request Modal */}
      <AnimatePresence>
        {isRepairModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRepairModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md max-h-[90vh] bg-white z-[110] rounded-[2.5rem] shadow-2xl p-8 md:p-10 overflow-y-auto"
            >
              <button 
                onClick={() => setIsRepairModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wrench className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Solicitar Reparación</h3>
                <p className="text-slate-500 mt-2 text-sm">Completa los datos y te contactaremos por WhatsApp</p>
              </div>

              <form onSubmit={handleRepairSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tu Nombre</label>
                  <input 
                    required
                    type="text"
                    value={repairForm.name}
                    onChange={(e) => setRepairForm({...repairForm, name: e.target.value})}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp</label>
                  <input 
                    required
                    type="tel"
                    value={repairForm.phone}
                    onChange={(e) => setRepairForm({...repairForm, phone: e.target.value})}
                    placeholder="Ej: 999 999 999"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Equipo / Modelo</label>
                  <input 
                    required
                    type="text"
                    value={repairForm.device}
                    onChange={(e) => setRepairForm({...repairForm, device: e.target.value})}
                    placeholder="Ej: iPhone 13 Pro"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">¿Qué falla tiene?</label>
                  <textarea 
                    required
                    value={repairForm.issue}
                    onChange={(e) => setRepairForm({...repairForm, issue: e.target.value})}
                    placeholder="Ej: Pantalla rota, no carga..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-5 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-4"
                >
                  <MessageCircle className="w-6 h-6" />
                  Enviar por WhatsApp
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Smartphone className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900">Mundo Celular Zelin</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Mundo Celular Zelin - Jr jose pezo mz 65 lote 11. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-primary transition-colors font-bold text-sm">Facebook</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors font-bold text-sm">WhatsApp</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors font-bold text-sm">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
