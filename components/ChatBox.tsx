
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, Sparkles, ExternalLink } from 'lucide-react';
import { getAdmissionAdvice } from '../services/gemini';

interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  suggestions?: string[];
}

// Hàm chuẩn hóa văn bản, xử lý các trường hợp markdown bị dính dòng từ AI và loại bỏ khoảng cách trước dấu câu
const normalizeMessageText = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    // Thay thế các ký tự non-breaking space (U+00A0...) thành space thông thường
    .replace(/[\u00A0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
    // 1. Loại bỏ triệt để khoảng trắng giữa phần highlight và các dấu câu liền kề:
    // **từ khóa** : -> **từ khóa**:
    // **từ khóa** , -> **từ khóa**,
    // **từ khóa** . -> **từ khóa**.
    .replace(/(\*\*|__|==)\s+([,.:;!?\)\]])/g, '$1$2')
    // 2. Xóa khoảng cách thừa ở mép trong dấu highlight
    .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1**')
    .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**')
    .replace(/__([^\n]+?)\s+__/g, '__$1__')
    .replace(/__\s+([^\n]+?)__/g, '__$1__')
    .replace(/==([^\n]+?)\s+==/g, '==$1==')
    .replace(/==\s+([^\n]+?)==/g, '==$1==')
    // 3. Đảm bảo sau dấu hai chấm và dấu phẩy có đúng 1 khoảng trắng (nếu liền sau là chữ hoặc dấu highlight)
    .replace(/([,:])(?=[^\s\n])/g, '$1 ')
    // 4. Tách các gạch đầu dòng dính liền câu trước: "...để tốt nghiệp. * **Mục tiêu:**" -> "...để tốt nghiệp.\n- **Mục tiêu:**"
    .replace(/([.!?])\s*(\*|-)\s+/g, '$1\n- ')
    // 5. Tách "* **" thành "\n- **" nếu chưa xuống dòng
    .replace(/([^\n])\s+(\*|-)\s+\*\*/g, '$1\n- **')
    // 6. Chuyển các dòng bắt đầu bằng "* " thành "- "
    .replace(/^(\s*)\*\s+/gm, '$1- ');
};

// Component phân tích inline text: **từ khóa** -> Badge nổi bật màu vàng pastel (giống hình 2), ôm sát chữ (giống hình 3)
const renderInlineTokens = (text: string, isUser: boolean) => {
  const tokenRegex = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|==[\s\S]+?==|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*[^*\n]+\*)/g;
  const parts = text.split(tokenRegex);

  // Xóa triệt để mọi khoảng trắng trước dấu câu ở đầu token ngay sau thẻ highlight
  for (let i = 0; i < parts.length; i++) {
    const isHighlight =
      (parts[i].startsWith('**') && parts[i].endsWith('**')) ||
      (parts[i].startsWith('__') && parts[i].endsWith('__')) ||
      (parts[i].startsWith('==') && parts[i].endsWith('=='));
    if (isHighlight && i + 1 < parts.length && typeof parts[i + 1] === 'string') {
      parts[i + 1] = parts[i + 1].replace(/^\s+([,.:;!?\)\]])/, '$1');
    }
  }

  return parts.map((part, i) => {
    if (!part) return null;

    // 1. Highlight: **từ khóa** hoặc __từ khóa__ hoặc ==từ khóa==
    const isDoubleAsterisk = part.startsWith('**') && part.endsWith('**') && part.length >= 4;
    const isDoubleUnderscore = part.startsWith('__') && part.endsWith('__') && part.length >= 4;
    const isHighlight = part.startsWith('==') && part.endsWith('==') && part.length >= 4;

    if (isDoubleAsterisk || isDoubleUnderscore || isHighlight) {
      const content = part.slice(2, -2).trim();

      if (isUser) {
        return (
          <span 
            key={i} 
            className="bg-white/20 text-white font-semibold px-1 py-[1px] rounded-[3px] inline text-[11px]"
          >
            {content}
          </span>
        );
      }

      // Điểm nhấn màu vàng pastel nhẹ (giống hình 2), ôm sát chữ tối đa, không để hở khoảng trống với các dấu câu
      return (
        <span 
          key={i} 
          className="bg-[#fef9c3] text-[#0369a1] font-semibold rounded-[3px] border border-[#fef08a] inline text-[11.5px] leading-tight"
          style={{ 
            boxDecorationBreak: 'clone', 
            WebkitBoxDecorationBreak: 'clone',
            paddingLeft: '3px',
            paddingRight: '2px',
            paddingTop: '1px',
            paddingBottom: '1px',
            marginRight: 0,
            marginLeft: 0
          }}
        >
          {content}
        </span>
      );
    }

    // 2. Link markdown: [Tiêu đề](URL)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, linkText, linkUrl] = linkMatch;
      return (
        <a
          key={i}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-semibold underline decoration-sky-300 underline-offset-2 break-all transition-colors px-1 py-0.5 rounded inline-flex items-center gap-0.5 ${
            isUser ? 'text-white hover:text-sky-100' : 'text-[#0284c7] hover:text-[#0369a1] hover:bg-sky-50'
          }`}
        >
          <span>{linkText}</span>
          <ExternalLink size={10} className="inline opacity-80" />
        </a>
      );
    }

    // 3. Inline code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const code = part.slice(1, -1);
      return (
        <code 
          key={i} 
          className={`px-1 py-0.5 rounded text-[11px] font-mono ${
            isUser ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          {code}
        </code>
      );
    }

    // 4. In nghiêng: *italic*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return <em key={i} className="italic text-gray-600">{part.slice(1, -1)}</em>;
    }

    // Văn bản thông thường
    return <span key={i}>{part}</span>;
  });
};

// Component hiển thị nội dung tin nhắn có điểm nhấn & danh sách gạch đầu dòng
const FormattedMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  const normalized = normalizeMessageText(text);
  const lines = normalized.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-1" />;
        }

        // Kiểm tra dòng gạch đầu dòng
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('-**') || trimmed.startsWith('-__');
        if (isBullet) {
          const bulletText = trimmed.replace(/^[-•]\s*/, '').replace(/^-(?=(\*\*|__))/, '');
          return (
            <div key={index} className="flex items-start gap-1.5 my-1 pl-0.5">
              <span className={`inline-block select-none font-bold text-xs mt-0.5 leading-none ${isUser ? 'text-sky-200' : 'text-[#0284c7]'}`}>
                •
              </span>
              <div className="flex-1 leading-relaxed">
                {renderInlineTokens(bulletText, isUser)}
              </div>
            </div>
          );
        }

        return (
          <p key={index} className="my-0.5 first:mt-0 last:mb-0 leading-relaxed">
            {renderInlineTokens(line, isUser)}
          </p>
        );
      })}
    </div>
  );
};

export const ChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 1, 
      sender: 'bot', 
      text: 'Chào bạn!\n\nTôi là **Trợ lý Nghiên cứu & Học thuật** của ĐH Sư phạm TP.HCM. Tôi chuyên hỗ trợ về:\n- **Định hướng nghiên cứu**: Quy chế làm **luận văn thạc sĩ** & đề án\n- **Ý tưởng đề tài**: Đánh giá tính mới, khoảng trống nghiên cứu\n- **Phương pháp & Viết bài**: Chuẩn trích dẫn & bài báo IMRaD\n\nBạn cần hỗ trợ gì về chuyên môn học thuật không?',
      suggestions: [
        "Định hướng nghiên cứu có làm luận văn không?",
        "Thời gian và khối lượng tín chỉ luận văn thạc sĩ?",
        "Điều kiện để được bảo vệ luận văn?"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // URL ảnh Robot 3D
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
      setInput("Định hướng nghiên cứu có làm luận văn không?");
      setIsListening(false);
    }, 1500);
  };

  const handleSend = async (manualText?: string) => {
    const textToSend = typeof manualText === 'string' ? manualText : input;
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    
    try {
      const data = await getAdmissionAdvice("...", userMsg.text);
      setMessages(prev => [...prev, { 
        id: Date.now()+1, 
        sender: 'bot', 
        text: data.answer,         
        suggestions: data.suggestions 
      }]);
    } catch (error) {
      // Fallback câu trả lời có định dạng điểm nhấn rõ ràng
      let reply = "Chào bạn,\n\nTôi chưa hiểu rõ câu hỏi. Bạn có thể nói rõ hơn để tôi tư vấn chính xác về **chuyên môn nghiên cứu** hoặc **quy chế đào tạo** nhé!";
      let suggestions: string[] = [
        "Định hướng nghiên cứu có làm luận văn không?",
        "Khối lượng tín chỉ luận văn thạc sĩ?"
      ];

      const lowerInput = userMsg.text.toLowerCase();
      if (lowerInput.includes('định hướng nghiên cứu') || lowerInput.includes('luận văn') || lowerInput.includes('thạc sĩ')) {
        reply = "Chào bạn,\n\nĐối với học viên theo học **chương trình định hướng nghiên cứu** tại Trường Đại học Sư phạm TP.HCM, việc thực hiện **luận văn thạc sĩ** là yêu cầu **bắt buộc**.\n\nDưới đây là một số thông tin quy định cụ thể về luận văn thạc sĩ đối với định hướng này để bạn tham khảo:\n- **Khối lượng và thời gian**: Học viên phải thực hiện một đề tài luận văn thạc sĩ có khối lượng **15 tín chỉ**, trong thời gian thực hiện theo quy chế.\n- **Điều kiện bảo vệ**: Cần hoàn thành đủ học phần trong chương trình đào tạo và có **bài báo khoa học** công bố trên tạp chí chuyên ngành.";
        suggestions = ["Thời gian thực hiện luận văn là bao lâu?", "Quy định về bài báo khoa học để bảo vệ?"];
      } else if (lowerInput.includes('tuyển sinh') || lowerInput.includes('đào tạo')) {
        reply = "Chào bạn,\n\nBạn có thể xem thông tin chi tiết tại mục **Đào tạo** hoặc cổng thông tin tuyển sinh của Trường: [tuyensinh.hcmue.edu.vn](https://tuyensinh.hcmue.edu.vn). Nhà trường đang mở đơn đăng ký **học bổ sung kiến thức**.";
        suggestions = ["Hồ sơ tuyển sinh thạc sĩ gồm gì?", "Điều kiện xét tuyển đầu vào?"];
      } else if (lowerInput.includes('admin')) {
        reply = "Vui lòng liên hệ email **admin@hcmue.edu.vn** để được hỗ trợ quyền truy cập Quản trị viên.";
        suggestions = [];
      }
      
      setMessages(prev => [...prev, { 
        id: Date.now()+1, 
        sender: 'bot', 
        text: reply,
        suggestions 
      }]);
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
        <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl w-80 sm:w-[370px] h-[480px] flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          {/* Header màu Xanh Dương - Compact */}
          <div className="bg-[#0284c7] text-white p-3 flex items-center justify-between shadow-md">
            <div className="flex items-center">
              <div className="relative mr-2.5">
                 <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden p-1">
                    <img src={ROBOT_AVATAR} alt="Bot" className="w-full h-full object-cover" />
                 </div>
                 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#0284c7] rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Trợ lý AI</h4>
                <p className="text-[10px] text-blue-100 opacity-90">Sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 p-1.5 rounded-full transition text-white"
              title="Đóng chatbox"
            >
              <X size={18}/>
            </button>
          </div>
          
          {/* Vùng tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/70">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                   <div className="w-6 h-6 rounded-full bg-white border border-gray-200 p-0.5 mr-2 self-start mt-1 flex-shrink-0 shadow-xs">
                      <img src={ROBOT_AVATAR} alt="Bot" className="w-full h-full object-cover" />
                   </div>
                )}
                <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* 1. Bong bóng chat với định dạng điểm nhấn */}
                  <div className={`p-3 rounded-2xl text-xs shadow-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0284c7] text-white rounded-tr-none'
                      : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-none shadow-sm'
                  }`}>
                    <FormattedMessage text={msg.text} isUser={msg.sender === 'user'} />
                  </div>

                  {/* 2. Khu vực hiển thị Gợi ý câu hỏi tiếp theo */}
                  {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2.5 flex flex-col gap-1.5 w-full animate-fade-in pl-1">
                      <p className="text-[10px] text-gray-400 font-medium ml-1">Gợi ý câu hỏi tiếp theo:</p>
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="text-left text-xs bg-white text-[#0369a1] border border-sky-200 hover:border-[#0284c7] hover:bg-sky-50 px-2.5 py-1.5 rounded-lg transition shadow-2xs hover:shadow-xs group flex items-start justify-between gap-1"
                        >
                          <span className="group-hover:translate-x-0.5 transition-transform">{s}</span>
                          <span className="text-[#0284c7] opacity-60 group-hover:opacity-100 text-xs">→</span>
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
                     Đang xử lý câu trả lời...
                   </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-1.5">
            <button 
              onClick={handleMicClick} 
              className={`p-2 rounded-full transition ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title="Nhập bằng giọng nói"
            >
              <Mic size={16} />
            </button>
            <input 
              type="text" 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyPress={e=>e.key==='Enter'&&handleSend()} 
              className="flex-1 bg-gray-100 rounded-full px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition" 
              placeholder="Nhập câu hỏi (VD: Định hướng nghiên cứu...)"
            />
            <button 
              onClick={() => handleSend()} 
              className="text-white bg-[#0284c7] hover:bg-[#0369a1] p-2 rounded-full shadow-md transition transform hover:scale-105 active:scale-95"
              title="Gửi câu hỏi"
            >
              <Send size={15}/>
            </button>
          </div>
        </div>
      )}

      {/* Nút mở Chatbox góc dưới bên phải */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-[#0284c7] hover:bg-[#0369a1] text-white p-3.5 rounded-full shadow-xl transition-all hover:scale-110 border-4 border-white flex items-center justify-center group relative cursor-pointer"
          title="Mở Trợ lý AI"
        >
           <img src={ROBOT_AVATAR} alt="Bot" className="w-6 h-6 object-cover group-hover:rotate-12 transition-transform" />
           <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
            </span>
        </button>
      )}
    </div>
  );
};

