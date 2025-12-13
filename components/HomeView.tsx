import React from 'react';
import { TabProps, User } from '../types';
import { Cpu, Monitor, FileText, Database, PenTool, GraduationCap, Clock, ArrowRight, Calendar, Bell, ExternalLink } from 'lucide-react';

interface HomeViewProps extends Pick<TabProps, 'setActiveTab'> {
    user: User;
    thesisCount: number;
    paperCount: number;
    cachedStudentId: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab, user, thesisCount, paperCount, cachedStudentId }) => (
  <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
    {/* Welcome Banner */}
    <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-left">
                <h1 className="text-3xl font-extrabold mb-2">
                    Xin chào, <span className="text-yellow-300">{user.name}</span>! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                    Chúc bạn một ngày nghiên cứu hiệu quả và đầy cảm hứng.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    {(thesisCount > 0 || paperCount > 0) ? (
                        <button 
                            onClick={() => setActiveTab('thesis')} 
                            className="bg-white text-blue-900 px-6 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-blue-50 transition flex items-center"
                        >
                            <FileText size={18} className="mr-2"/> Tiếp tục Dự án gần nhất <ArrowRight size={16} className="ml-2"/>
                        </button>
                    ) : (
                        <button 
                            onClick={() => setActiveTab('thesis')} 
                            className="bg-green-500 text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-green-600 transition flex items-center"
                        >
                            <FileText size={18} className="mr-2"/> Bắt đầu Dự án mới
                        </button>
                    )}
                </div>
            </div>
            
            {/* Quick Stats Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl min-w-[280px]">
                <h3 className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-3">Tổng quan hoạt động</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm"><FileText size={16} className="mr-2"/> Dự án luận văn</span>
                        <span className="font-bold text-white bg-blue-600/50 px-2 py-0.5 rounded">{thesisCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm"><PenTool size={16} className="mr-2"/> Bài báo khoa học</span>
                        <span className="font-bold text-white bg-green-600/50 px-2 py-0.5 rounded">{paperCount}</span>
                    </div>
                    {cachedStudentId && (
                        <div className="pt-2 border-t border-white/10 text-xs text-blue-200 flex items-center">
                            <Clock size={12} className="mr-1"/> Phiên làm việc: {cachedStudentId}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
    
    {/* Feature Cards Grid */}
    <div>
        <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
          <Cpu className="mr-2 text-blue-600" /> Truy cập nhanh Công cụ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Research Paper */}
            <div 
                onClick={() => setActiveTab('research')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group"
            >
                <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                    <PenTool className="text-green-600 group-hover:text-white transition-colors" size={24}/>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Viết Bài Báo (NCKH)</h3>
                <p className="text-gray-500 text-sm">
                    Từ ý tưởng đến bài báo chuẩn IMRaD. Hỗ trợ trích dẫn tự động và chuyển đổi luận văn thành bài báo.
                </p>
            </div>

            {/* Training */}
            <div 
                onClick={() => setActiveTab('training')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
            >
                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                    <GraduationCap className="text-blue-600 group-hover:text-white transition-colors" size={24}/>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Đào tạo & Hồ sơ</h3>
                <p className="text-gray-500 text-sm">
                    Nộp hồ sơ bổ sung kiến thức, xem lịch bảo vệ và chương trình đào tạo mới nhất.
                </p>
            </div>

            {/* Thesis Projects (Renamed from Xây dựng Luận văn) */}
            <div 
                onClick={() => setActiveTab('thesis')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer group"
            >
                <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                    <FileText className="text-purple-600 group-hover:text-white transition-colors" size={24}/>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Dự án Học thuật</h3>
                <p className="text-gray-500 text-sm">
                    Trợ lý AI cho Luận văn, Đề án & Tiểu luận. Lập dàn ý, thẩm định logic và viết nội dung chuyên sâu.
                </p>
            </div>

            {/* Topic Check */}
            <div 
                onClick={() => setActiveTab('check')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer group"
            >
                <div className="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors">
                    <Database className="text-orange-600 group-hover:text-white transition-colors" size={24}/>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Tra cứu Đề tài</h3>
                <p className="text-gray-500 text-sm">
                    Kiểm tra trùng lặp tên đề tài nghiên cứu với cơ sở dữ liệu đã bảo vệ của Nhà trường.
                </p>
            </div>
        </div>
    </div>

    {/* News & Events Section - UPDATED CONTENT & LINKS */}
    <div className="pt-6 border-t border-gray-200">
        <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
          <Bell className="mr-2 text-red-600" /> Tin tức & Thông báo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Card 1: Thông báo Bảo vệ Luận văn */}
             <a href="https://hcmue.edu.vn/vi/dao-tao/sau-dai-hoc/cao-hoc/luan-van" target="_blank" rel="noreferrer" className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition cursor-pointer group block">
                 <div className="flex justify-between items-start mb-2">
                     <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Thông báo</span>
                     <span className="text-gray-400 text-xs flex items-center"><Calendar size={12} className="mr-1"/> Mới nhất</span>
                 </div>
                 <h4 className="font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition">Thông báo Bảo vệ Luận văn & Tốt nghiệp</h4>
                 <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    Cập nhật lịch bảo vệ luận văn thạc sĩ, đề án tốt nghiệp và các biểu mẫu quy trình tốt nghiệp mới nhất.
                 </p>
                 <div className="text-xs text-blue-600 font-bold flex items-center">Xem chi tiết <ExternalLink size={10} className="ml-1"/></div>
             </a>

             {/* Card 2: Tin tức Hoạt động & Sự kiện */}
             <a href="https://hcmue.edu.vn/vi/" target="_blank" rel="noreferrer" className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition cursor-pointer group block">
                 <div className="flex justify-between items-start mb-2">
                     <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Tin tức</span>
                     <span className="text-gray-400 text-xs flex items-center"><Calendar size={12} className="mr-1"/> Mới nhất</span>
                 </div>
                 <h4 className="font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition">Tin tức Hoạt động & Sự kiện</h4>
                 <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    Tổng hợp tin tức nổi bật, sự kiện giáo dục và các hoạt động nghiên cứu khoa học tiêu biểu của Nhà trường.
                 </p>
                 <div className="text-xs text-blue-600 font-bold flex items-center">Xem trang chủ <ExternalLink size={10} className="ml-1"/></div>
             </a>
        </div>
    </div>
  </div>
);