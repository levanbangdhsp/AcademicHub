import React, { useState, useRef, useEffect } from 'react';
import { AdmissionView } from './AdmissionView';
import { Upload, CheckCircle, Book, RefreshCw, Send, AlertTriangle, User, ArrowLeft, Printer, FileText, ArrowRight, Download, GraduationCap, Briefcase } from 'lucide-react';

// URL API Google Script (Sử dụng chung URL với các module khác)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyDhpj6MNMkE94akevQCKM6EnwATahQBfm11KGm-2yn5FBp0pYYJqn3Ywt1pLGVQR22w/exec";

// --- DỮ LIỆU CỐ ĐỊNH (HARDCODED DATA) ---

// 1. Danh sách 34 Tỉnh thành (Theo yêu cầu hình ảnh)
const PROVINCES = [
  "Hà Nội", "Huế", "Lai Châu", "Điện Biên", "Sơn La", "Lạng Sơn", 
  "Quảng Ninh", "Thanh Hoá", "Nghệ An", "Hà Tĩnh", "Cao Bằng", "Tuyên Quang", 
  "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên", "Hải Phòng", 
  "Ninh Bình", "Quảng Trị", "Đà Nẵng", "Quảng Ngãi", "Gia Lai", "Khánh Hoà", 
  "Lâm Đồng", "Đắk Lắk", "Tp.HCM", "Đồng Nai", "Tây Ninh", "Cần Thơ", 
  "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang"
];

// 2. Danh sách Dân tộc
const ETHNICITIES = [
  "Kinh", "Tày", "Thái", "Mường", "Khơ Mú", "Dao", "H'Mông", "Khmer", "Nùng", "Hoa", "Gia Rai", "Ê Đê", "Ba Na", "Xơ Đăng", "Sán Chay", "Cơ Ho", "Chăm", "Sán Dìu", "Hrê", "Ra Glai", "Mnông", "Stiêng", "Khác..."
];

// 3. Danh sách Quốc tịch
const NATIONALITIES = [
  "Việt Nam", "Lào", "Campuchia", "Trung Quốc", "Nhật Bản", "Hàn Quốc", "Khác..."
];

// 4. Mapping Ngành Đăng ký -> Ngành Tốt nghiệp phù hợp (Dữ liệu OCR)
const ADMISSION_MAPPING = [
  {
    code: "TOAN",
    name: "Lý luận và phương pháp dạy học bộ môn Toán",
    allowed: ["Toán cơ", "Toán ứng dụng", "Thống kê", "Toán Tin"]
  },
  {
    code: "VATL",
    name: "Lý luận và phương pháp dạy học bộ môn Vật lý",
    allowed: ["Vật lý học", "Sư phạm Khoa học tự nhiên", "Sư phạm Kỹ thuật Công nghiệp", "Vật lý nguyên tử và hạt nhân", "Vật lý kỹ thuật", "Kỹ thuật hạt nhân", "Sư phạm Công nghệ"]
  },
  {
    code: "PPHH",
    name: "Lý luận và phương pháp dạy học bộ môn Hóa học",
    allowed: ["Hóa học", "Sư phạm Khoa học tự nhiên"]
  },
  {
    code: "LPTQ",
    name: "Lý luận và phương pháp dạy học bộ môn Ngữ văn",
    allowed: ["Văn học", "Việt Nam học", "Ngôn ngữ học", "Báo chí"]
  },
  {
    code: "GDMN",
    name: "Giáo dục học (Giáo dục mầm non)",
    allowed: ["Giáo dục học", "Quản lý giáo dục", "Giáo dục tiểu học", "Giáo dục đặc biệt", "Giáo dục thể chất", "Sư phạm Ngữ văn", "Sư phạm Toán", "Sư phạm âm nhạc", "Sư phạm mỹ thuật", "Sư phạm tiếng Anh", "Xã hội học", "Tâm lý học", "Tâm lý học giáo dục", "Luật", "Công tác xã hội"]
  },
  {
    code: "GDTH",
    name: "Giáo dục học (Giáo dục tiểu học)",
    allowed: ["Sư phạm Ngữ văn", "Tiếng Việt và văn hóa Việt Nam", "Sư phạm Toán học", "Sư phạm tiếng Anh", "Giáo dục mầm non", "Quản lý giáo dục", "Giáo dục học", "Tâm lý học giáo dục"]
  },
  {
    code: "GDTC",
    name: "Giáo dục học (Giáo dục thể chất)",
    allowed: ["Y sinh học Thể dục thể thao", "Huấn luyện Thể dục thể thao", "Quản lý Thể dục thể thao"]
  },
  {
    code: "GDCT",
    name: "Giáo dục học (Giáo dục chính trị)",
    allowed: ["Triết học", "Kinh tế chính trị", "Chủ nghĩa xã hội khoa học", "Tư tưởng Hồ Chí Minh", "Hồ Chí Minh học", "Lịch sử Đảng Cộng sản Việt Nam", "Chính trị học", "Xây dựng Đảng và chính quyền nhà nước", "Báo chí", "Giáo dục kinh tế", "Giáo dục pháp luật", "Giáo dục An ninh - Quốc phòng", "Lịch sử - Giáo dục công dân"]
  },
  {
    code: "VLNT",
    name: "Vật lý nguyên tử và hạt nhân",
    allowed: ["Khoa học vật liệu", "Công nghệ vật liệu", "Kỹ thuật vật liệu", "Vật lý kỹ thuật", "Kỹ thuật hình ảnh y học", "Sư phạm công nghệ", "Sư phạm Khoa học tự nhiên"]
  },
  {
    code: "HOVC",
    name: "Hóa hữu cơ / Hóa vô cơ",
    allowed: ["Khoa học môi trường", "Kỹ thuật môi trường", "Sư phạm Khoa học tự nhiên", "Hóa học"]
  },
  {
    code: "STHO",
    name: "Sinh thái học",
    allowed: ["Sư phạm Khoa học tự nhiên", "Công nghệ Sinh học", "Kỹ thuật sinh học", "Sinh học ứng dụng", "Nông nghiệp", "Sư phạm Kỹ thuật nông nghiệp"]
  },
  {
    code: "TALI",
    name: "Tâm lý học",
    allowed: ["Kinh tế", "Kinh tế chính trị", "Kinh tế đầu tư", "Kinh tế phát triển", "Kinh tế quốc tế", "Thống kê kinh tế", "Toán kinh tế", "Chính trị học", "Xây dựng đảng và chính quyền nhà nước", "Quản lý nhà nước", "Quan hệ quốc tế", "Nhân học", "Địa lý học", "Quốc tế học", "Châu Á học", "Thái Bình Dương học", "Đông Phương học", "Trung Quốc học", "Nhật Bản học", "Hàn Quốc học", "Đông Nam Á học", "Việt Nam học", "Giáo dục học", "Quản lý giáo dục", "Giáo dục Mầm non", "Giáo dục tiểu học", "Xã hội học", "Công tác xã hội", "Giáo dục đặc biệt"]
  },
  {
    code: "KHMT",
    name: "Khoa học máy tính",
    allowed: ["Công nghệ kỹ thuật điều khiển và tự động hóa", "Khoa học tính toán", "Kỹ thuật điện", "Kỹ thuật điện tử - viễn thông", "Kỹ thuật y sinh", "Kỹ thuật cơ điện tử", "Toán học", "Toán tin", "Sư phạm Vật lý", "Vật lý học"]
  },
  {
    code: "VHVN",
    name: "Văn học Việt Nam",
    allowed: ["Việt Nam học", "Văn hoá học", "Báo chí - truyền thông"]
  },
  {
    code: "NNHO",
    name: "Ngôn ngữ học",
    allowed: ["Biên kịch điện ảnh, truyền hình", "Hán Nôm", "Các ngành thuộc nhóm Ngoại ngữ", "Việt Nam học", "Xuất bản", "Báo chí - Truyền thông"]
  }
];

interface AdmissionFormState {
  // A. Thông tin cá nhân
  fullName: string;
  dob: string; // yyyy-mm-dd
  pob: string;
  pobOther: string;
  gender: string;
  ethnicity: string;
  ethnicityOther: string;
  nationality: string;
  nationalityOther: string;
  email: string;
  phone: string;
  cccd: string;
  cccdDate: string; // yyyy-mm-dd
  
  // B. Thông tin đăng ký & Văn bằng
  registerMajorCode: string;
  graduatedMajor: string;
  graduatedMajorOther: string;
  graduatedSchool: string;
  gradYear: string;
  gradRank: string;
  trainingType: string;

  // C. Khác
  hasTranscript: boolean;
  requestExemption: boolean;
}

// Props mới: user (để tìm hồ sơ)
interface TrainingModuleProps {
    user?: any; // Nhận user từ App.tsx
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'upload' | 'curriculum'>('info');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>(""); 
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State cho tính năng "Cập nhật hồ sơ cũ"
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null); // ID hồ sơ cũ nếu có
  const [existingFileLink, setExistingFileLink] = useState<string | null>(null); // Link file cũ

  // Form State - SỬA LẠI: Để trống các trường mặc định
  const [form, setForm] = useState<AdmissionFormState>({
    fullName: '', dob: '', pob: '', pobOther: '', gender: '',
    ethnicity: '', ethnicityOther: '', nationality: '', nationalityOther: '',
    email: user?.email || '', 
    phone: '', cccd: '', cccdDate: '',
    registerMajorCode: '',
    graduatedMajor: '',
    graduatedMajorOther: '',
    graduatedSchool: '', gradYear: '', gradRank: '', trainingType: '',
    hasTranscript: true, requestExemption: false
  });

  // NEW: Check profile khi vào tab upload
  useEffect(() => {
      if (activeTab === 'upload' && user?.email) {
          checkExistingProfile(user.email);
      }
  }, [activeTab, user]);

  const checkExistingProfile = async (email: string) => {
      setIsCheckingProfile(true);
      try {
          const response = await fetch(GOOGLE_SCRIPT_URL, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({ action: 'checkProfile', email: email })
          });
          const result = await response.json();
          
          if (result.success && result.profile) {
              const p = result.profile;
              setExistingProfileId(p.id);
              setExistingFileLink(p.fileLink);
              setSubmissionId(p.id); 
              
              // Helper: Convert Date - FIX LỖI LỆCH NGÀY
              const convertDate = (d: string) => {
                  if (!d) return "";
                  
                  // Case 1: Vietnam Format (dd/mm/yyyy) - Từ Sheet trả về text
                  if (d.includes('/')) {
                      const parts = d.split('/');
                      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                  }

                  // Case 2: ISO String (yyyy-mm-dd...) - Từ Sheet trả về Date Object
                  // Dùng new Date để parse và lấy ngày theo giờ địa phương (tránh UTC)
                  const dateObj = new Date(d);
                  if (!isNaN(dateObj.getTime())) {
                      const year = dateObj.getFullYear();
                      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                  }
                  
                  // Fallback: cắt chuỗi nếu format chuẩn ISO
                  if (d.includes('-') && d.length >= 10) {
                      return d.substring(0, 10);
                  }

                  return "";
              };
              
              // Helper: Find Major Code by Name
              const foundMajor = ADMISSION_MAPPING.find(m => m.name === p.registerMajorName);
              const majorCode = foundMajor ? foundMajor.code : "";
              
              // Helper: Check if value is in list, if not set to Other
              const checkValue = (list: string[], val: string) => list.includes(val) ? val : "Khác...";
              const checkOther = (list: string[], val: string) => list.includes(val) ? "" : val;

              setForm({
                  fullName: p.fullName,
                  dob: convertDate(p.dob),
                  pob: checkValue(PROVINCES, p.pob),
                  pobOther: checkOther(PROVINCES, p.pob),
                  gender: p.gender,
                  ethnicity: checkValue(ETHNICITIES, p.ethnicity),
                  ethnicityOther: checkOther(ETHNICITIES, p.ethnicity),
                  nationality: checkValue(NATIONALITIES, p.nationality),
                  nationalityOther: checkOther(NATIONALITIES, p.nationality),
                  email: p.email,
                  phone: p.phone,
                  cccd: p.cccd,
                  cccdDate: convertDate(p.cccdDate),
                  registerMajorCode: majorCode,
                  graduatedMajor: p.graduatedMajor,
                  graduatedMajorOther: "",
                  graduatedSchool: p.graduatedSchool,
                  gradYear: p.gradYear,
                  gradRank: p.gradRank,
                  trainingType: p.trainingType,
                  hasTranscript: p.hasTranscript,
                  requestExemption: p.requestExemption
              });
          } else {
              setExistingProfileId(null); // Chưa có hồ sơ
          }
      } catch (e) {
          console.error("Check Profile Error:", e);
      } finally {
          setIsCheckingProfile(false);
      }
  };


  // Derived State for Dropdowns
  const selectedRegisterMajor = ADMISSION_MAPPING.find(m => m.code === form.registerMajorCode);
  const allowedGradMajors = selectedRegisterMajor ? [...selectedRegisterMajor.allowed, "Khác..."] : ["Khác..."];
  const isGradMajorWarning = form.graduatedMajor === "Khác...";

  // --- HANDLERS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
        });
    }

    // Reset dependent fields
    if (name === 'registerMajorCode') {
       const newMajor = ADMISSION_MAPPING.find(m => m.code === value);
       const firstAllowed = newMajor ? newMajor.allowed[0] : "Khác...";
       setForm(prev => ({ ...prev, registerMajorCode: value, graduatedMajor: firstAllowed, graduatedMajorOther: '' }));
    }
  };

  const handleNameBlur = () => {
      if (!form.fullName) return;
      // Chuẩn hóa: In hoa, cắt khoảng trắng thừa, 1 khoảng trắng giữa các từ
      const normalized = form.fullName
          .trim()
          .replace(/\s+/g, ' ')
          .toUpperCase();
      setForm(prev => ({ ...prev, fullName: normalized }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if(errors.file) {
          setErrors(prev => {
              const newErrors = {...prev};
              delete newErrors.file;
              return newErrors;
          });
      }
    }
  };

  // Format date from yyyy-mm-dd to dd/mm/yyyy
  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const validateForm = () => {
      const newErrors: Record<string, string> = {};
      if (!form.fullName) newErrors.fullName = "Vui lòng nhập Họ và tên.";
      if (!form.dob) newErrors.dob = "Vui lòng chọn Ngày sinh.";
      if (!form.cccd) newErrors.cccd = "Vui lòng nhập số CCCD.";
      else if (form.cccd.length !== 12) newErrors.cccd = "Số CCCD phải đúng 12 chữ số.";
      
      if (!form.cccdDate) newErrors.cccdDate = "Vui lòng chọn Ngày cấp CCCD.";
      
      if (!form.email) newErrors.email = "Vui lòng nhập Email.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Email không đúng định dạng.";

      if (!form.phone) newErrors.phone = "Vui lòng nhập Số điện thoại.";
      else if (form.phone.length !== 10) newErrors.phone = "Số điện thoại phải đúng 10 chữ số.";

      if (!form.pob) newErrors.pob = "Vui lòng chọn Nơi sinh.";
      if (!form.gender) newErrors.gender = "Vui lòng chọn Giới tính.";
      if (!form.ethnicity) newErrors.ethnicity = "Vui lòng chọn Dân tộc.";
      if (!form.nationality) newErrors.nationality = "Vui lòng chọn Quốc tịch.";
      
      if (!form.registerMajorCode) newErrors.registerMajorCode = "Vui lòng chọn Ngành đăng ký.";
      
      if (!form.graduatedSchool) newErrors.graduatedSchool = "Vui lòng nhập Cơ sở cấp bằng.";
      if (!form.gradYear) newErrors.gradYear = "Vui lòng nhập Năm tốt nghiệp.";
      if (!form.gradRank) newErrors.gradRank = "Vui lòng chọn Xếp loại.";
      if (!form.trainingType) newErrors.trainingType = "Vui lòng chọn Hình thức đào tạo.";
      
      if (form.pob === "Khác..." && !form.pobOther) newErrors.pobOther = "Vui lòng nhập Nơi sinh.";
      if (form.ethnicity === "Khác..." && !form.ethnicityOther) newErrors.ethnicityOther = "Vui lòng nhập Dân tộc.";
      if (form.nationality === "Khác..." && !form.nationalityOther) newErrors.nationalityOther = "Vui lòng nhập Quốc tịch.";
      if (form.graduatedMajor === "Khác..." && !form.graduatedMajorOther) newErrors.graduatedMajorOther = "Vui lòng nhập Tên ngành.";

      // Nếu là Update thì không bắt buộc file (giữ file cũ)
      if (!existingProfileId && !file) newErrors.file = "Vui lòng đính kèm file hồ sơ.";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
        alert("Vui lòng kiểm tra lại thông tin (các ô màu đỏ).");
        return;
    }

    setIsSubmitting(true);

    const submitData = async (base64Content?: string) => {
        try {
            // Determine Action: Update or Create
            const action = existingProfileId ? 'updateAdmission' : 'submitAdmission';
            
            const payload = {
              action: action,
              id: existingProfileId, // Gửi ID nếu là update
              sheetName: 'HoSoBSKT',
              folderId: '1yHsgixYLp9zTGEAX5qJKq_zCwUypkt4l', 
              // File data chỉ gửi nếu có file mới
              fileData: base64Content ? {
                  name: `${form.registerMajorCode}_${form.fullName}.pdf`, 
                  mimeType: file!.type,
                  base64: base64Content
              } : undefined,
              data: {
                  // CỘT A -> T (Theo yêu cầu)
                  "ID": existingProfileId || "", 
                  "Họ và tên": form.fullName, 
                  "Ngày sinh": formatDateDisplay(form.dob), 
                  "Nơi sinh": form.pob === "Khác..." ? form.pobOther : form.pob, 
                  "Giới tính": form.gender, 
                  "Dân tộc": form.ethnicity === "Khác..." ? form.ethnicityOther : form.ethnicity, 
                  "Quốc tịch": form.nationality === "Khác..." ? form.nationalityOther : form.nationality, 
                  "Email": form.email, 
                  "Điện thoại": `'${form.phone}`, 
                  "CCCD": `'${form.cccd}`, 
                  "Ngày cấp CCCD": formatDateDisplay(form.cccdDate), 
                  "Ngành học": selectedRegisterMajor?.name || "", 
                  "Cơ sở cấp": form.graduatedSchool, 
                  "Ngành tốt nghiệp": form.graduatedMajor === "Khác..." ? form.graduatedMajorOther : form.graduatedMajor, 
                  "Năm tốt nghiệp": form.gradYear, 
                  "Xếp loại tốt nghiệp": form.gradRank, 
                  "Hình thức đào tạo": form.trainingType, 
                  "Thông tin về BĐ&CC&CN": form.hasTranscript ? "Có" : "Không", 
                  "Thông tin về miễn HP": form.requestExemption ? "Có" : "Không", 
                  "Link": existingFileLink || "" // Gửi lại link cũ nếu không có file mới
              }
            };
      
            const response = await fetch(GOOGLE_SCRIPT_URL, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(payload)
            });
      
            const result = await response.json();
            
            if (result.success) {
              setSubmitted(true);
              if (!existingProfileId) setSubmissionId(result.id);
            } else {
              alert("Lỗi: " + result.message);
            }
          } catch (error) {
            console.error(error);
            alert("Lỗi kết nối. Vui lòng thử lại sau.");
          } finally {
            setIsSubmitting(false);
          }
    };

    if (file) {
        // Convert file to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Content = (reader.result as string).split(',')[1];
            await submitData(base64Content);
        };
    } else {
        // Submit without file (Only for Update)
        await submitData();
    }
  };

  // --- HÀM TẠO FILE WORD BIÊN NHẬN (NEW) ---
  const handlePrintReceipt = () => {
      const today = new Date();
      const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

      // HTML Template for Word Doc
      const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
              <meta charset='utf-8'>
              <title>BienNhanHoSo</title>
              <style>
                  body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.3; }
                  .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
                  .title { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-top: 15px; margin-bottom: 10px; text-align: center;}
                  .subtitle { font-size: 12pt; font-style: italic; text-align: center; margin-bottom: 20px;}
                  .content { margin-left: 20px; margin-right: 20px; }
                  .footer { margin-top: 30px; text-align: right; font-style: italic;}
                  .signature { margin-top: 50px; text-align: right; font-weight: bold;}
                  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                  td { padding: 5px; vertical-align: top; }
              </style>
          </head>
          <body>
              <div class="header">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>
                  Độc lập - Tự do - Hạnh phúc<br/>
                  -------------------
              </div>

              <div class="title">GIẤY BIÊN NHẬN HỒ SƠ</div>
              <div class="subtitle">Chương trình Bổ sung Kiến thức Sau Đại học</div>
              
              <div class="content">
                  <p style="text-align: center;"><strong>Mã hồ sơ: ${submissionId}</strong></p>
                  <br/>
                  <p>Họ và tên người nộp: <strong>${form.fullName}</strong></p>
                  <p>Ngày sinh: ${formatDateDisplay(form.dob)} - Số CCCD: ${form.cccd}</p>
                  <p>Ngành đăng ký học: <strong>${selectedRegisterMajor?.name || ""}</strong></p>
                  <p>Email: ${form.email} - SĐT: ${form.phone}</p>
                  
                  <br/>
                  <p><strong>DANH MỤC HỒ SƠ ĐÃ NỘP TRỰC TUYẾN:</strong></p>
                  <ol>
                      <li>File hồ sơ tổng hợp: ${file?.name || (existingFileLink ? "File đã lưu trên hệ thống" : "File.pdf")}</li>
                      ${form.hasTranscript ? '<li>Bảng điểm & Bằng tốt nghiệp ĐH: Có</li>' : ''}
                      ${form.requestExemption ? '<li>Đơn xin miễn học phần: Có</li>' : ''}
                  </ol>
                  
                  <p><em>Hồ sơ đã được ghi nhận vào hệ thống quản lý đào tạo của Nhà trường.</em></p>
              </div>

              <div class="footer">
                  TP.HCM, ${dateStr}<br/>
                  <br/>
                  <br/>
                  <strong>Người nộp hồ sơ</strong><br/>
                  <br/>
                  <br/>
                  <br/>
                  ${form.fullName}
              </div>
          </body>
          </html>
      `;

      // Create Blob and Download
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BienNhan_${form.cccd}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex flex-wrap justify-center w-full md:w-max mx-auto mb-6 gap-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'info' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Thông tin Tuyển sinh
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'upload' 
              ? 'bg-green-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Nộp Hồ sơ Bổ sung
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'curriculum' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Chương trình Đào tạo
        </button>
      </div>

      {/* Main Content */}
      {activeTab === 'info' && <AdmissionView />}
      
      {activeTab === 'upload' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 max-w-4xl mx-auto relative">
          
          {/* Nút Quay Lại */}
          <button 
             onClick={() => setActiveTab('info')}
             className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 transition"
             title="Quay lại"
          >
              <ArrowLeft size={24}/>
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-green-800 uppercase">Phiếu Đăng Ký Học</h2>
            <p className="text-green-600 font-medium">Chương trình Bổ sung Kiến thức Sau Đại học</p>
          </div>

          {!submitted ? (
             isCheckingProfile ? (
                 <div className="text-center py-10">
                     <RefreshCw className="animate-spin mx-auto text-green-600 mb-2" size={32}/>
                     <p className="text-gray-500">Đang kiểm tra hồ sơ cũ...</p>
                 </div>
             ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* UPDATE NOTIFICATION */}
                  {existingProfileId && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start mb-4">
                          <CheckCircle className="mr-3 mt-1 flex-shrink-0" size={20}/>
                          <div>
                              <p className="font-bold">Tìm thấy hồ sơ đã nộp!</p>
                              <p className="text-sm mt-1">Hệ thống đã tự động điền thông tin cũ của bạn. Bạn có thể chỉnh sửa và bấm "Cập nhật" bên dưới.</p>
                              {existingFileLink && (
                                  <a href={existingFileLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-2 block flex items-center">
                                      <FileText size={12} className="mr-1"/> Xem file hồ sơ cũ
                                  </a>
                              )}
                          </div>
                      </div>
                  )}

                  {/* 1. THÔNG TIN CÁ NHÂN */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center border-b pb-2"><User className="mr-2" size={18}/> 1. Thông tin về người đăng ký học</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Họ và tên (IN HOA)</label>
                            <input name="fullName" type="text" value={form.fullName} onChange={handleInputChange} onBlur={handleNameBlur} className={`w-full border p-2.5 rounded-lg uppercase font-bold text-gray-800 ${errors.fullName ? 'border-red-500 bg-red-50' : ''}`} placeholder="NGUYỄN VĂN A" />
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Ngày sinh</label>
                                <input name="dob" type="date" value={form.dob} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg ${errors.dob ? 'border-red-500 bg-red-50' : ''}`} />
                                {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Giới tính</label>
                                <select name="gender" value={form.gender} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg bg-white ${errors.gender ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="" disabled>-- Chọn --</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </select>
                                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Nơi sinh (Tỉnh/Thành)</label>
                            <select name="pob" value={form.pob} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg bg-white ${errors.pob ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="" disabled>-- Chọn tỉnh/thành --</option>
                                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                <option value="Khác...">Khác (Nhập thủ công)...</option>
                            </select>
                            {errors.pob && <p className="text-red-500 text-xs mt-1">{errors.pob}</p>}
                            {form.pob === "Khác..." && (
                                <>
                                    <input name="pobOther" type="text" value={form.pobOther} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg mt-2 ${errors.pobOther ? 'border-red-500 bg-red-50' : ''}`} placeholder="Nhập nơi sinh..." />
                                    {errors.pobOther && <p className="text-red-500 text-xs mt-1">{errors.pobOther}</p>}
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Dân tộc</label>
                                <select name="ethnicity" value={form.ethnicity} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg bg-white ${errors.ethnicity ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="" disabled>-- Chọn --</option>
                                    {ETHNICITIES.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                {errors.ethnicity && <p className="text-red-500 text-xs mt-1">{errors.ethnicity}</p>}
                                {form.ethnicity === "Khác..." && (
                                    <>
                                        <input name="ethnicityOther" type="text" value={form.ethnicityOther} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg mt-2 ${errors.ethnicityOther ? 'border-red-500 bg-red-50' : ''}`} placeholder="Nhập dân tộc..." />
                                        {errors.ethnicityOther && <p className="text-red-500 text-xs mt-1">{errors.ethnicityOther}</p>}
                                    </>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Quốc tịch</label>
                                <select name="nationality" value={form.nationality} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg bg-white ${errors.nationality ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="" disabled>-- Chọn --</option>
                                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                                {form.nationality === "Khác..." && (
                                    <>
                                        <input name="nationalityOther" type="text" value={form.nationalityOther} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg mt-2 ${errors.nationalityOther ? 'border-red-500 bg-red-50' : ''}`} placeholder="Nhập quốc tịch..." />
                                        {errors.nationalityOther && <p className="text-red-500 text-xs mt-1">{errors.nationalityOther}</p>}
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Số CCCD (12 số)</label>
                            <input name="cccd" type="text" value={form.cccd} onChange={handleInputChange} maxLength={12} className={`w-full border p-2.5 rounded-lg ${errors.cccd ? 'border-red-500 bg-red-50' : ''}`} placeholder="012345678912" />
                            {errors.cccd && <p className="text-red-500 text-xs mt-1">{errors.cccd}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Ngày cấp CCCD</label>
                            <input name="cccdDate" type="date" value={form.cccdDate} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg ${errors.cccdDate ? 'border-red-500 bg-red-50' : ''}`} />
                            {errors.cccdDate && <p className="text-red-500 text-xs mt-1">{errors.cccdDate}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Email liên hệ</label>
                            <input name="email" type="email" value={form.email} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg ${errors.email ? 'border-red-500 bg-red-50' : ''}`} placeholder="email@domain.com"/>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Số điện thoại</label>
                            <input name="phone" type="tel" value={form.phone} onChange={handleInputChange} maxLength={10} className={`w-full border p-2.5 rounded-lg ${errors.phone ? 'border-red-500 bg-red-50' : ''}`} placeholder="09xxxxxxxx" />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>
                    </div>
                  </div>

                  {/* 2. THÔNG TIN ĐĂNG KÝ & VĂN BẰNG */}
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h3 className="font-bold text-green-900 mb-4 flex items-center border-b border-green-200 pb-2"><Book className="mr-2" size={18}/> 2. Thông tin Đăng ký & Văn bằng</h3>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">2.1. Ngành đăng ký học (Sau đại học)</label>
                        <select name="registerMajorCode" value={form.registerMajorCode} onChange={handleInputChange} className={`w-full border-2 border-green-200 p-3 rounded-lg bg-white font-bold text-green-800 ${errors.registerMajorCode ? 'border-red-500' : ''}`}>
                            <option value="" disabled>-- Chọn Ngành đăng ký --</option>
                            {ADMISSION_MAPPING.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                        </select>
                        {errors.registerMajorCode && <p className="text-red-500 text-xs mt-1">{errors.registerMajorCode}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">2.2. Ngành tốt nghiệp Đại học (Hệ thống tự lọc theo ngành đăng ký)</label>
                            <select name="graduatedMajor" value={form.graduatedMajor} onChange={handleInputChange} className="w-full border p-3 rounded-lg bg-white">
                                <option value="" disabled>-- Chọn ngành --</option>
                                {allowedGradMajors.map((m, i) => <option key={i} value={m}>{m}</option>)}
                            </select>
                            {isGradMajorWarning && (
                                <div className="mt-2">
                                    <input name="graduatedMajorOther" type="text" value={form.graduatedMajorOther} onChange={handleInputChange} className={`w-full border p-3 rounded-lg mb-2 ${errors.graduatedMajorOther ? 'border-red-500 bg-red-50' : ''}`} placeholder="Nhập tên ngành trên bằng ĐH..." />
                                    {errors.graduatedMajorOther && <p className="text-red-500 text-xs mt-1 mb-2">{errors.graduatedMajorOther}</p>}
                                    <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded flex items-start">
                                        <AlertTriangle size={14} className="mr-1 mt-0.5"/>
                                        <span>Lưu ý: Ngành này có thể thuộc diện phải học Bổ sung kiến thức nhiều tín chỉ hơn.</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cơ sở cấp bằng (Tên trường ĐH)</label>
                            <input name="graduatedSchool" type="text" value={form.graduatedSchool} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg ${errors.graduatedSchool ? 'border-red-500 bg-red-50' : ''}`} />
                            {errors.graduatedSchool && <p className="text-red-500 text-xs mt-1">{errors.graduatedSchool}</p>}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Năm TN</label>
                                <input name="gradYear" type="number" value={form.gradYear} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg ${errors.gradYear ? 'border-red-500 bg-red-50' : ''}`} placeholder="2023" />
                                {errors.gradYear && <p className="text-red-500 text-xs mt-1">{errors.gradYear}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Xếp loại</label>
                                <select name="gradRank" value={form.gradRank} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg bg-white ${errors.gradRank ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="" disabled>-- Chọn --</option>
                                    <option>Xuất sắc</option><option>Giỏi</option><option>Khá</option><option>Trung bình khá</option><option>Trung bình</option>
                                </select>
                                {errors.gradRank && <p className="text-red-500 text-xs mt-1">{errors.gradRank}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Hình thức</label>
                                <select name="trainingType" value={form.trainingType} onChange={handleInputChange} className={`w-full border p-2.5 rounded-lg bg-white ${errors.trainingType ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="" disabled>-- Chọn --</option>
                                    <option>Chính quy</option><option>Vừa làm vừa học</option><option>Từ xa</option><option>Liên thông</option>
                                </select>
                                {errors.trainingType && <p className="text-red-500 text-xs mt-1">{errors.trainingType}</p>}
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* 3. HỒ SƠ & CAM KẾT */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><Upload className="mr-2" size={18}/> 3. Hồ sơ đính kèm</h3>
                      
                      <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-3">
                              <label className="flex items-center cursor-pointer">
                                  <input type="checkbox" name="hasTranscript" checked={form.hasTranscript} onChange={handleInputChange} className="w-4 h-4 text-green-600 rounded mr-2"/>
                                  <span className="text-sm text-gray-700">Có nộp Bảng điểm & Bằng tốt nghiệp</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                  <input type="checkbox" name="requestExemption" checked={form.requestExemption} onChange={handleInputChange} className="w-4 h-4 text-green-600 rounded mr-2"/>
                                  <span className="text-sm text-gray-700">Có nguyện vọng miễn học phần (đã học ở ĐH)</span>
                              </label>
                          </div>

                          <div className="flex-1">
                            <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 transition group relative ${errors.file ? 'border-red-300 bg-red-50' : 'border-blue-300'}`}>
                                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.zip,.rar" />
                                <Upload className={`w-8 h-8 mb-2 transition ${file ? 'text-green-600' : 'text-blue-400'}`} />
                                <p className="font-bold text-sm text-blue-900">{file ? file.name : (existingFileLink ? "Giữ file cũ (Tải file mới để thay thế)" : "Upload File Hồ sơ (PDF/ZIP)")}</p>
                                <p className="text-[10px] text-gray-400">Tối đa 10MB</p>
                            </div>
                            {errors.file && <p className="text-red-500 text-xs mt-1 text-center">{errors.file}</p>}
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-center">
                    <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center shadow-xl shadow-green-200 transform hover:-translate-y-1">
                        {isSubmitting ? <RefreshCw className="animate-spin mr-2"/> : <Send className="mr-2"/>}
                        {isSubmitting ? 'Đang xử lý...' : (existingProfileId ? 'CẬP NHẬT HỒ SƠ' : 'NỘP HỒ SƠ ĐĂNG KÝ')}
                    </button>
                  </div>

                </form>
             )
          ) : (
            <div className="text-center py-12 animate-fade-in-up">
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <CheckCircle size={48} className="text-green-600" />
               </div>
               <h3 className="text-2xl font-bold text-gray-800 mb-2">{existingProfileId ? 'Cập nhật thành công!' : 'Nộp hồ sơ thành công!'}</h3>
               <p className="text-gray-600 mb-6 max-w-md mx-auto">Hồ sơ của <strong>{form.fullName}</strong> đã được ghi nhận vào hệ thống. Phòng Sau đại học sẽ liên hệ qua Email hoặc điện thoại<strong>{form.email}</strong> trong thời gian sớm nhất.</p>
               <div className="flex justify-center gap-4">
                   <button onClick={handlePrintReceipt} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-bold flex items-center">
                       <Printer size={18} className="mr-2"/> In Biên nhận (.doc)
                   </button>
                   <button onClick={()=>{setSubmitted(false); checkExistingProfile(form.email)}} className="text-green-600 font-bold hover:underline px-6 py-2">Xem lại hồ sơ</button>
               </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'curriculum' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 max-w-5xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-purple-900 mb-2">Chương trình Đào tạo Thạc sĩ</h2>
                <p className="text-gray-500">Thông tin tổng quan & So sánh định hướng</p>
            </div>
            
            {/* THÔNG TIN CHUNG */}
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-8 flex flex-col md:flex-row justify-around items-center text-center">
                <div className="mb-4 md:mb-0">
                    <p className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-1">Tổng tín chỉ toàn khóa</p>
                    <p className="text-3xl font-extrabold text-purple-600">60 - 65 <span className="text-sm">tín chỉ</span></p>
                </div>
                <div className="h-10 w-px bg-purple-200 hidden md:block"></div>
                <div className="mb-4 md:mb-0">
                    <p className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-1">Thời gian đào tạo</p>
                    <p className="text-3xl font-extrabold text-purple-600">1.5 - 2 <span className="text-sm">năm</span></p>
                </div>
                <div className="h-10 w-px bg-purple-200 hidden md:block"></div>
                 <div>
                    <a href="https://hcmue.edu.vn/vi/dao-tao/sau-dai-hoc/cao-hoc" target="_blank" rel="noreferrer" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-bold flex items-center shadow-lg transition">
                        <Download size={18} className="mr-2"/> Tải Khung chương trình (PDF)
                    </a>
                </div>
            </div>

            {/* SO SÁNH 2 ĐỊNH HƯỚNG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hướng Nghiên cứu */}
                <div className="border-2 border-blue-100 bg-white rounded-2xl p-6 hover:shadow-lg transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-bl-xl">Hàn lâm</div>
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
                        <GraduationCap size={28} className="text-blue-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Thạc sĩ theo hướng Nghiên cứu</h3>
                    <p className="text-sm text-gray-600 mb-4 h-12">
                        Dành cho học viên muốn phát triển năng lực nghiên cứu chuyên sâu, giảng dạy hoặc tiếp tục học lên Tiến sĩ.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 uppercase mb-2">Yêu cầu tốt nghiệp</p>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-blue-500 mt-0.5"/> <span>Thực hiện <strong>Luận văn Thạc sĩ</strong></span></li>
                            <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-blue-500 mt-0.5"/> <span>Thực hiện <strong>03 chuyên đề nghiên cứu</strong></span></li>
                            <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-blue-500 mt-0.5"/> <span>Khối lượng: <strong>15 tín chỉ</strong></span></li>
                            <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-blue-500 mt-0.5"/> <span>Yêu cầu công bố bài báo khoa học (tùy ngành).</span></li>
                        </ul>
                    </div>
                </div>

                {/* Hướng Ứng dụng */}
                <div className="border-2 border-green-100 bg-white rounded-2xl p-6 hover:shadow-lg transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-bl-xl">Thực tiễn</div>
                    <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 transition">
                        <Briefcase size={28} className="text-green-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Thạc sĩ theo hướng Ứng dụng</h3>
                    <p className="text-sm text-gray-600 mb-4 h-12">
                        Tập trung nâng cao kỹ năng nghề nghiệp, quản lý và vận dụng kiến thức vào giải quyết vấn đề thực tiễn.
                    </p>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-xs font-bold text-green-800 uppercase mb-2">Yêu cầu tốt nghiệp</p>
                        <ul className="space-y-2 text-sm text-gray-700">
                             <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-green-500 mt-0.5"/> <span>Thực hiện <strong>Đề án tốt nghiệp</strong> hoặc <strong>Báo cáo thực tập</strong></span></li>
                              <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-green-500 mt-0.5"/> <span>Thực hiện <strong>01 chuyên đề thực tập</strong></span></li>
                             <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-green-500 mt-0.5"/> <span>Khối lượng: <strong>9 tín chỉ</strong></span></li>
                             <li className="flex items-start"><CheckCircle size={16} className="mr-2 text-green-500 mt-0.5"/> <span>Học thêm các học phần thay thế bổ trợ.</span></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 italic">
                    * Lưu ý: Cấu trúc chi tiết từng chuyên ngành có thể khác nhau. Vui lòng xem file PDF để biết thêm chi tiết.
                </p>
            </div>
        </div>
      )}
    </div>
  );
};