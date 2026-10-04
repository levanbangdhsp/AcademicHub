import React, { useState } from 'react';
import { 
  UserPlus, FileText, GraduationCap, Search, PenTool, ArrowLeft, 
  Info, Sparkles, RefreshCw, ShieldAlert, CheckCircle, Lightbulb, 
  ArrowRight, BookOpen, User, Settings, HelpCircle, ChevronDown, ChevronUp, Star,
  Table, FileDown, Microscope, AlertTriangle, Upload, Wrench, Globe, Bot, ShieldCheck, Download
} from 'lucide-react';

interface TutorialsViewProps {
  onBack?: () => void;
}

const FAQ_DATA = [
    { q: "Tôi có thể sử dụng tài khoản Google cá nhân để đăng nhập không?", a: "Hiện tại hệ thống hỗ trợ đăng ký tài khoản mới bằng Email bất kỳ. Trong tương lai sẽ tích hợp đăng nhập Google/SSO." },
    { q: "Làm sao để biết đề tài của tôi có bị trùng lặp không?", a: "Bạn vào tab 'Tra cứu Đề tài', nhập tên đề tài dự kiến. Hệ thống sẽ quét CSDL luận văn, đề án đã bảo vệ của trường để kiểm tra và cảnh báo nếu có sự trùng lặp ý tưởng." },
    { q: "Tính năng Kiểm tra AI & Viết lại học thuật hoạt động như thế nào?", a: "Hệ thống sử dụng mô hình Gemini 3.8 Flash chuyên sâu kết hợp đối chiếu Google Search thời gian thực. Hệ thống quét từng câu, tính toán tỷ lệ AI, truy vết nguồn tài liệu lý thuyết gốc và cung cấp tính năng viết lại tự nhiên (Humanize 1-Click) để vượt qua các cổng kiểm định Turnitin/GPTZero mà vẫn bảo toàn 100% nội dung chuyên môn." },
    { q: "File hồ sơ nộp bổ sung kiến thức cần định dạng gì?", a: "Hệ thống chấp nhận file PDF hoặc file nén (ZIP/RAR) chứa toàn bộ giấy tờ cần thiết. Dung lượng tối đa 10MB." },
    { q: "AI có viết thay tôi toàn bộ luận văn, đề án không?", a: "KHÔNG. AI chỉ đóng vai trò trợ lý: gợi ý dàn ý, viết nháp từng phần, sửa lỗi diễn đạt và thẩm định logic. Bạn chịu trách nhiệm chính về nội dung khoa học." },
    { q: "Làm thế nào để chuyển Luận văn, đề án thành Bài báo?", a: "Vào tab 'NCKH', chọn 'Chuyển đổi từ Nghiên cứu', chọn dự án luận văn, đề án. AI sẽ tóm tắt và định dạng lại theo chuẩn bài báo IMRaD." },
];

const TIPS_DATA = [
    "💡 Mẹo: Khi quét AI, sử dụng tính năng 'Tự động sửa toàn bộ các đoạn AI' để hệ thống tự khử sáo rỗng và chuẩn hóa văn phong học thuật chỉ với 1 click.",
    "💡 Mẹo: Khi nhờ AI viết, hãy cung cấp càng nhiều dữ liệu đầu vào (số liệu, dẫn chứng) càng tốt để bài viết có độ chính xác cao.",
    "💡 Mẹo: Sử dụng tính năng 'Paraphrase' nhiều lần cho cùng một đoạn văn để tìm ra cách diễn đạt ưng ý nhất.",
    "💡 Mẹo: Luôn kiểm tra lại danh sách 'Tài liệu tham khảo' mà AI gợi ý để đảm bảo nguồn tin cậy.",
    "💡 Mẹo: Nộp hồ sơ xong nhớ tải 'Biên nhận' về máy để làm bằng chứng đối chiếu sau này."
];

export const TutorialsView: React.FC<TutorialsViewProps> = ({ onBack }) => {
  const [openSection, setOpenSection] = useState<string | null>('ai_detector');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const toggleFaq = (index: number) => {
      setOpenFaq(openFaq === index ? null : index);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 animate-fade-in max-w-6xl mx-auto relative min-h-screen">
      
      {/* Header & Back Button */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          {onBack ? (
            <button 
                onClick={onBack}
                className="flex items-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full transition border border-gray-200 hover:border-blue-200 font-bold text-sm"
            >
                <ArrowLeft size={18} className="mr-2" /> Quay lại Trang chủ
            </button>
          ) : <div></div>}
          <div className="flex items-center text-blue-900">
              <HelpCircle size={24} className="mr-2"/>
              <h1 className="text-2xl font-bold">Trung tâm Hướng dẫn & Trợ giúp</h1>
          </div>
      </div>

      {/* 1. INTRO BANNER */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-3xl p-10 text-white mb-12 flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
           {/* Abstract shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10"></div>
           
           <div className="flex-1 z-10">
               <div className="inline-flex items-center bg-blue-700/50 rounded-full px-3 py-1 text-xs font-bold mb-4 border border-blue-500/50">
                   <Sparkles size={12} className="mr-2 text-yellow-300"/> AcademicHub v3.0
               </div>
               <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Làm chủ Nghiên cứu với<br/><span className="text-yellow-300">Trợ lý AI Toàn năng</span></h2>
               <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                   Hệ thống hỗ trợ toàn diện cho học viên sau đại học: Từ nộp hồ sơ, tra cứu tên đề tài, viết luận văn đến kiểm định AI chuyên sâu và công bố quốc tế chuẩn IMRaD.
               </p>
           </div>
           <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 z-10">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Star size={18} className="mr-2 text-yellow-300"/> Tính năng nổi bật</h3>
                <ul className="space-y-3 text-sm text-blue-50">
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-emerald-400"/> Kiểm định AI & Viết lại học thuật</li>
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-400"/> AI Gợi ý đề tài & Dàn ý</li>
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-400"/> Phân tích số liệu & Bảng hỏi</li>
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-400"/> Chuyển đổi Luận văn thành Bài báo</li>
                </ul>
           </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: GUIDES */}
          <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Hướng dẫn Sử dụng Chi tiết</h3>

              {/* SECTION 1: LÀM LUẬN VĂN */}
              <div className="border-2 border-purple-100 rounded-xl overflow-hidden shadow-sm">
                  <button 
                      onClick={() => toggleSection('thesis')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left transition ${openSection === 'thesis' ? 'bg-purple-50 text-purple-900' : 'bg-white hover:bg-gray-50'}`}
                  >
                      <div className="flex items-center"><FileText size={20} className="mr-3 text-purple-600"/> Quy trình Làm Luận văn (5 Bước)</div>
                      {openSection === 'thesis' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </button>
                  
                  {openSection === 'thesis' && (
                      <div className="p-5 bg-white border-t border-purple-100 space-y-6 animate-fade-in">
                          {/* Step 1: Ý tưởng */}
                          <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">1</div>
                              <div>
                                  <h4 className="font-bold text-gray-800 mb-1">Khởi tạo & Kiểm tra Đề tài</h4>
                                  <p className="text-sm text-gray-600 mb-2">Đảm bảo tính mới và khả thi ngay từ đầu.</p>
                                  <ul className="list-disc ml-5 text-sm text-gray-500 space-y-1">
                                      <li>Nhập từ khóa để AI gợi ý 5-10 tên đề tài "hot" nhất.</li>
                                      <li>Nhập tên đề tài của bạn để AI chấm điểm <strong>Tính khả thi</strong> và <strong>Tính mới</strong>.</li>
                                      <li>Hệ thống tự động quét trùng lặp với CSDL nhà trường để cảnh báo sớm.</li>
                                  </ul>
                              </div>
                          </div>

                          {/* Step 2: Đề cương */}
                          <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">2</div>
                              <div>
                                  <h4 className="font-bold text-gray-800 mb-1">Xây dựng Đề cương Chi tiết</h4>
                                  <p className="text-sm text-gray-600 mb-2">Dàn ý chuẩn logic khoa học.</p>
                                  <ul className="list-disc ml-5 text-sm text-gray-500 space-y-1">
                                      <li>AI tự động sinh đề cương đầy đủ (Mục tiêu, Nhiệm vụ, Phương pháp...).</li>
                                      <li>Bạn có thể chỉnh sửa, thêm bớt các chương mục.</li>
                                      <li>Bấm <strong>"Thẩm định Logic"</strong> để AI rà soát lỗi mâu thuẫn giữa Mục tiêu và Nội dung.</li>
                                  </ul>
                              </div>
                          </div>

                          {/* Step 3: Viết & Công cụ */}
                          <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">3</div>
                              <div>
                                  <h4 className="font-bold text-gray-800 mb-1">Viết bài & Các công cụ Hỗ trợ</h4>
                                  <p className="text-sm text-gray-600 mb-2">Tăng tốc độ viết gấp 5 lần.</p>
                                  <ul className="list-disc ml-5 text-sm text-gray-500 space-y-1">
                                      <li><strong className="text-purple-700">AI Viết:</strong> Chọn một mục, AI sẽ viết nháp nội dung cho bạn.</li>
                                      <li><strong className="text-orange-600">Thiết kế Bảng hỏi:</strong> AI tự tạo bảng câu hỏi khảo sát Likert.</li>
                                      <li><strong className="text-green-600">Phân tích Số liệu:</strong> Nhập số liệu vào bảng, AI tự viết nhận xét/bàn luận.</li>
                                      <li><strong className="text-red-600">Kiểm tra Đạo văn:</strong> Quét trùng lặp sơ bộ và dùng AI viết lại đoạn có trùng lặp (Paraphrase).</li>
                                  </ul>
                              </div>
                          </div>

                           {/* Step 4: Xuất bản */}
                           <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">4</div>
                              <div>
                                  <h4 className="font-bold text-gray-800 mb-1">Hoàn thiện & Xuất bản</h4>
                                  <ul className="list-disc ml-5 text-sm text-gray-500 space-y-1">
                                      <li>Xuất toàn bộ luận văn ra file <strong>Word (.doc)</strong> chuẩn định dạng.</li>
                                      <li>Tự động tạo <strong>Slide thuyết trình (PPTX)</strong> từ nội dung đã viết.</li>
                                  </ul>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* SECTION 2: BÀI BÁO KHOA HỌC (UPDATED DETAIL) */}
              <div className="border-2 border-green-100 rounded-xl overflow-hidden shadow-sm">
                  <button 
                      onClick={() => toggleSection('research')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left transition ${openSection === 'research' ? 'bg-green-50 text-green-900' : 'bg-white hover:bg-gray-50'}`}
                  >
                      <div className="flex items-center"><PenTool size={20} className="mr-3 text-green-600"/> Viết Bài báo Khoa học (NCKH)</div>
                      {openSection === 'research' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </button>
                  
                  {openSection === 'research' && (
                      <div className="p-5 bg-white border-t border-green-100 space-y-6 animate-fade-in">
                          <p className="text-sm text-gray-700 italic">Chọn phương thức bắt đầu phù hợp nhất với bạn:</p>
                          
                          {/* Method 1 */}
                          <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold"><Lightbulb size={16}/></div>
                              <div>
                                  <h4 className="font-bold text-gray-800 text-sm">1. Chưa có ý tưởng?</h4>
                                  <p className="text-xs text-gray-600 mt-1">AI đóng vai Giáo sư, phân tích xu hướng và đề xuất <strong>5-10 tên đề tài/bài báo mới nhất</strong> kèm tóm tắt định hướng.</p>
                              </div>
                          </div>

                          {/* Method 2 */}
                          <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold"><PenTool size={16}/></div>
                              <div>
                                  <h4 className="font-bold text-gray-800 text-sm">2. Đã có Tên & Tóm tắt?</h4>
                                  <p className="text-xs text-gray-600 mt-1">Nhập thông tin cơ bản, AI sẽ tự động xây dựng <strong>khung sườn bài báo chuẩn IMRaD</strong> (Introduction - Methods - Results - Discussion) để bạn điền vào.</p>
                              </div>
                          </div>

                          {/* Method 3 */}
                          <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold"><RefreshCw size={16}/></div>
                              <div>
                                  <h4 className="font-bold text-gray-800 text-sm">3. Có sẵn Luận văn/Đề án/Tiểu luận/Bài viết?</h4>
                                  <p className="text-xs text-gray-600 mt-1">Tải file Luận văn/Đề án/Tiểu luận/Bài viết lên, AI sẽ đọc hiểu, chắt lọc nội dung tinh túy nhất và <strong>chuyển đổi thành bài báo ngắn gọn (6-10 trang)</strong>.</p>
                              </div>
                          </div>

                          {/* Method 4 */}
                          <div className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold"><Upload size={16}/></div>
                              <div>
                                  <h4 className="font-bold text-gray-800 text-sm">4. Có file bài viết nháp?</h4>
                                  <p className="text-xs text-gray-600 mt-1">Tải file thô lên, AI sẽ đóng vai Biên tập viên để <strong>tổng hợp, định dạng lại</strong> và hoàn thiện bài báo cho bạn.</p>
                              </div>
                          </div>

                          <div className="border-t border-green-100 pt-4 mt-2">
                              <h5 className="font-bold text-green-800 text-sm mb-2 flex items-center"><Wrench size={16} className="mr-2"/> Bộ Công cụ NCKH Mạnh mẽ:</h5>
                              <ul className="list-disc ml-5 text-xs text-gray-600 space-y-1">
                                  <li><strong>AI Viết tiếp:</strong> Bí từ? Bấm một nút, AI viết tiếp đoạn văn cho bạn.</li>
                                  <li><strong>Kiểm tra Đạo văn:</strong> Quét trùng lặp với dữ liệu Internet và tự động Paraphrase (viết lại) để giảm tỷ lệ trùng.</li>
                                  <li><strong>Style Transfer:</strong> Học văn phong của một bài báo mẫu để viết bài mới y hệt phong cách đó.</li>
                              </ul>
                          </div>
                      </div>
                  )}
              </div>

              {/* SECTION 3: TRA CỨU ĐỀ TÀI (NEW DETAIL) */}
              <div className="border-2 border-orange-100 rounded-xl overflow-hidden shadow-sm">
                  <button 
                      onClick={() => toggleSection('check')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left transition ${openSection === 'check' ? 'bg-orange-50 text-orange-900' : 'bg-white hover:bg-gray-50'}`}
                  >
                      <div className="flex items-center"><Search size={20} className="mr-3 text-orange-600"/> Tra cứu Trùng lặp Đề tài (Quan trọng)</div>
                      {openSection === 'check' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </button>
                  
                  {openSection === 'check' && (
                    <div className="p-5 bg-white border-t border-orange-100 space-y-5 animate-fade-in">
                        <p className="text-sm text-gray-700 italic border-l-4 border-orange-400 pl-3 py-1">
                            "Đừng bắt đầu viết khi chưa biết 'đối thủ' là ai! Đây là công cụ 2-trong-1 giúp bạn vừa tránh trùng lặp, vừa định hướng nghiên cứu."
                        </p>
                        
                        {/* Khối 1: Quét trùng lặp */}
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><ShieldAlert size={60} className="text-orange-600"/></div>
                            <h4 className="font-bold text-orange-900 text-sm mb-2 flex items-center relative z-10">
                                <ShieldAlert size={18} className="mr-2 text-orange-600"/> 1. Chốt chặn An toàn (CSDL Nội bộ)
                            </h4>
                            <ul className="list-disc ml-5 text-xs text-orange-800 space-y-2 relative z-10">
                                <li><strong>Quét Siêu tốc:</strong> Rà soát 100% luận văn/đề án đã bảo vệ tại trường.</li>
                                <li><strong>Cảnh báo Đỏ:</strong> Hệ thống tự động báo động nếu tên đề tài giống hơn 20%.</li>
                                <li><strong>Phân tích Mật độ:</strong> Cho biết lĩnh vực bạn chọn đã "chật chội" hay còn "đất diễn" (Ví dụ: "Lĩnh vực này đã có 15 đề tài").</li>
                            </ul>
                        </div>

                        {/* Khối 2: AI Insight */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><Globe size={60} className="text-blue-600"/></div>
                            <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center relative z-10">
                                <Sparkles size={18} className="mr-2 text-purple-600"/> 2. AI Insight & Tầm nhìn Quốc tế (Mới)
                            </h4>
                            <p className="text-xs text-blue-800 mb-3 relative z-10">
                                Không chỉ tìm kiếm, AI sẽ đọc hiểu hàng nghìn bài báo trên Google Scholar để vẽ nên bức tranh toàn cảnh:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-2">
                                {/* Card 1: Giá trị thực chiến tại VN */}
                                <div className="bg-white p-3 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center mb-2">
                                        <Lightbulb size={16} className="text-yellow-500 mr-2" />
                                        <span className="text-xs font-bold text-red-800 uppercase">Gợi ý 'Ngách' Tiềm năng</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        AI chỉ ra những hướng đi <strong>"vừa sức nhưng độc đáo"</strong> phù hợp bối cảnh Việt Nam, giúp bạn tránh lối mòn tư duy cũ kỹ.
                                    </p>
                                </div>

                                {/* Card 2: Giá trị tầm nhìn Quốc tế */}
                                <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center mb-2">
                                        <Sparkles size={16} className="text-purple-500 mr-2" />
                                        <span className="text-xs font-bold text-blue-800 uppercase">Tiếp cận Tinh hoa Thế giới</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Cung cấp các từ khóa <strong>"Tiên phong & Hiện đại"</strong> (State-of-the-art) mà thế giới đang áp dụng, giúp đề tài của bạn không bị lỗi thời.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
              </div>

              {/* SECTION 4: HỒ SƠ & HÀNH CHÍNH */}
              <div className="border-2 border-blue-100 rounded-xl overflow-hidden shadow-sm">
                  <button 
                      onClick={() => toggleSection('admin_proc')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left transition ${openSection === 'admin_proc' ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                  >
                      <div className="flex items-center"><GraduationCap size={20} className="mr-3 text-blue-600"/> Nộp Hồ sơ & Bổ sung kiến thức</div>
                      {openSection === 'admin_proc' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </button>
                  
                  {openSection === 'admin_proc' && (
                      <div className="p-5 bg-white border-t border-blue-100 space-y-4 animate-fade-in">
                          <ul className="list-disc ml-5 text-sm text-gray-600 space-y-2">
                              <li><strong>Nộp Hồ sơ Online:</strong> Điền form, upload minh chứng (PDF/ZIP).</li>
                              <li><strong>Tự động điền:</strong> Hệ thống tự nhớ thông tin cá nhân của bạn.</li>
                              <li><strong>Cập nhật hồ sơ:</strong> Nếu nộp sai, chỉ cần vào lại bằng Email cũ, hệ thống sẽ tải lại hồ sơ để bạn chỉnh sửa và cập nhật.</li>
                              <li><strong>In Biên nhận:</strong> Xuất file Word (.doc) biên nhận hồ sơ để lưu làm bằng chứng.</li>
                          </ul>
                      </div>
                  )}
              </div>

              {/* SECTION 5: KIỂM ĐỊNH AI & ĐẠO VĂN HỌC THUẬT (MỚI & ĐỘT PHÁ) */}
              <div className="border-2 border-indigo-200 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-indigo-50/40 to-white">
                  <button 
                      onClick={() => toggleSection('ai_detector')}
                      className={`w-full flex justify-between items-center p-4 font-bold text-left transition ${openSection === 'ai_detector' ? 'bg-indigo-600 text-white' : 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950'}`}
                  >
                      <div className="flex items-center">
                        <Bot size={22} className={`mr-3 ${openSection === 'ai_detector' ? 'text-yellow-300' : 'text-indigo-600'}`}/> 
                        <span>Kiểm định AI & Đối chiếu Đạo văn Chuyên sâu (Gemini 3.8 Flash)</span>
                        <span className={`ml-3 text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${openSection === 'ai_detector' ? 'bg-yellow-400 text-indigo-950' : 'bg-indigo-200 text-indigo-900'}`}>
                          Đột phá
                        </span>
                      </div>
                      {openSection === 'ai_detector' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </button>
                  
                  {openSection === 'ai_detector' && (
                      <div className="p-6 bg-white border-t border-indigo-100 space-y-6 animate-fade-in">
                          <p className="text-sm text-gray-700 italic border-l-4 border-indigo-500 pl-3 py-1">
                            "Hệ thống kiểm định học thuật thế hệ mới: Quét siêu tốc, phân tích đa chiều nhịp điệu câu và tự động viết lại tự nhiên để văn bản vượt qua mọi cổng quét đạo văn (Turnitin, GPTZero, Winston AI)."
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Feature 1: Quét siêu tốc & Chính xác */}
                            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                              <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                                <Sparkles size={16} className="text-indigo-600" />
                                1. Quét Siêu tốc & Đo lường Đa chiều
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Xử lý trọn vẹn văn bản dài tới <strong>80–100 trang A4</strong> chỉ trong vài giây. Tính toán chính xác chỉ số <strong>Nhịp câu (Burstiness)</strong> và <strong>Độ phức hợp từ vựng (Perplexity)</strong> để nhận diện chính xác sự can thiệp của AI.
                              </p>
                            </div>

                            {/* Feature 2: Tô màu cảnh báo đa tầng */}
                            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 space-y-2">
                              <h4 className="font-bold text-red-900 text-sm flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-600" />
                                2. Tô màu Cảnh báo Trực quan Đa tầng
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Phân vùng trực quan: <strong className="text-red-700">Đỏ (&gt;70%)</strong> - Nguy cơ AI cao; <strong className="text-amber-700">Vàng (40-70%)</strong> - Nghi vấn lai tạo/lý thuyết chung; <strong className="text-emerald-700">Xanh (&lt;40%)</strong> - Tự nhiên nguyên bản.
                              </p>
                            </div>

                            {/* Feature 3: Truy vết nguồn & Trích dẫn */}
                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                                <BookOpen size={16} className="text-amber-700" />
                                3. Truy vết Nguồn & Gợi ý Trích dẫn Chuẩn
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Bóc tách trường phái lý thuyết, tác giả hoặc giáo trình gốc mà AI đã tổng hợp, cung cấp sẵn mẫu trích dẫn <strong>APA 7th / IEEE</strong> chuẩn mực để bổ sung vào danh mục tham khảo, tránh bị quy vào lỗi đạo văn ý tưởng.
                              </p>
                            </div>

                            {/* Feature 4: Khử sáo rỗng & Viết lại tự nhiên */}
                            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-700" />
                                4. Khử Sáo rỗng & Viết lại Tự nhiên (1-Click)
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Tự động xóa bỏ các từ đệm sáo rỗng rập khuôn máy móc, tái cấu trúc lập luận học thuật sắc bén, biến thiên câu linh hoạt giúp hạ tỷ lệ AI xuống <strong>&lt; 5%</strong> mà vẫn bảo toàn 100% nội dung khoa học.
                              </p>
                            </div>
                          </div>

                          {/* Feature 5: Xuất file Word chuẩn Turnitin */}
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <Download size={16} className="text-blue-600" />
                                Xuất Báo cáo Word Chuẩn Định dạng & Bản sạch
                              </h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                Xuất file Word (.doc) có bảng thống kê kiểm định Turnitin ở đầu trang hoặc xuất bản sạch không màu sẵn sàng in ấn nộp hội đồng.
                              </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 whitespace-nowrap">
                              Bảo mật 100% tại RAM
                            </span>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* RIGHT COLUMN: FAQ & TIPS */}
          <div className="space-y-8">
               {/* FAQ - Accordion Style */}
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                   <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><HelpCircle size={20} className="mr-2 text-blue-600"/> Câu hỏi thường gặp</h3>
                   <div className="space-y-2">
                       {FAQ_DATA.map((item, idx) => (
                           <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                               <button 
                                  onClick={() => toggleFaq(idx)}
                                  className="w-full text-left p-3 font-bold text-blue-900 text-sm flex justify-between items-center hover:bg-blue-50 transition"
                               >
                                  {item.q}
                                  {openFaq === idx ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                               </button>
                               {openFaq === idx && (
                                   <div className="p-3 pt-0 text-xs text-gray-600 leading-relaxed animate-fade-in">
                                       {item.a}
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
               </div>

               {/* TIPS */}
               <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
                   <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center"><Lightbulb size={20} className="mr-2"/> Mẹo hay mỗi ngày</h3>
                   <ul className="space-y-3">
                       {TIPS_DATA.map((tip, i) => (
                           <li key={i} className="text-sm text-yellow-900 italic border-b border-yellow-100 last:border-0 pb-2">
                               {tip}
                           </li>
                       ))}
                   </ul>
               </div>
          </div>
      </div>
    </div>
  );
};