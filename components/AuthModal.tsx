
import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Clock, Check, AlertCircle } from 'lucide-react';
import { User } from '../types';

// HƯỚNG DẪN: Thay thế URL bên dưới bằng link Web App bạn deploy từ Google Apps Script mới
const GOOGLE_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbwyDhpj6MNMkE94akevQCKM6EnwATahQBfm11KGm-2yn5FBp0pYYJqn3Ywt1pLGVQR22w/exec"; 

// Chế độ Mock sẽ tự động tắt nếu bạn điền URL thật (khác chuỗi mẫu)
const IS_MOCK_MODE = GOOGLE_SCRIPT_URL.includes("XXXXX") || GOOGLE_SCRIPT_URL === "";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone);

// CHECK PASSWORD STRENGTH
export const checkStrength = (pass: string) => {
  return {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[!@#$%^&*(),.?":{}|<>_+\-=]/.test(pass),
  };
};

// Hàm giả lập delay mạng (chỉ dùng khi Mock)
const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- COMPONENTS TÁCH RA NGOÀI (EXPORTED) ---

interface InputFieldProps {
  label?: string;
  name: string;
  type?: string;
  refObj?: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
  onBlur?: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  showEye?: boolean;
  onToggleEye?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const InputField = ({ label, name, type = "text", refObj, placeholder, onBlur, value, onChange, error, showEye, onToggleEye, onKeyDown }: InputFieldProps) => (
  <div className="mb-4 text-left w-full">
    {label && <label className="block text-sm font-bold mb-2 text-gray-700">{label}</label>}
    <div className="relative">
      <input
        ref={refObj}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`w-full border p-3.5 rounded-xl focus:ring-4 outline-none transition-all text-base ${error ? 'border-red-500 ring-red-100 bg-red-50' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-400'}`}
        placeholder={placeholder}
      />
      {showEye !== undefined && (
        <button tabIndex={-1} onClick={onToggleEye} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
          {showEye ? <EyeOff size={20}/> : <Eye size={20}/>}
        </button>
      )}
    </div>
    {error && (
      <div className="flex items-center text-red-500 text-sm mt-1.5 animate-fade-in pl-1">
         <AlertCircle size={14} className="mr-1.5" /> {error}
      </div>
    )}
  </div>
);

export const PasswordRequirements = ({ passStrength }: { passStrength: any }) => (
  <div className="mt-2 mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm text-left shadow-sm">
    <p className="font-bold text-gray-800 mb-3">Mật khẩu cần có:</p>
    <ul className="space-y-2 text-sm text-gray-600">
      <li className={`flex items-center ${passStrength.length ? 'text-green-600 font-bold' : ''}`}>
         <Check size={16} className={`mr-2 ${passStrength.length ? 'text-green-600' : 'text-gray-300'}`}/> Ít nhất 8 ký tự
      </li>
      <li className={`flex items-center ${passStrength.upper ? 'text-green-600 font-bold' : ''}`}>
         <Check size={16} className={`mr-2 ${passStrength.upper ? 'text-green-600' : 'text-gray-300'}`}/> 1 Chữ in hoa
      </li>
      <li className={`flex items-center ${passStrength.lower ? 'text-green-600 font-bold' : ''}`}>
         <Check size={16} className={`mr-2 ${passStrength.lower ? 'text-green-600' : 'text-gray-300'}`}/> 1 Chữ thường
      </li>
      <li className={`flex items-center ${passStrength.number ? 'text-green-600 font-bold' : ''}`}>
         <Check size={16} className={`mr-2 ${passStrength.number ? 'text-green-600' : 'text-gray-300'}`}/> 1 Số
      </li>
      <li className={`flex items-center ${passStrength.special ? 'text-green-600 font-bold' : ''}`}>
         <Check size={16} className={`mr-2 ${passStrength.special ? 'text-green-600' : 'text-gray-300'}`}/> 1 Ký tự đặc biệt
      </li>
    </ul>
  </div>
);

// --- MAIN COMPONENT ---

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', password: '', confirmPass: '' 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Visibility states
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [otpTimer, setOtpTimer] = useState(600);
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for auto-focus
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const confirmPassRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setMode('login'); 
      setErrors({});
      setFormData({ name: '', email: '', phone: '', password: '', confirmPass: '' });
      setShowPass(false);
      setShowConfirmPass(false);
      setIsLoading(false);
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (mode === 'forgot' && step === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, step, otpTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. CHUẨN HÓA TÊN
  const handleNameBlur = () => {
    if (!formData.name) return;
    const normalized = formData.name
      .trim()
      .replace(/\s+/g, ' ') // Thay thế nhiều khoảng trắng thành 1
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setFormData(prev => ({ ...prev, name: normalized }));
  };

  const passStrength = checkStrength(formData.password);

  // Hàm xử lý phím Enter để chuyển focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement | null> | null, submitAction: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else {
        submitAction();
      }
    }
  };

  // Hàm gọi API Google Apps Script
  const callGoogleScript = async (action: string, data: any) => {
    if (IS_MOCK_MODE) {
       console.warn("Đang chạy chế độ Mock vì chưa cấu hình URL thật.");
       await mockDelay(1000);
       if (action === 'login') {
         if (data.email === 'error@test.com') throw new Error("Email không tồn tại");
         const role = data.email.includes("banglv") ? "admin" : "user";
         return { success: true, user: { name: "User Demo", email: data.email, role } };
       }
       if (action === 'register') return { success: true, message: "Đăng ký thành công (Mock)" };
       if (action === 'requestOtp') return { success: true, otp: "123456" };
       if (action === 'verifyOtp') {
          if (data.otp === "123456") return { success: true };
          return { success: false, message: "OTP sai" };
       }
       if (action === 'resetPass') return { success: true };
       return { success: false };
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...data })
      });
      const result = await response.json();
      
      if (!result.success) {
        let msg = result.message || "Có lỗi xảy ra (Server không phản hồi chi tiết).";
        // Bắt lỗi permission gửi mail phổ biến
        if (msg.includes("script.send_mail") || msg.includes("MailApp")) {
           msg = "Lỗi Server (Permission): Admin cần vào Script Editor cấp quyền gửi Email và Deploy lại.";
        }
        // Bắt lỗi rỗng message (thường do action không khớp)
        if (!result.message && Object.keys(result).length === 0) {
            msg = `Lỗi Server: Action '${action}' không được xử lý trong Google Script hiện tại. Vui lòng copy đoạn mã Full Backend bên dưới và Deploy lại.`;
        }
        throw new Error(msg);
      }
      return result;
    } catch (error: any) {
      console.error("API Error:", error);
      throw new Error(error.message || "Lỗi kết nối Server.");
    }
  };

  // Validate Helper & Auto Focus
  const validateAndFocus = (fields: {name?: string, value: string, ref: React.RefObject<HTMLInputElement | null>, type?: 'email'|'phone'|'pass'|'confirm'}[]): boolean => {
    const newErrors: Record<string, string> = {};
    let firstErrorRef: React.RefObject<HTMLInputElement | null> | null = null;

    for (const f of fields) {
      if (!f.value.trim()) {
        newErrors[f.name || ''] = `Vui lòng nhập ${f.name === 'confirmPass' ? 'lại mật khẩu' : f.name === 'password' ? 'mật khẩu' : f.name === 'name' ? 'Họ và tên' : f.name}`;
        if (!firstErrorRef) firstErrorRef = f.ref;
        continue;
      }
      
      if (f.type === 'email' && !validateEmail(f.value)) {
        newErrors[f.name || ''] = "Email không đúng định dạng";
        if (!firstErrorRef) firstErrorRef = f.ref;
      }
      if (f.type === 'phone' && !validatePhone(f.value)) {
        newErrors[f.name || ''] = "Số điện thoại phải có 10 chữ số";
        if (!firstErrorRef) firstErrorRef = f.ref;
      }
      if (f.type === 'pass') {
        const s = checkStrength(f.value);
        if (!s.length || !s.upper || !s.lower || !s.number || !s.special) {
           newErrors[f.name || ''] = "Mật khẩu chưa đủ mạnh (xem yêu cầu bên dưới)";
           if (!firstErrorRef) firstErrorRef = f.ref;
        }
      }
      if (f.type === 'confirm' && f.value !== formData.password) {
        newErrors[f.name || ''] = "Mật khẩu nhập lại không khớp";
        if (!firstErrorRef) firstErrorRef = f.ref;
      }
    }

    setErrors(newErrors);
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
      return false;
    }
    return true;
  };

  // Đăng ký
  const handleRegister = async () => {
    const isValid = validateAndFocus([
      { name: 'name', value: formData.name, ref: nameRef },
      { name: 'email', value: formData.email, ref: emailRef, type: 'email' },
      { name: 'phone', value: formData.phone, ref: phoneRef, type: 'phone' },
      { name: 'password', value: formData.password, ref: passRef, type: 'pass' },
      { name: 'confirmPass', value: formData.confirmPass, ref: confirmPassRef, type: 'confirm' }
    ]);

    if (!isValid) return;

    setIsLoading(true);
    try {
      await callGoogleScript('register', {
        name: formData.name,
        email: formData.email.trim(),
        phone: "'" + formData.phone.trim(), // Thêm dấu ' để Google Sheet hiểu là chuỗi, không xóa số 0 ở đầu
        password: formData.password
      });
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      setMode("login");
    } catch (err: any) {
      setErrors({ server: err.message }); // Lỗi chung từ server
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập
  const handleLogin = async () => {
    // Validate cơ bản cho login
    const newErrors: Record<string, string> = {};
    let errorRef = null;

    if (!formData.email) {
      newErrors.email = "Vui lòng nhập Email";
      errorRef = emailRef;
    } 
    if (!formData.password) {
      newErrors.password = "Vui lòng nhập Mật khẩu";
      if (!errorRef) errorRef = passRef;
    }

    setErrors(newErrors);
    if (errorRef?.current) {
      errorRef.current.focus();
      return;
    }

    setIsLoading(true);
    try {
      const res = await callGoogleScript('login', {
        email: formData.email.trim(),
        password: formData.password
      });

      if (res.success) {
        // Cập nhật lấy tên từ res.hovaten hoặc res.name nếu có
        let displayName = res.hovaten || res.name;
        
        // Nếu không có tên từ server, fallback tự tạo tên từ email
        if (!displayName) {
             const userPart = formData.email.split('@')[0];
             displayName = userPart.charAt(0).toUpperCase() + userPart.slice(1);
        }

        const userData: User = {
           name: displayName, 
           email: res.email,
           role: res.role === 'admin' ? 'admin' : res.role === 'sub-admin' ? 'sub-admin' : 'user',
           status: 'active',
           canEdit: res.canEdit // Lưu quyền Edit nếu có
        };
        onLogin(userData);
      } else {
        setErrors({ server: res.message || "Đăng nhập thất bại" });
      }
    } catch (err: any) {
       setErrors({ server: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Quên mật khẩu
  const handleForgotPass = async () => {
    setErrors({});
    
    // BƯỚC 1: GỬI OTP
    if (step === 1) {
      const isValid = validateAndFocus([{ name: 'email', value: formData.email, ref: emailRef, type: 'email' }]);
      if (!isValid) return;

      setIsLoading(true);
      try {
        await callGoogleScript('requestOtp', { email: formData.email.trim() });
        setStep(2);
        setOtpTimer(600);
        alert(`Mã OTP đã gửi đến ${formData.email}`);
      } catch (err: any) {
        setErrors({ email: err.message });
        emailRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    } 
    // BƯỚC 2: XÁC THỰC OTP
    else if (step === 2) {
      if (!otpInput) {
        setErrors({ otp: "Vui lòng nhập mã OTP" });
        otpRef.current?.focus();
        return;
      }
      setIsLoading(true);
      try {
        await callGoogleScript('verifyOtp', { email: formData.email.trim(), otp: Number(otpInput) });
        setStep(3);
      } catch (err: any) {
        setErrors({ otp: err.message });
        otpRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    } 
    // BƯỚC 3: ĐỔI PASS
    else if (step === 3) {
      const isValid = validateAndFocus([
        { name: 'password', value: formData.password, ref: passRef, type: 'pass' },
        { name: 'confirmPass', value: formData.confirmPass, ref: confirmPassRef, type: 'confirm' }
      ]);
      if (!isValid) return;

      setIsLoading(true);
      try {
        await callGoogleScript('resetPass', { email: formData.email.trim(), password: formData.password });
        alert("Đổi mật khẩu thành công! Hãy đăng nhập lại.");
        setMode("login");
        setStep(1);
      } catch (err: any) {
        setErrors({ server: err.message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#1e3a8a] text-white p-6 flex justify-between items-center shadow-lg">
          <h3 className="text-2xl font-extrabold tracking-wide">
            {mode === 'login' ? 'Đăng Nhập Hệ Thống' : mode === 'register' ? 'Đăng Ký Tài Khoản' : 'Quên Mật Khẩu'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-10 overflow-y-auto custom-scrollbar">
          {/* Mock Warning */}
          {IS_MOCK_MODE && (
            <div className="bg-yellow-50 text-yellow-800 text-sm p-3 mb-6 rounded-lg border border-yellow-200">
              <strong>Demo Mode:</strong> Chưa cấu hình URL Google Script.
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <div className="flex flex-col h-full justify-center">
              <div className="space-y-6">
                <InputField 
                  label="Email" 
                  name="email" 
                  refObj={emailRef} 
                  value={formData.email} 
                  onChange={(e: any)=>setFormData({...formData, email: e.target.value})} 
                  error={errors.email}
                  placeholder="example@email.com"
                  onKeyDown={(e) => handleKeyDown(e, passRef, handleLogin)}
                />
                <InputField 
                  label="Mật khẩu" 
                  name="password" 
                  type={showPass ? "text" : "password"}
                  refObj={passRef} 
                  value={formData.password} 
                  onChange={(e: any)=>setFormData({...formData, password: e.target.value})} 
                  error={errors.password}
                  placeholder="Nhập mật khẩu"
                  showEye={showPass}
                  onToggleEye={()=>setShowPass(!showPass)}
                  onKeyDown={(e) => handleKeyDown(e, null, handleLogin)}
                />
              </div>
              
              {errors.server && (
                <div className="mt-4 flex items-center text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="mr-2 flex-shrink-0" size={18}/>
                  <span className="text-sm font-medium">{errors.server}</span>
                </div>
              )}

              <button 
                onClick={handleLogin} 
                disabled={isLoading}
                className="w-full bg-blue-700 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-800 disabled:opacity-70 flex justify-center items-center mt-10 mb-6 shadow-xl shadow-blue-200 transition-all transform hover:-translate-y-0.5"
              >
                {isLoading ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Đăng Nhập Ngay'}
              </button>
              
              <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-gray-100 mt-2">
                <button onClick={() => setMode('forgot')} className="text-gray-500 hover:text-blue-600 hover:underline transition-colors">Quên mật khẩu?</button>
                <button onClick={() => setMode('register')} className="text-blue-700 hover:text-blue-800 hover:underline transition-colors">Đăng ký tài khoản mới</button>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <div className="space-y-4">
              <InputField 
                label="Họ và tên" 
                name="name" 
                refObj={nameRef}
                value={formData.name} 
                onChange={(e: any)=>setFormData({...formData, name: e.target.value})} 
                onBlur={handleNameBlur}
                error={errors.name}
                placeholder="Nguyễn Văn A"
                onKeyDown={(e) => handleKeyDown(e, emailRef, handleRegister)}
              />
              <InputField 
                label="Email" 
                name="email" 
                refObj={emailRef}
                value={formData.email} 
                onChange={(e: any)=>setFormData({...formData, email: e.target.value})} 
                error={errors.email}
                placeholder="email@example.com"
                onKeyDown={(e) => handleKeyDown(e, phoneRef, handleRegister)}
              />
              <InputField 
                label="Số điện thoại" 
                name="phone" 
                refObj={phoneRef}
                value={formData.phone} 
                onChange={(e: any)=>setFormData({...formData, phone: e.target.value})} 
                error={errors.phone}
                placeholder="0909xxxxxx"
                onKeyDown={(e) => handleKeyDown(e, passRef, handleRegister)}
              />
              <InputField 
                label="Mật khẩu" 
                name="password" 
                type={showPass ? "text" : "password"}
                refObj={passRef}
                value={formData.password} 
                onChange={(e: any)=>setFormData({...formData, password: e.target.value})} 
                error={errors.password}
                placeholder="Mật khẩu"
                showEye={showPass}
                onToggleEye={()=>setShowPass(!showPass)}
                onKeyDown={(e) => handleKeyDown(e, confirmPassRef, handleRegister)}
              />
              
              {/* Password Checklist */}
              {(formData.password || errors.password) && <PasswordRequirements passStrength={passStrength} />}

              <InputField 
                label="Nhập lại mật khẩu" 
                name="confirmPass" 
                type={showConfirmPass ? "text" : "password"}
                refObj={confirmPassRef}
                value={formData.confirmPass} 
                onChange={(e: any)=>setFormData({...formData, confirmPass: e.target.value})} 
                error={errors.confirmPass}
                placeholder="Nhập lại mật khẩu"
                showEye={showConfirmPass}
                onToggleEye={()=>setShowConfirmPass(!showConfirmPass)}
                onKeyDown={(e) => handleKeyDown(e, null, handleRegister)}
              />

              {errors.server && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mb-2 font-medium">{errors.server}</p>}

              <button 
                onClick={handleRegister} 
                disabled={isLoading}
                className="w-full bg-blue-700 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-800 mt-8 disabled:opacity-70 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng Ký'}
              </button>
              <button onClick={() => setMode('login')} className="w-full text-gray-500 text-sm py-3 hover:text-blue-600 hover:underline mt-2">
                Quay lại đăng nhập
              </button>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div className="space-y-6">
              {step === 1 && (
                <>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                    Nhập email đã đăng ký để nhận mã OTP xác thực.
                  </div>
                  <InputField 
                    label="Email của bạn"
                    name="email" 
                    refObj={emailRef}
                    value={formData.email} 
                    onChange={(e: any)=>setFormData({...formData, email: e.target.value})} 
                    error={errors.email}
                    placeholder="email@example.com"
                    onKeyDown={(e) => handleKeyDown(e, null, handleForgotPass)}
                  />
                  <button onClick={handleForgotPass} disabled={isLoading} className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-800 mt-4 shadow-lg">
                    {isLoading ? 'Đang gửi...' : 'Gửi Mã OTP'}
                  </button>
                </>
              )}
              {step === 2 && (
                <>
                  <p className="text-sm text-gray-600 text-center mb-2">Nhập mã OTP vừa được gửi đến <b>{formData.email}</b>.</p>
                  <div className="relative mb-6">
                     <input
                      ref={otpRef}
                      type="text"
                      value={otpInput}
                      onChange={e=>setOtpInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, null, handleForgotPass)}
                      className={`w-full border-2 p-3 rounded-xl text-center text-3xl tracking-[0.5em] font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all ${errors.otp ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      placeholder="••••••"
                      maxLength={6}
                    />
                    {errors.otp && <p className="text-red-500 text-xs mt-2 text-center font-bold">{errors.otp}</p>}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm mb-6 px-2">
                    <span className="text-red-500 font-mono font-bold flex items-center"><Clock size={16} className="mr-1"/> {formatTime(otpTimer)}</span>
                    <button onClick={() => { setStep(1); }} className="text-blue-600 font-bold hover:underline">Gửi lại mã?</button>
                  </div>
                  <button onClick={handleForgotPass} disabled={isLoading} className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-800 shadow-lg">
                    {isLoading ? 'Đang kiểm tra...' : 'Xác thực OTP'}
                  </button>
                </>
              )}
              {step === 3 && (
                <>
                   <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-800 text-sm mb-4">
                      OTP chính xác! Mời bạn thiết lập mật khẩu mới.
                   </div>
                   <InputField 
                    label="Mật khẩu mới"
                    name="password" 
                    type={showPass ? "text" : "password"}
                    refObj={passRef}
                    value={formData.password} 
                    onChange={(e: any)=>setFormData({...formData, password: e.target.value})} 
                    error={errors.password}
                    showEye={showPass}
                    onToggleEye={()=>setShowPass(!showPass)}
                    onKeyDown={(e) => handleKeyDown(e, confirmPassRef, handleForgotPass)}
                  />
                   {(formData.password || errors.password) && <PasswordRequirements passStrength={passStrength} />}

                   <InputField 
                    label="Nhập lại mật khẩu"
                    name="confirmPass" 
                    type={showConfirmPass ? "text" : "password"}
                    refObj={confirmPassRef}
                    value={formData.confirmPass} 
                    onChange={(e: any)=>setFormData({...formData, confirmPass: e.target.value})} 
                    error={errors.confirmPass}
                    showEye={showConfirmPass}
                    onToggleEye={()=>setShowConfirmPass(!showConfirmPass)}
                    onKeyDown={(e) => handleKeyDown(e, null, handleForgotPass)}
                  />
                   
                   <button onClick={handleForgotPass} disabled={isLoading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 mt-4 shadow-lg">
                     {isLoading ? 'Đang đổi...' : 'Đổi Mật Khẩu & Đăng Nhập'}
                   </button>
                </>
              )}
              <button onClick={() => {setMode('login'); setStep(1);}} className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 hover:underline mt-4">
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

