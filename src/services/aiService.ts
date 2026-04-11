import { insforge } from "../lib/insforge";

export async function generateInventoryReport(data: any) {
  // Simplificar los datos para evitar errores de tamaño de contexto
  const summaryData = {
    inventorySummary: data.inventory?.map((i: any) => ({ 
      nombre: i.name, 
      stock: i.stock, 
      precio: i.price, 
      cat: i.category 
    })),
    salesTotal: data.sales?.reduce((acc: number, s: any) => acc + s.total, 0),
    recentSales: data.sales?.slice(-10).map((s: any) => ({ 
      cliente: s.customerName, 
      total: s.total, 
      tipo: s.type 
    })),
    servicesCount: data.services?.length
  };

  const prompt = `Analiza estos datos de "Mundo Celular Zelin". Proporciona:
  1. Resumen ejecutivo.
  2. Alertas de stock bajo.
  3. Análisis de ventas recientes.
  4. 3 Recomendaciones estratégicas.
  
  Datos: ${JSON.stringify(summaryData)}
  
  Responde en español con formato Markdown profesional.`;

  try {
    const response = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un experto analista de negocios para tiendas de tecnología." },
        { role: "user", content: prompt }
      ],
    });
    
    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content;
    } else {
      throw new Error("Respuesta de IA vacía o con formato inesperado");
    }
  } catch (error) {
    console.error("Detailed Error generating AI report:", error);
    return "Error al generar el reporte con IA. Por favor, asegúrese de que las variables de entorno estén configuradas en Vercel e intente de nuevo.";
  }
}
