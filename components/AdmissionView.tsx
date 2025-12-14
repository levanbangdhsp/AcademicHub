import React from 'react';
import { FAQItem } from '../types';
import { GraduationCap, CheckCircle, BookOpen, MessageSquare, Calendar, FileText, Scale, ExternalLink, ArrowRight } from 'lucide-react';

const ADMISSION_FAQ: FAQItem[] = [
  { q: "Điều kiện dự thi Cao học tại ĐHSP TP.HCM?", a: "Cần bằng tốt nghiệp ĐH đúng ngành hoặc ngành gần. Nếu ngành khác cần học bổ sung kiến thức. Yêu cầu ngoại ngữ B1 hoặc tương đương." },
  { q: "Thời gian tuyển sinh hằng năm?", a: "Thường có 2 đợt: Đợt 1 vào tháng 5 và Đợt 2 vào tháng 10. Vui lòng theo dõi website phòng SĐH." },
  { q: "Chương trình đào tạo gồm những hướng nào?", a: "Gồm hướng Nghiên cứu (làm luận văn) và hướng Ứng dụng (làm đề án thực tập)." },
];

export const AdmissionView: React.FC = () => (
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 animate-fade-in max-w-5xl mx-auto">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tư vấn Tuyển sinh SĐH</h2>
            <p className="text-gray-500">Thông tin cập nhật mới nhất từ Trường ĐH Sư phạm TP.HCM</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Cột 1: Góc Học viên SĐH (Thay thế Thông tin Đào tạo) */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 flex flex-col h-full">
                <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4"><GraduationCap className="text-blue-600" /></div>
                    <h3 className="font-bold text-xl text-blue-900">Góc Học viên SĐH</h3>
                </div>
                
                <ul className="space-y-4 text-gray-700 flex-1 mb-6">
                    <li>
                        <a href="https://hcmue.edu.vn/vi/dao-tao/sau-dai-hoc/cao-hoc" target="_blank" rel="noreferrer" className="flex items-start hover:text-blue-700 transition group">
                            <Calendar size={20} className="mr-3 text-blue-500 mt-0.5 group-hover:scale-110 transition-transform"/>
                            <div>
                                <span className="font-bold block text-sm">Kế hoạch đào tạo & Thời khóa biểu</span>
                                <span className="text-xs text-gray-500">Tra cứu lịch học, lịch thi mới nhất</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="https://hcmue.edu.vn/vi/dao-tao/sau-dai-hoc/cao-hoc" target="_blank" rel="noreferrer" className="flex items-start hover:text-blue-700 transition group">
                            <Scale size={20} className="mr-3 text-blue-500 mt-0.5 group-hover:scale-110 transition-transform"/>
                            <div>
                                <span className="font-bold block text-sm">Quy chế & Quy định Học vụ</span>
                                <span className="text-xs text-gray-500">Quy định về bảo vệ luận văn, tốt nghiệp</span>
                            </div>
                        </a>
                    </li>
                    <li>
                         <a href="https://hcmue.edu.vn/vi/dao-tao/sau-dai-hoc/cao-hoc" target="_blank" rel="noreferrer" className="flex items-start hover:text-blue-700 transition group">
                            <FileText size={20} className="mr-3 text-blue-500 mt-0.5 group-hover:scale-110 transition-transform"/>
                            <div>
                                <span className="font-bold block text-sm">Biểu mẫu & Thủ tục hành chính</span>
                                <span className="text-xs text-gray-500">Tải đơn từ, biểu mẫu đăng ký đề tài</span>
                            </div>
                        </a>
                    </li>
                </ul>
                
                <a href="https://hcmue.edu.vn/vi/" target="_blank" rel="noreferrer" className="w-full bg-white border border-blue-200 text-blue-700 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition flex items-center justify-center">
                    Xem chi tiết tại Website Trường <ExternalLink size={14} className="ml-2"/>
                </a>
            </div>

            {/* Cột 2: Bổ sung Kiến thức */}
            <div className="bg-green-50 p-8 rounded-2xl border border-green-100 flex flex-col h-full">
                <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4"><BookOpen className="text-green-600" /></div>
                    <h3 className="font-bold text-xl text-green-900">Bổ sung Kiến thức</h3>
                </div>
                
                <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                        Dành cho ứng viên tốt nghiệp <strong>ngành gần</strong> hoặc <strong>ngành khác</strong> so với chuyên ngành dự thi. 
                        Hệ thống sẽ tự động đề xuất các môn học cần bổ sung dựa trên bằng cấp của bạn.
                    </p>
                    <div className="bg-white/60 p-3 rounded-lg border border-green-200 mb-4">
                        <p className="text-xs text-green-800 font-medium mb-1">Các bước thực hiện:</p>
                        <ol className="list-decimal ml-4 text-xs text-gray-600 space-y-1">
                            <li>Xem danh mục ngành gần/khác.</li>
                            <li>Đăng ký xét duyệt môn học bổ sung.</li>
                            <li>Nhận thông báo và đóng học phí.</li>
                        </ol>
                    </div>
                </div>

                <a href="https://hcmue.edu.vn/vi/tuyen-sinh/sau-dai-hoc/chuong-trinh-bo-sung-kien-thuc" target="_blank" rel="noreferrer" className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition flex items-center justify-center shadow-green-200 shadow-sm">
                    Xem Thông báo & Danh mục Ngành <ArrowRight size={16} className="ml-2"/>
                </a>
            </div>
        </div>

        <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-gray-800">Câu hỏi thường gặp</h3>
            <a href="https://tuyensinhsdh-hcmue.netlify.app/" target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                Xem tất cả câu hỏi <ExternalLink size={14} className="ml-1"/>
            </a>
        </div>
        <div className="space-y-4">
             {ADMISSION_FAQ.map((f, i) => (
                 <div key={i} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition group">
                     <h4 className="font-bold text-blue-800 flex items-center group-hover:text-blue-600 transition"><MessageSquare size={16} className="mr-2"/> {f.q}</h4>
                     <p className="text-gray-600 mt-2 ml-6 text-sm">{f.a}</p>
                 </div>
             ))}
        </div>
    </div>
);