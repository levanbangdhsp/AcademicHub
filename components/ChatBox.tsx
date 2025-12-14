
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, Sparkles } from 'lucide-react';
import { getAdmissionAdvice } from '../services/gemini';

interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

export const ChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'bot', text: 'Chào bạn! Tôi là Trợ lý Nghiên cứu (Research Assistant). Tôi chuyên hỗ trợ về: Ý tưởng đề tài, Phương pháp nghiên cứu, Viết bài báo & Luận văn. Bạn cần giúp gì về chuyên môn không?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // URL ảnh Robot 3D (Thay thế icon Bot)
  const ROBOT_AVATAR = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleMicClick = () => {
    if (isListening) return;
    setIsListening(true);
    // Simulate listening
    setTimeout(() => {
      setInput("Tư vấn cho tôi về học bổ sung kiến thức");
      setIsListening(false);
    }, 2000);
  };

  // SỬA: Cho phép hàm nhận tham số 'manualText' để gửi ngay khi bấm nút
  const handleSend = async (manualText?: string) => {
    // Nếu có manualText (từ nút gợi ý) thì dùng nó, còn không thì dùng input (người dùng tự gõ)
    const textToSend = typeof manualText === 'string' ? manualText : input;

    if (!textToSend.trim()) return;
    
    // Dùng textToSend thay vì input
    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    
    try {
      // Nhận về Object (answer + suggestions)
      const data = await getAdmissionAdvice("...", userMsg.text);
      setMessages(prev => [...prev, { 
          id: Date.now()+1, 
          sender: 'bot', 
          text: data.answer,         
          suggestions: data.suggestions 
      }]);
    } catch (error) {
      // Fallback response if API fails
      let reply = "Tôi chưa hiểu rõ câu hỏi. Bạn có thể nói rõ hơn không?";
      const lowerInput = userMsg.text.toLowerCase();
      if (lowerInput.includes('tuyển sinh') || lowerInput.includes('đào tạo')) 
        reply = "Bạn có thể xem thông tin chi tiết tại mục 'Đào tạo'. Chúng tôi đang mở đơn đăng ký học bổ sung.";
      if (lowerInput.includes('admin'))
        reply = "Vui lòng liên hệ email admin@edu.vn để được hỗ trợ quyền truy cập.";
      
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'bot', text: reply }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
      {/* Inject Custom CSS for Gemini Spinner */}
      <style>{`
        @keyframes spin-gradient {
          to { transform: rotate(360deg); }
        }
        .gemini-spinner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        .gemini-spinner::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          padding: 2px;
          background: conic-gradient(from 0deg, #3b82f6, #a855f7, #ec4899, #3b82f6);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: spin-gradient 1.5s linear infinite;
        }
      `}</style>

      {isOpen && (
        <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl w-72 md:w-80 h-[420px] flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          {/* Header màu Xanh Dương - Compact */}
          <div className="bg-[#0284c7] text-white p-3 flex items-center justify-between shadow-md">
            <div className="flex items-center">
              <div className="relative mr-2">
                 <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden p-1">
                    <img src={ROBOT_AVATAR} alt="Bot" className="w-full h-full object-cover" />
                 </div>
                 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#0284c7] rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-base">Trợ lý AI</h4>
                <p className="text-[10px] text-blue-100 opacity-90">Sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={18}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender==='user'?'justify-end':'justify-start'}`}>
                {msg.sender === 'bot' && (
                   <div className="w-6 h-6 rounded-full bg-white border border-gray-200 p-0.5 mr-2 self-end mb-1 flex-shrink-0">
                      <img src={ROBOT_AVATAR} alt="Bot" className="w-full h-full object-cover" />
                   </div>
                )}
                <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* 1. Bong bóng chat (Nội dung chính) */}
                  <div className={`p-2.5 rounded-2xl text-xs shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0284c7] text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>

                  {/* 2. Khu vực hiển thị Gợi ý (Chỉ hiện khi là Bot và có dữ liệu suggestions) */}
                  {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2 w-full animate-fade-in">
                      <p className="text-[10px] text-gray-400 italic ml-1">Gợi ý câu hỏi tiếp theo:</p>
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="text-left text-xs bg-white text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition shadow-sm hover:shadow-md"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Hiệu ứng Gemini Thinking */}
            {isThinking && (
              <div className="flex justify-start w-full animate-fade-in items-center mt-2">
                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 p-0.5 mr-2 flex-shrink-0">
                    <img src={ROBOT_AVATAR} alt="Bot" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white border border-purple-100 px-3 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                   <div className="gemini-spinner" style={{width: '16px', height: '16px'}}>
                      <Sparkles size={10} className="text-purple-500 animate-pulse" />
                   </div>
                   <span className="text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
                     Đang suy nghĩ...
                   </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 bg-white border-t flex items-center gap-1.5">
            <button onClick={handleMicClick} className={`p-2 rounded-full transition ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <Mic size={16} />
            </button>
            <input 
              type="text" 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyPress={e=>e.key==='Enter'&&handleSend()} 
              className="flex-1 bg-gray-100 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition" 
              placeholder="Nhập câu hỏi..."
            />
            <button onClick={handleSend} className="text-white bg-[#0284c7] hover:bg-[#0369a1] p-2 rounded-full shadow-md transition transform hover:scale-105">
              <Send size={16}/>
            </button>
          </div>
        </div>
      )}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="bg-[#0284c7] hover:bg-[#0369a1] text-white p-3 rounded-full shadow-xl transition-all hover:scale-110 border-4 border-white flex items-center justify-center group relative">
           <img src={ROBOT_AVATAR} alt="Bot" className="w-6 h-6 object-cover group-hover:rotate-12 transition-transform" />
           <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
        </button>
      )}
    </div>
  );
};
