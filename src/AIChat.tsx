import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AIChat({ inventory, settings, insforge }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente virtual de Mundo Celular Zelin. ¿En qué puedo ayudarte hoy? Puedes preguntarme por precios, stock o características de nuestros productos.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const productsCtx = inventory.map((p: any) => 
        `- ${p.name} (Marca: ${p.brand}, S/ ${p.price}, Stock: ${p.stock}, Colores: ${p.colors?.join(', ') || 'N/A'}, Detalles: ${p.description || 'Sin descripción'})`
      ).slice(0, 30).join('\n');

      // Use exact pattern from aiService.ts which is known to work
      const response = await insforge.ai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { 
            role: 'system', 
            content: `Eres el asesor virtual de Mundo Celular Zelin. 
            CONTEXTO DE TIENDA: Somos líderes en tecnología y reparación de celulares.
            INVENTARIO ACTUAL:
            ${productsCtx}
            
            REGLAS:
            1. Sé amable, experto y profesional.
            2. Responde sobre características, precios y disponibilidad basados EN EL INVENTARIO.
            3. Si preguntan por reparaciones, menciona que tenemos servicio técnico especializado.
            4. IMPORTANTE: Al final de CADA respuesta debes preguntar: "¿Deseas que te derive con un asesor para completar tu compra o consulta?" de forma natural.
            5. Mantén las respuestas concisas pero útiles.` 
          },
          ...messages.slice(-6),
          userMsg
        ]
      });

      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const aiContent = response.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      } else {
        throw new Error("Respuesta de IA vacía o con formato inesperado");
      }
    } catch (err) {
      console.error("AI Error Detailed:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Lo siento, tengo un problema de conexión temporal. ¿Te gustaría que te derive con un asesor por WhatsApp directamente?",
        isError: true 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAdvisor = () => {
    const lastSummary = messages.slice(-4).map(m => m.content).join('\n');
    const waText = encodeURIComponent(`Hola Zelin! Estuve conversando con su asistente IA y estoy interesado en consultarte algo: \n\n${lastSummary.substring(0, 200)}...`);
    window.open(`https://wa.me/${settings.phone || '51999999999'}?text=${waText}`, '_blank');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-110 transition-all group"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="font-bold text-sm whitespace-nowrap hidden sm:block">¡Escríbenos!</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] lg:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="fixed bottom-6 right-6 z-[120] w-full max-w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
            >
              <div className="bg-[#84cc16] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Asesor Virtual</h4>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Online Now</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "ml-auto bg-slate-900 text-white rounded-br-none" 
                      : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                  )}>
                    {msg.content}
                    {msg.role === 'assistant' && (msg.content.toLowerCase().includes('derivar') || msg.isError) && (
                      <button 
                        onClick={handleConfirmAdvisor}
                        className="mt-3 w-full bg-[#25D366] text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:scale-105 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" /> Hablar con Asesor Humano
                      </button>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="bg-white border border-slate-100 text-slate-400 p-4 rounded-2xl rounded-bl-none w-16 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                  className="flex gap-2"
                >
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu duda aquí..."
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <button 
                    disabled={isTyping}
                    className="w-12 h-12 bg-[#84cc16] text-white rounded-2xl flex items-center justify-center hover:bg-slate-900 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
