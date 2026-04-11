import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mock Database (In-memory for this example since Firebase was declined)
  // In a real production app, we'd use a persistent DB.
  const db = {
    branches: [
      { id: "1", name: "Tienda 1", address: "Jr jose pezo mz 65 lote 11" },
      { id: "2", name: "Tienda 2", address: "Jr jose pezo mz 65 lote 11" },
      { id: "3", name: "Tienda 3", address: "Jr jose pezo mz 65 lote 11" }
    ],
    inventory: [
      // Tienda 1
      { id: "1", branchId: "1", name: "iPhone 15 Pro", brand: "Apple", stock: 10, price: 4500, category: "Celulares" },
      { id: "2", branchId: "1", name: "Samsung S24 Ultra", brand: "Samsung", stock: 5, price: 4200, category: "Celulares" },
      { id: "7", branchId: "1", name: "Xiaomi 14 Ultra", brand: "Xiaomi", stock: 8, price: 3800, category: "Celulares" },
      { id: "8", branchId: "1", name: "AirPods Pro 2", brand: "Apple", stock: 20, price: 950, category: "Parlantes" },
      { id: "9", branchId: "1", name: "Case MagSafe iPhone 15", brand: "Apple", stock: 30, price: 150, category: "Accesorio" },
      { id: "10", branchId: "1", name: "Cargador Carga Rápida 45W", brand: "Samsung", stock: 25, price: 120, category: "Accesorio" },
      { id: "11", branchId: "1", name: "Protector de Pantalla Cerámico", brand: "Genérico", stock: 100, price: 40, category: "Accesorio" },
      { id: "12", branchId: "1", name: "Huawei Watch GT 4", brand: "Huawei", stock: 12, price: 850, category: "Wearable" },
      { id: "13", branchId: "1", name: "Sony WH-1000XM5", brand: "Sony", stock: 6, price: 1400, category: "Parlantes" },
      { id: "14", branchId: "1", name: "iPad Air M2", brand: "Apple", stock: 4, price: 2800, category: "Tablet" },

      // Tienda 2
      { id: "3", branchId: "2", name: "Xiaomi Redmi Note 13 Pro", brand: "Xiaomi", stock: 15, price: 1200, category: "Celulares" },
      { id: "4", branchId: "2", name: "Cargador 20W", brand: "Apple", stock: 50, price: 99, category: "Accesorio" },
      { id: "15", branchId: "2", name: "Motorola Moto G84", brand: "Motorola", stock: 10, price: 1100, category: "Celulares" },
      { id: "16", branchId: "2", name: "Samsung Galaxy A54", brand: "Samsung", stock: 12, price: 1450, category: "Celulares" },
      { id: "17", branchId: "2", name: "Audífonos JBL Tune 510BT", brand: "JBL", stock: 18, price: 190, category: "Parlantes" },
      { id: "18", branchId: "2", name: "Power Bank 20000mAh", brand: "Xiaomi", stock: 22, price: 130, category: "Accesorio" },
      { id: "19", branchId: "2", name: "Cable USB-C a Lightning", brand: "Apple", stock: 40, price: 85, category: "Accesorio" },
      { id: "20", branchId: "2", name: "Smartband Mi Band 8", brand: "Xiaomi", stock: 30, price: 160, category: "Wearable" },
      { id: "21", branchId: "2", name: "Parlante Bluetooth Go 3", brand: "JBL", stock: 15, price: 170, category: "Parlantes" },
      { id: "22", branchId: "2", name: "Memoria MicroSD 128GB", brand: "Kingston", stock: 50, price: 65, category: "Accesorio" },

      // Tienda 3
      { id: "5", branchId: "3", name: "Funda Silicona Universal", brand: "Genérico", stock: 100, price: 30, category: "Accesorio" },
      { id: "6", branchId: "3", name: "Motorola Edge 40 Neo", brand: "Motorola", stock: 8, price: 1800, category: "Celulares" },
      { id: "23", branchId: "3", name: "iPhone 13 128GB", brand: "Apple", stock: 6, price: 2600, category: "Celulares" },
      { id: "24", branchId: "3", name: "Samsung Galaxy A15", brand: "Samsung", stock: 14, price: 750, category: "Celulares" },
      { id: "25", branchId: "3", name: "Audífonos In-Ear", brand: "Sony", stock: 25, price: 45, category: "Parlantes" },
      { id: "26", branchId: "3", name: "Soporte para Auto", brand: "Genérico", stock: 40, price: 35, category: "Accesorio" },
      { id: "27", branchId: "3", name: "Adaptador OTG USB-C", brand: "Genérico", stock: 60, price: 15, category: "Accesorio" },
      { id: "28", branchId: "3", name: "Reloj Inteligente Kids", brand: "Genérico", stock: 20, price: 120, category: "Wearable" },
      { id: "29", branchId: "3", name: "Xiaomi Poco X6 Pro", brand: "Xiaomi", stock: 9, price: 1650, category: "Celulares" },
      { id: "30", branchId: "3", name: "Trípode para Celular", brand: "Genérico", stock: 15, price: 55, category: "Accesorio" }
    ],
    sales: [
      { id: "s1", date: new Date().toISOString(), items: [{ id: "1", name: "iPhone 15 Pro", quantity: 1, price: 4500 }], total: 4500, type: "CONTADO", customerName: "Ana García", sellerId: "3", branchId: "1" },
      { id: "s2", date: new Date().toISOString(), items: [{ id: "3", name: "Xiaomi Redmi Note 13", quantity: 1, price: 1200 }], total: 1200, type: "CREDITO", customerName: "Pedro López", sellerId: "3", branchId: "2" }
    ],
    technicalServices: [
      { 
        id: "ts1", 
        customerName: "Maria Torres", 
        customerPhone: "955443322",
        device: "iPhone 13", 
        issue: "Pantalla rota", 
        status: "EN_REPARACION", 
        cost: 450, 
        date: new Date().toISOString(), 
        branchId: "1",
        technicianNotes: "Se requiere cambio de módulo original. Repuesto en camino.",
        estimatedDeliveryDate: "2024-04-12T18:00:00Z"
      },
      { 
        id: "ts2", 
        customerName: "Jose Ruiz", 
        customerPhone: "912345678",
        device: "Samsung A54", 
        issue: "Cambio de batería", 
        status: "LISTO", 
        cost: 120, 
        date: new Date().toISOString(), 
        branchId: "1",
        technicianNotes: "Batería reemplazada con éxito. Pruebas de carga completadas.",
        estimatedDeliveryDate: "2024-04-09T10:00:00Z"
      },
      { 
        id: "ts3", 
        customerName: "Luis Castro", 
        customerPhone: "987654321",
        device: "Motorola G84", 
        issue: "No carga", 
        status: "RECIBIDO", 
        cost: 80, 
        date: new Date().toISOString(), 
        branchId: "2",
        technicianNotes: "Pendiente de revisión de pin de carga.",
        estimatedDeliveryDate: "2024-04-10T15:00:00Z"
      }
    ],
    users: [
      { id: "2", email: "admin1@zelin.com", password: "admin", role: "ADMIN_SUCURSAL", name: "Admin Sede Central", branchId: "1" },
      { id: "3", email: "vendedor1@zelin.com", password: "admin", role: "VENDEDOR", name: "Juan Vendedor", branchId: "1" },
      { id: "4", email: "cliente@gmail.com", password: "admin", role: "CLIENTE", name: "Carlos Cliente" },
      { id: "5", email: "superadmin@gmail.com", password: "admin", role: "SUPER_ADMIN", name: "Super Admin" }
    ],
    customers: [
      { id: "c1", name: "Ana García", email: "ana@example.com", phone: "987654321", documentId: "12345678", address: "Av. Larco 123", totalPurchases: 4500, lastVisit: new Date().toISOString(), branchId: "1" },
      { id: "c2", name: "Pedro López", email: "pedro@example.com", phone: "912345678", documentId: "87654321", address: "Calle Lima 456", totalPurchases: 1200, lastVisit: new Date().toISOString(), branchId: "2" },
      { id: "c3", name: "Maria Torres", email: "maria@example.com", phone: "955443322", documentId: "44556677", address: "Urb. Los Pinos 789", totalPurchases: 450, lastVisit: new Date().toISOString(), branchId: "1" }
    ],
    credits: [
      { 
        id: "cr1", 
        saleId: "s2", 
        customerId: "c2", 
        customerName: "Pedro López", 
        totalAmount: 1200, 
        paidAmount: 400, 
        status: "PENDIENTE",
        branchId: "2",
        installments: [
          { id: "i1", dueDate: "2024-04-15", amount: 400, status: "PAGADO" },
          { id: "i2", dueDate: "2024-05-15", amount: 400, status: "PENDIENTE" },
          { id: "i3", dueDate: "2024-06-15", amount: 400, status: "PENDIENTE" }
        ]
      }
    ],
    movements: [
      { id: "m1", date: new Date().toISOString(), type: "INGRESO", category: "CAJA", description: "Venta contado iPhone 15 Pro", amount: 4500, branchId: "1", userId: "3", userName: "Juan Vendedor" },
      { id: "m2", date: new Date().toISOString(), type: "EGRESO", category: "CAJA", description: "Pago de luz local 1", amount: 150, branchId: "1", userId: "2", userName: "Admin Sede Central" },
      { id: "m3", date: new Date().toISOString(), type: "TRASLADO", category: "INVENTARIO", description: "Traslado de iPhone 15 Pro a Tienda 2", productId: "1", productName: "iPhone 15 Pro", quantity: 1, branchId: "1", targetBranchId: "2", userId: "1", userName: "Admin General" }
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

  // API Routes
  app.get("/api/users", (req, res) => {
    res.json(db.users);
  });

  app.post("/api/users", (req, res) => {
    const user = { ...req.body, id: Date.now().toString() };
    db.users.push(user);
    res.json(user);
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...req.body };
      res.json(db.users[index]);
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
      db.users.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  });

  app.get("/api/settings", (req, res) => {
    res.json(db.settings);
  });

  app.put("/api/settings", (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    res.json(db.settings);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  });

  app.get("/api/movements", (req, res) => {
    res.json(db.movements);
  });

  app.post("/api/movements", (req, res) => {
    const movement = { ...req.body, id: Date.now().toString(), date: new Date().toISOString() };
    db.movements.push(movement);
    res.json(movement);
  });

  app.get("/api/inventory", (req, res) => {
    res.json(db.inventory);
  });

  app.get("/api/branches", (req, res) => {
    res.json(db.branches);
  });

  app.post("/api/branches", (req, res) => {
    const branch = { ...req.body, id: Date.now().toString() };
    db.branches.push(branch);
    res.json(branch);
  });

  app.put("/api/branches/:id", (req, res) => {
    const { id } = req.params;
    const index = db.branches.findIndex(b => b.id === id);
    if (index !== -1) {
      db.branches[index] = { ...db.branches[index], ...req.body };
      res.json(db.branches[index]);
    } else {
      res.status(404).json({ error: "Sucursal no encontrada" });
    }
  });

  app.delete("/api/branches/:id", (req, res) => {
    const { id } = req.params;
    db.branches = db.branches.filter(b => b.id !== id);
    res.json({ success: true });
  });

  app.post("/api/sales", (req, res) => {
    const sale = { ...req.body, id: Date.now().toString(), date: new Date().toISOString() };
    db.sales.push(sale);
    // Update stock
    sale.items.forEach((item: any) => {
      const invItem = db.inventory.find(i => i.id === item.id);
      if (invItem) invItem.stock -= item.quantity;
    });
    res.json(sale);
  });

  app.get("/api/sales", (req, res) => {
    res.json(db.sales);
  });

  app.post("/api/technical-services", (req, res) => {
    const service = { ...req.body, id: Date.now().toString(), status: "RECIBIDO", date: new Date().toISOString() };
    db.technicalServices.push(service);
    res.json(service);
  });

  app.get("/api/technical-services", (req, res) => {
    res.json(db.technicalServices);
  });

  app.get("/api/customers", (req, res) => {
    res.json(db.customers);
  });
  
  app.get("/api/credits", (req, res) => {
    res.json(db.credits);
  });

  app.post("/api/customers", (req, res) => {
    const customer = { ...req.body, id: Date.now().toString(), totalPurchases: 0, lastVisit: new Date().toISOString() };
    db.customers.push(customer);
    res.json(customer);
  });

  app.post("/api/ai-report", async (req, res) => {
    const { inventory, sales, services } = req.body;
    // In a real app, we'd call the Gemini API here.
    // Since we are in the server, we can't call @google/genai directly as per instructions (must be frontend).
    // But wait, the instructions say "NEVER call Gemini API from the backend".
    // So I should move the AI logic to the frontend component.
    // I'll just return a placeholder or a prompt for the frontend to handle.
    res.json({ message: "Please call Gemini API from frontend" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
