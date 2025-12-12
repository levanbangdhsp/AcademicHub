import React from 'react';
import { Presentation, Search, User, FileText } from 'lucide-react';

export const GuideView: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 flex flex-col h-full">
      <div className="flex items-center mb-6">
        <div className="bg-orange-100 p-3 rounded-xl mr-4">
          <Presentation className="text-orange-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Thiết kế Slide Bảo vệ</h2>
      </div>
      
      <div className="flex-1 space-y-4">
        <p className="text-gray-600 mb-4 text-sm">Nguyên tắc vàng khi bảo vệ trước hội đồng:</p>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
           <h4 className="font-bold text-orange-800 text-sm mb-2">Quy tắc 10-20-30</h4>
           <p className="text-sm text-orange-700">Không quá 10 slide, không quá 20 phút trình bày, font chữ không nhỏ hơn 30pt.</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
           <h4 className="font-bold text-gray-800 text-sm mb-2">Visualize Dữ liệu</h4>
           <p className="text-sm text-gray-600">Tuyệt đối không copy-paste văn bản từ Word sang. Hãy dùng biểu đồ, sơ đồ tư duy.</p>
        </div>
      </div>

      <button className="w-full mt-6 bg-white text-orange-600 border border-orange-200 py-3 rounded-xl font-bold hover:bg-orange-50 transition flex items-center justify-center">
        Tải mẫu Slide ĐH Sư phạm (PPTX)
      </button>
    </div>

    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 flex flex-col h-full">
      <div className="flex items-center mb-6">
        <div className="bg-red-100 p-3 rounded-xl mr-4">
          <Search className="text-red-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Kiểm tra Đạo văn</h2>
      </div>
      
      <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6">
        <h3 className="text-red-800 font-bold text-sm mb-1 flex items-center"><User size={14} className="mr-1"/> Cảnh báo từ Hội đồng:</h3>
        <p className="text-red-700 text-xs mt-1">Tỷ lệ trùng lắp cho phép thường dưới <strong>20%</strong>. Hãy trích dẫn (cite) đúng quy định APA/IEEE.</p>
      </div>
      
      <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-500 hover:bg-gray-100 hover:border-red-300 cursor-pointer transition group">
        <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition">
             <FileText size={32} className="text-gray-400 group-hover:text-red-500" />
        </div>
        <span className="text-sm font-bold text-gray-700">Kéo thả file luận văn vào đây</span>
        <span className="text-xs mt-1">Hỗ trợ: .docx, .pdf (Max 50MB)</span>
      </div>
      
      <button className="w-full mt-6 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition">
        Quét trùng lắp ngay
      </button>
    </div>
  </div>
);