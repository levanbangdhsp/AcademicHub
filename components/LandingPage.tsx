import React from 'react';
import { Monitor, PenTool, Database, GraduationCap, FileText } from 'lucide-react';
import { Software } from '../types';

const MY_SOFTWARE: Software[] = [
  { id: 1, title: "Hệ thống Quản lý Đào tạo", desc: "Phần mềm quản lý sinh viên và điểm số tối ưu.", tag: "Quản lý" },
  { id: 2, title: "Tool Phân tích Dữ liệu NCKH", desc: "Tự động hóa xử lý số liệu SPSS/R.", tag: "Công cụ" },
  { id: 3, title: "App Hỗ trợ Trích dẫn", desc: "Quản lý tài liệu tham khảo theo chuẩn APA/IEEE.", tag: "Tiện ích" },
];

interface LandingPageProps {
    onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => (
  <div className="animate-fade-in w-full">
    {/* Slogan Banner - Full width, no margin top to stick to header */}
    <div className="max-w-7xl mx-auto mt-4 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white py-12 text-center relative overflow-hidden shadow-xl">
       <div className="relative z-10 px-6">
         <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">SÁNG TẠO LÀ VÔ HẠN</h1>
         <h2 className="text-lg md:text-xl font-light italic text-blue-200">Creativity is Infinite</h2>
         <p className="mt-6 max-w-3xl mx-auto text-blue-100 text-base md:text-lg leading-relaxed">
            Nền tảng AI toàn năng hỗ trợ nghiên cứu khoa học và đào tạo sau đại học.<br/>
            Từ ý tưởng sơ khai đến bài báo quốc tế chuẩn IMRaD.
         </p>
         <button onClick={onOpenAuth} className="mt-8 bg-white text-blue-900 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition hover:shadow-blue-500/50 text-sm md:text-base">
           Đăng nhập để Khám phá Ngay
         </button>
       </div>
    </div>

    {/* Ecosystem Features Preview */}
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Hệ Sinh Thái Nghiên Cứu</h2>
      <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
        Trang bị đầy đủ công cụ AI mạnh mẽ nhất cho hành trình học thuật của bạn.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Feature 1: Viết Bài Báo */}
        <div onClick={onOpenAuth} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-200 cursor-pointer transition group transform hover:-translate-y-1">
           <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
              <PenTool className="text-green-600 group-hover:text-white" size={28}/>
           </div>
           <h3 className="font-bold text-xl text-gray-900 mb-3">Viết Bài Báo (IMRaD)</h3>
           <p className="text-sm text-gray-600 leading-relaxed">
             Từ ý tưởng đến bản thảo hoàn chỉnh. AI hỗ trợ viết theo cấu trúc IMRaD, tự động trích dẫn chuẩn APA/IEEE và <strong>chuyển đổi luận văn thành bài báo</strong> trong tích tắc.
           </p>
        </div>

        {/* Feature 2: Đào tạo & Hồ sơ */}
        <div onClick={onOpenAuth} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 cursor-pointer transition group transform hover:-translate-y-1">
           <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <GraduationCap className="text-blue-600 group-hover:text-white" size={28}/>
           </div>
           <h3 className="font-bold text-xl text-gray-900 mb-3">Đào tạo & Hồ sơ</h3>
           <p className="text-sm text-gray-600 leading-relaxed">
             Cổng thông tin tích hợp: Nộp hồ sơ xét tuyển, tra cứu chương trình đào tạo, lịch bảo vệ và các thủ tục hành chính sau đại học.
           </p>
        </div>

        {/* Feature 3: Tra cứu Đề tài */}
        <div onClick={onOpenAuth} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 cursor-pointer transition group transform hover:-translate-y-1">
           <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors">
              <Database className="text-orange-600 group-hover:text-white" size={28}/>
           </div>
           <h3 className="font-bold text-xl text-gray-900 mb-3">Tra cứu Đề tài</h3>
           <p className="text-sm text-gray-600 leading-relaxed">
             Kiểm tra trùng lặp tên đề tài với <strong>Cơ sở dữ liệu Luận văn đã bảo vệ</strong> của Nhà trường. Đảm bảo tính mới và tránh rủi ro trùng lặp.
           </p>
        </div>

        {/* Feature 4: Dự án Học thuật (Renamed) */}
        <div onClick={onOpenAuth} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 cursor-pointer transition group transform hover:-translate-y-1">
           <div className="bg-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
              <FileText className="text-purple-600 group-hover:text-white" size={28}/>
           </div>
           <h3 className="font-bold text-xl text-gray-900 mb-3">Dự án Học thuật</h3>
           <p className="text-sm text-gray-600 leading-relaxed">
             Trợ lý AI toàn năng cho <strong>Luận văn, Tiểu luận & Đồ án</strong>. Lập dàn ý chi tiết, viết nội dung chuyên sâu, thẩm định logic và sửa lỗi văn phong tự động.
           </p>
        </div>
      </div>
    </div>

    {/* Product Showcase */}
    <div className="max-w-7xl mx-auto px-4 pb-16">
      <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Sản Phẩm & Giải Pháp Khác</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {MY_SOFTWARE.map((sw) => (
          <div key={sw.id} onClick={onOpenAuth} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group cursor-pointer">
            <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <Monitor size={28} className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{sw.title}</h3>
            <p className="text-gray-600 leading-relaxed">{sw.desc}</p>
            <span className="inline-block mt-4 text-blue-600 text-sm font-semibold group-hover:underline">Đăng nhập để sử dụng →</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);