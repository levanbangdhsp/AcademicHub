import React, { useState } from 'react';
import { 
  UserPlus, FileText, GraduationCap, Search, PenTool, ArrowLeft, 
  Info, Sparkles, RefreshCw, ShieldAlert, CheckCircle, Lightbulb, 
  ArrowRight, BookOpen, User, Settings, HelpCircle, ChevronDown, ChevronUp, Star,
  Table, FileDown, Microscope, AlertTriangle, Upload, Wrench, Globe
} from 'lucide-react';

interface TutorialsViewProps {
  onBack?: () => void;
}

const FAQ_DATA = [
    { q: "Tôi có thể sử dụng tài khoản Google cá nhân để đăng nhập không?", a: "Hiện tại hệ thống hỗ trợ đăng ký tài khoản mới bằng Email bất kỳ. Trong tương lai sẽ tích hợp đăng nhập Google/SSO." },
    { q: "Làm sao để biết đề tài của tôi có bị trùng lặp không?", a: "Bạn vào tab 'Tra cứu Đề tài', nhập tên đề tài dự kiến. Hệ thống sẽ quét CSDL luận văn, đề án đã bảo vệ của trường để kiểm tra và cảnh báo nếu có sự trùng lặp ý tưởng." },
    { q: "File hồ sơ nộp bổ sung kiến thức cần định dạng gì?", a: "Hệ thống chấp nhận file PDF hoặc file nén (ZIP/RAR) chứa toàn bộ giấy tờ cần thiết. Dung lượng tối đa 10MB." },
    { q: "AI có viết thay tôi toàn bộ luận văn, đề án không?", a: "KHÔNG. AI chỉ đóng vai trò trợ lý: gợi ý dàn ý, viết nháp từng phần, sửa lỗi diễn đạt và thẩm định logic. Bạn chịu trách nhiệm chính về nội dung khoa học." },
    { q: "Làm thế nào để chuyển Luận văn, đề án thành Bài báo?", a: "Vào tab 'NCKH', chọn 'Chuyển đổi từ Nghiên cứu', chọn dự án luận văn, đề án. AI sẽ tóm tắt và định dạng lại theo chuẩn bài báo IMRaD." },
];

const TIPS_DATA = [
    "💡 Mẹo: Khi nhờ AI viết, hãy cung cấp càng nhiều dữ liệu đầu vào (số liệu, dẫn chứng) càng tốt để bài viết có độ chính xác cao.",
    "💡 Mẹo: Sử dụng tính năng 'Paraphrase' nhiều lần cho cùng một đoạn văn để tìm ra cách diễn đạt ưng ý nhất.",
    "💡 Mẹo: Luôn kiểm tra lại danh sách 'Tài liệu tham khảo' mà AI gợi ý để đảm bảo nguồn tin cậy.",
    "💡 Mẹo: Nộp hồ sơ xong nhớ tải 'Biên nhận' về máy để làm bằng chứng đối chiếu sau này."
];

export const TutorialsView: React.FC<TutorialsViewProps> = ({ onBack }) => {
  const [openSection, setOpenSection] = useState<string | null>('thesis');
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
                   Hệ thống hỗ trợ toàn diện cho học viên sau đại học: Từ nộp hồ sơ, tra cứu tên đề tài đến viết luận văn, đề án, tiểu luận môn học, bài tập nhóm và công bố quốc tế chuẩn IMRaD.
               </p>
           </div>
           <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 z-10">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Star size={18} className="mr-2 text-yellow-300"/> Tính năng nổi bật</h3>
                <ul className="space-y-3 text-sm text-blue-50">
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-400"/> AI Gợi ý đề tài & Dàn ý</li>
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-400"/> Phân tích số liệu & Bảng hỏi</li>
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-400"/> Check đạo văn & Paraphrase</li>
                    <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-400"/> Chuyển đổi Luận văn/Đề án->Bài báo</li>
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
                      <div className="p-5 bg-white border-t border-orange-100 space-y-4 animate-fade-in">
                          <p className="text-sm text-gray-700">Kiểm tra xem ý tưởng của bạn đã có ai nghiên cứu tại ĐHSP TP.HCM chưa?</p>
                          
                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                               <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center"><ShieldAlert size={16} className="mr-2"/> Cơ chế Quét & Cảnh báo:</h4>
                               <ul className="list-disc ml-5 text-xs text-orange-800 space-y-1">
                                   <li>Hệ thống quét toàn bộ CSDL Luận văn/Đề án đã bảo vệ của trường.</li>
                                   <li><strong>Phân tích theo Lĩnh vực:</strong> Chỉ rõ có bao nhiêu đề tài đã làm trong lĩnh vực bạn chọn (Ví dụ: "Lĩnh vực Tâm lý học đã có 15 đề tài tương tự").</li>
                                   <li><strong>Cảnh báo Trùng lặp:</strong> Nếu tên đề tài giống &gt; 20%, hệ thống sẽ hiện cảnh báo đỏ để bạn điều chỉnh hướng nghiên cứu.</li>
                               </ul>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                               <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center"><Globe size={16} className="mr-2"/> Mở rộng: Nguồn Google Scholar</h4>
                               <p className="text-xs text-blue-800">
                                   Không chỉ trong trường, hệ thống còn kết nối với Google Scholar để cho bạn biết:
                                   <br/>- Có bao nhiêu nghiên cứu quốc tế về vấn đề này?
                                   <br/>- Xu hướng nghiên cứu thế giới đang đi về đâu?
                               </p>
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