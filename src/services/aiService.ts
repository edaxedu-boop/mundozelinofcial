import { insforge } from "../lib/insforge";

export async function generateInventoryReport(data: any) {
  const prompt = `Analiza los siguientes datos de inventario y ventas de una tienda de celulares llamada "Mundo Celular Zelin". 
  Proporciona un resumen ejecutivo, identifica productos con bajo stock, tendencias de ventas y recomendaciones estratégicas.
  
  Datos: ${JSON.stringify(data)}
  
  Responde en español con formato Markdown.`;

  try {
    const response = await insforge.ai.chat.completions.create({
      model: "deepseek/deepseek-v3.2",
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
    return "Error al generar el reporte con IA (DeepSeek). Por favor, verifique que los datos sean correctos e intente de nuevo.";
  }
}
