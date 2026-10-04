import React, { useState } from 'react';
import { ShieldAlert, Lock, X, Mail, Check, AlertCircle } from 'lucide-react';
import { ADMIN_EMAIL } from '../types';

interface AiAccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  currentRole?: string;
}

export const AiAccessDeniedModal: React.FC<AiAccessDeniedModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  currentRole
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-red-100 max-w-lg w-full overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with decorative background */}
        <div className="bg-gradient-to-br from-red-600 via-red-500 to-rose-600 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Đóng"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <ShieldAlert size={32} className="text-white drop-shadow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-1 border border-white/20">
                <Lock size={12} /> Giới hạn quyền truy cập
              </div>
              <h3 className="text-xl font-bold tracking-tight">Quyền Quản Trị Viên (Admin)</h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm leading-relaxed flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950 mb-1">
                Tính năng yêu cầu quyền Quản trị viên hoặc Cán bộ được cấp phép!
              </p>
              <p className="text-amber-800 text-xs sm:text-sm">
                Công cụ <strong>Kiểm tra AI & Đối chiếu Đạo văn</strong> yêu cầu hạn ngạch quét chuyên sâu và được quy định bảo mật. 
                Hiện tại, tính năng chỉ mở cho tài khoản Quản trị viên toàn quyền:
              </p>
              <div className="mt-2 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-300 font-mono font-bold text-red-600 text-sm">
                {ADMIN_EMAIL}
              </div>
              <span className="block mt-1 text-xs text-amber-700">hoặc các Cán bộ (Sub-admin) được Thầy Quản trị tích chọn <strong>"Cấp quyền AI"</strong> trong tab Quản trị.</span>
            </div>
          </div>

          {/* Current User Info */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-gray-600">
              <span>Tài khoản đang đăng nhập:</span>
              <span className="font-semibold text-gray-800 font-mono truncate max-w-[220px]">
                {currentUserEmail || 'Chưa xác định'}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Phân quyền tài khoản:</span>
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium text-xs">
                {currentRole === 'admin' ? 'Quản trị viên' : currentRole === 'sub-admin' ? 'Phó ban' : 'Học viên / Độc giả'}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 pt-1 border-t border-gray-200">
              <span>Trạng thái sử dụng tab AI:</span>
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <Lock size={13} /> Bị giới hạn
              </span>
            </div>
          </div>

          {/* Contact Admin Box */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-blue-900">
              <Mail size={18} className="text-blue-600 flex-shrink-0" />
              <div>
                <span className="font-semibold block">Cần kiểm tra văn bản hoặc cấp quyền?</span>
                <span className="text-blue-700 text-xs">Vui lòng liên hệ Thầy Quản trị: {ADMIN_EMAIL}</span>
              </div>
            </div>
            <button
              onClick={handleCopyEmail}
              className="px-2.5 py-1.5 bg-white text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1 shadow-sm flex-shrink-0"
              title="Sao chép email"
            >
              {copied ? <Check size={13} className="text-green-600" /> : null}
              {copied ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=Yêu cầu cấp quyền sử dụng tính năng Kiểm tra AI`}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-semibold transition-colors"
          >
            Gửi email yêu cầu
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-200 transition-all"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
