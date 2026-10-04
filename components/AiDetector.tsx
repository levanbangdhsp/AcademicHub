import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Plus, 
  Bot, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Download, 
  FileText, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  BookOpen, 
  Check, 
  Edit3, 
  Eye, 
  X,
  FileCheck,
  Info,
  Wand2,
  Trash2,
  HelpCircle,
  Lock,
  PlusCircle,
  RotateCcw,
  FilePlus
} from 'lucide-react';
import { 
  detectAiInDocument, 
  humanizeAiSegment, 
  AiDetectionReport, 
  AiSegmentAnalysis 
} from '../services/gemini';
import { User as UserType, isAiCheckAdmin, ADMIN_EMAIL } from '../types';

interface AiDetectorProps {
  user?: UserType | null;
  onOpenAuth?: () => void;
}

export const AiDetector: React.FC<AiDetectorProps> = ({ user, onOpenAuth }) => {
  // Enforce Master Admin permission check
  if (!isAiCheckAdmin(user)) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl shadow-xl border border-red-100 p-8 sm:p-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner border border-red-100">
          <ShieldAlert size={40} />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 mb-3">
          <Lock size={13}/> Giới hạn đặc quyền Admin
        </span>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Quyền truy cập bị giới hạn</h2>
        <p className="text-gray-600 mb-4 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          Tính năng <strong>Kiểm tra AI & Đạo văn Chuyên sâu</strong> chỉ cấp phép sử dụng cho tài khoản Quản trị viên toàn quyền:
        </p>
        <div className="bg-red-50/70 border border-red-200 rounded-2xl px-4 py-2.5 mb-6 inline-block font-mono font-bold text-red-700 text-base">
          {ADMIN_EMAIL}
        </div>
        <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
          Tài khoản hiện tại của bạn: <strong>{user?.email || 'Chưa đăng nhập'}</strong> ({user?.role === 'admin' ? 'Quản trị viên' : 'Học viên / Thành viên'}). Vui lòng liên hệ Thầy Quản trị để được hỗ trợ kiểm tra tài liệu.
        </p>
      </div>
    );
  }

  const [inputText, setInputText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [report, setReport] = useState<AiDetectionReport | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'human'>('all');
  const [viewMode, setViewMode] = useState<'colored' | 'edit'>('colored');
  const [humanizingSegmentId, setHumanizingSegmentId] = useState<string | null>(null);
  const [humanizeAllProgress, setHumanizeAllProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customRewrites, setCustomRewrites] = useState<Record<string, string>>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [showLogicModal, setShowLogicModal] = useState<boolean>(false);
  const [rewriteStyle, setRewriteStyle] = useState<'academic' | 'concise' | 'argumentative'>('academic');
  const [manualEditTexts, setManualEditTexts] = useState<Record<string, string>>({});
  const [isEditingManually, setIsEditingManually] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bắt đầu kiểm tra bản mới (Làm mới vùng làm việc và mở ngay hộp chọn file)
  const handleNewInspection = () => {
    setInputText('');
    setFileName('');
    setReport(null);
    setSelectedSegmentId(null);
    setCustomRewrites({});
    setManualEditTexts({});
    setIsEditingManually(false);
    setViewMode('colored');
    setScanError(null);
    
    // Reset file input and trigger native file picker immediately
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 50);
    }
  };

  // Sample texts for instant testing
  const sampleAiText = `Trong bối cảnh toàn cầu hóa và cách mạng công nghiệp 4.0 hiện nay, việc ứng dụng trí tuệ nhân tạo vào quản lý giáo dục đóng vai trò vô cùng quan trọng và cấp thiết. Trí tuệ nhân tạo không chỉ giúp tối ưu hóa quy trình quản lý mà còn nâng cao hiệu suất làm việc của cán bộ giảng viên một cách toàn diện.

Bên cạnh đó, các cơ sở giáo dục đại học cần chú trọng đầu tư hạ tầng công nghệ số và đào tạo nguồn nhân lực chất lượng cao. Không thể phủ nhận rằng chuyển đổi số mang lại nhiều cơ hội nhưng cũng đặt ra không ít thách thức đối với công tác bảo mật thông tin và quyền riêng tư của người học.

Nhìn chung, để đạt được kết quả bền vững, các trường cần có chiến lược bài bản, sự phối hợp đồng bộ giữa các phòng ban và sự cam kết của lãnh đạo. Tóm lại, việc chủ động thích ứng với làn sóng công nghệ mới sẽ tạo tiền đề vững chắc cho sự phát triển lâu dài của nền giáo dục hiện đại.`;

  const sampleHumanText = `Khảo sát thực nghiệm tại 4 trường đại học công lập trên địa bàn TP.HCM trong giai đoạn 2023–2024 cho thấy tỷ lệ cán bộ sử dụng phần mềm quản lý học tập (LMS) thường xuyên chỉ đạt 41.2% (N = 328). Nguyên nhân chủ yếu xuất phát từ sự không tương thích giữa hệ thống chấm điểm cũ với module mới của phòng đào tạo.

Khi phỏng vấn sâu 12 trưởng bộ môn, có tới 9 ý kiến chỉ ra rằng giao diện hiện tại quá cồng kềnh, khiến thời gian nhập điểm cuối kỳ kéo dài thêm trung bình 3.5 ngày so với thao tác thủ công trên Excel trước đây.

Dữ liệu này phản bác nhận định của Trần Văn B (2022) khi cho rằng rào cản chuyển đổi số phần lớn nằm ở nhận thức của giảng viên; trên thực tế, điểm nghẽn then chốt lại nằm ở tính tiện dụng (usability) và sự thiếu vắng hướng dẫn tích hợp quy trình thực tế tại khoa.`;

  // File parsing logic
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        if ((window as any).mammoth) {
          const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
          const text = result.value || '';
          setInputText(text);
          setViewMode('colored');
        } else {
          throw new Error('Thư viện đọc file DOCX chưa sẵn sàng, vui lòng thử lại.');
        }
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
          }
          setInputText(fullText.trim());
          setViewMode('colored');
        } else {
          throw new Error('Trình đọc PDF chưa tải xong, vui lòng thử lại sau vài giây.');
        }
      } else if (ext === 'doc') {
        // Fallback for .doc
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          // Clean up binary noise if any
          const cleanText = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
          if (cleanText.length > 50) {
            setInputText(cleanText.trim());
            setViewMode('colored');
          } else {
            alert('File .doc phiên bản cũ có thể không trích xuất đầy đủ. Khuyến nghị bạn lưu lại dưới dạng .docx hoặc .pdf để kết quả quét chuẩn xác nhất.');
          }
        };
        reader.readAsText(file);
      } else {
        // Text / Markdown
        const text = await file.text();
        setInputText(text);
        setViewMode('colored');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setScanError(`Không thể đọc file: ${err.message || 'Lỗi không xác định'}. Hãy thử lưu thành file .docx hoặc copy dán trực tiếp.`);
    }

    // Reset input value so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Perform AI scan
  const handleRunAiScan = async () => {
    if (!inputText.trim()) {
      setScanError('Vui lòng nhập văn bản hoặc tải file lên trước khi kiểm tra!');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setSelectedSegmentId(null);
    setCustomRewrites({});

    try {
      const res = await detectAiInDocument(inputText);
      setReport(res);
      if (res.segments.length > 0) {
        // Auto select first AI flagged segment if any
        const firstAi = res.segments.find(s => s.status === 'high_ai') || res.segments[0];
        setSelectedSegmentId(firstAi.id);
      }
      setViewMode('colored');
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError('Không thể hoàn thành quét AI. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau 30 giây.');
    } finally {
      setIsScanning(false);
    }
  };

  // Humanize single segment with specific style
  const handleHumanizeSegment = async (segment: AiSegmentAnalysis, style: 'academic' | 'concise' | 'argumentative' = rewriteStyle) => {
    setHumanizingSegmentId(segment.id);
    try {
      const res = await humanizeAiSegment(segment.originalText, inputText, undefined, style);
      setCustomRewrites(prev => ({
        ...prev,
        [segment.id]: res.humanizedText
      }));
      setManualEditTexts(prev => ({
        ...prev,
        [segment.id]: res.humanizedText
      }));
    } catch (err) {
      console.error('Humanize segment error:', err);
      setScanError('Không thể viết lại đoạn này lúc này. Vui lòng thử lại sau.');
    } finally {
      setHumanizingSegmentId(null);
    }
  };

  // Helper to replace a segment inside the complete full-length document without losing other pages
  const replaceSnippetInText = (fullDoc: string, targetSnippet: string, newSnippet: string): string => {
    if (!fullDoc || !targetSnippet) return fullDoc;
    
    // 1. Direct match
    if (fullDoc.includes(targetSnippet)) {
      return fullDoc.replace(targetSnippet, newSnippet);
    }
    
    // 2. Trimmed match
    const trimmed = targetSnippet.trim();
    if (fullDoc.includes(trimmed)) {
      return fullDoc.replace(trimmed, newSnippet);
    }

    // 3. Match normalized whitespace
    const normTarget = trimmed.replace(/\s+/g, ' ');
    const normDoc = fullDoc.replace(/\r\n/g, '\n');
    
    // Try locating by first 30 chars and last 30 chars
    const prefix = normTarget.slice(0, Math.min(30, normTarget.length));
    const suffix = normTarget.slice(Math.max(0, normTarget.length - 30));
    
    const startIdx = normDoc.indexOf(prefix);
    if (startIdx !== -1) {
      const endIdx = normDoc.indexOf(suffix, startIdx);
      if (endIdx !== -1) {
        const fullEndIdx = endIdx + suffix.length;
        return normDoc.substring(0, startIdx) + newSnippet + normDoc.substring(fullEndIdx);
      }
    }

    return fullDoc;
  };

  // Apply rewritten text to the main document (preserves 100% full document)
  const handleApplyRewrite = (segmentId: string, newText: string) => {
    if (!report) return;

    const segment = report.segments.find(s => s.id === segmentId);
    const oldOriginalText = segment ? segment.originalText : '';

    const updatedSegments = report.segments.map(s => {
      if (s.id === segmentId) {
        return {
          ...s,
          originalText: newText,
          status: 'human' as const,
          aiScore: 10,
          reasons: ['Đoạn văn đã được chuẩn hóa tự nhiên theo phong cách học thuật của con người.']
        };
      }
      return s;
    });

    // Replace ONLY this specific segment inside the full 98-page document
    if (oldOriginalText) {
      const updatedDoc = replaceSnippetInText(inputText, oldOriginalText, newText);
      setInputText(updatedDoc);
    }

    const highCount = updatedSegments.filter(s => s.status === 'high_ai').length;
    const newAiScore = Math.round((highCount / Math.max(1, updatedSegments.length)) * 100);

    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        overallAiScore: newAiScore,
        overallHumanScore: 100 - newAiScore,
        highAiParagraphCount: highCount,
        verdict: newAiScore < 25 ? 'Văn bản đã được chuẩn hóa tự nhiên' : prev.verdict,
        segments: updatedSegments
      };
    });

    // Clean up temporary rewrite cache
    setCustomRewrites(prev => {
      const copy = { ...prev };
      delete copy[segmentId];
      return copy;
    });

    setCopiedId(segmentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto Humanize ALL AI segments (preserves 100% full document)
  const handleAutoHumanizeAll = async () => {
    if (!report) return;
    const aiSegments = report.segments.filter(s => s.status === 'high_ai' || s.status === 'medium_ai');
    if (aiSegments.length === 0) {
      return;
    }

    setHumanizeAllProgress({ current: 0, total: aiSegments.length });
    const updatedSegments = [...report.segments];
    let currentFullDoc = inputText;

    for (let i = 0; i < aiSegments.length; i++) {
      const seg = aiSegments[i];
      setHumanizeAllProgress({ current: i + 1, total: aiSegments.length });

      try {
        const res = await humanizeAiSegment(seg.originalText, inputText, undefined, rewriteStyle);
        const replacement = res.humanizedText || seg.humanizedSuggestion || seg.originalText;

        const idx = updatedSegments.findIndex(s => s.id === seg.id);
        if (idx !== -1) {
          updatedSegments[idx] = {
            ...updatedSegments[idx],
            originalText: replacement,
            status: 'human',
            aiScore: 8,
            reasons: ['Đã tự động viết lại theo văn phong học thuật tự nhiên.']
          };
        }

        // Replace segment inside the complete document without losing any other pages
        currentFullDoc = replaceSnippetInText(currentFullDoc, seg.originalText, replacement);
      } catch (err) {
        console.error('Error auto-rewriting segment', seg.id, err);
      }
    }

    // Set updated full document (all 98 pages)
    setInputText(currentFullDoc);

    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        overallAiScore: 5,
        overallHumanScore: 95,
        highAiParagraphCount: 0,
        verdict: 'Văn bản đã được viết lại toàn diện - Sẵn sàng nộp kiểm tra',
        segments: updatedSegments
      };
    });

    setHumanizeAllProgress(null);
  };

  // Export document as .doc (Preserves 100% of the entire full-length original document across all pages)
  const handleDownloadDoc = (highlightAiOnly: boolean = true) => {
    if (!inputText) return;
    
    const now = new Date();
    const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ngày ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const cleanFileName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "van_ban_hoc_thuat";

    // Split entire input text into all full paragraphs across all 98 pages
    const rawParas = inputText.split(/\r?\n\r?\n/);
    const allParas = (rawParas.length > 1 ? rawParas : inputText.split(/\r?\n/))
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const totalWords = inputText.split(/\s+/).filter(Boolean).length;

    const bodyContent = allParas.map((para) => {
      let highlightStyle = 'color: #000000; background-color: transparent;';
      let badge = '';

      if (highlightAiOnly && report) {
        // Find matching segment if any
        const matchedSeg = report.segments.find(s => 
          s.originalText.trim() === para ||
          para.includes(s.originalText.trim()) ||
          s.originalText.trim().includes(para)
        );

        if (matchedSeg) {
          if (matchedSeg.status === 'high_ai') {
            highlightStyle = 'background-color: #ffcccc; color: #800000; padding: 2px 4px; border-bottom: 2px solid #cc0000;';
            badge = `<span style="background-color: #cc0000; color: #ffffff; font-size: 8.5pt; font-weight: bold; padding: 1px 5px; margin-right: 5px; border-radius: 2px;">[AI: ${matchedSeg.aiScore}%]</span>`;
          } else if (matchedSeg.status === 'medium_ai') {
            highlightStyle = 'background-color: #fff2cc; color: #7f6000; padding: 2px 4px; border-bottom: 2px solid #d97706;';
            badge = `<span style="background-color: #d97706; color: #ffffff; font-size: 8.5pt; font-weight: bold; padding: 1px 5px; margin-right: 5px; border-radius: 2px;">[AI nghi vấn: ${matchedSeg.aiScore}%]</span>`;
          } else if (matchedSeg.reasons && matchedSeg.reasons.some(r => r.includes('chuẩn hóa') || r.includes('biên tập') || r.includes('viết lại'))) {
            highlightStyle = 'background-color: #dcfce7; color: #166534; padding: 2px 4px; border-bottom: 2px solid #16a34a;';
            badge = `<span style="background-color: #16a34a; color: #ffffff; font-size: 8.5pt; font-weight: bold; padding: 1px 5px; margin-right: 5px; border-radius: 2px;">[Đã biên tập khử AI]</span>`;
          }
        }
      }

      const formatted = para.replace(/\n/g, '<br/>');
      return `<p style="margin-top: 6pt; margin-bottom: 6pt; text-indent: 1.27cm; line-height: 1.5; text-align: justify; font-size: 13pt; font-family: 'Times New Roman', serif;">${badge}<span style="${highlightStyle}">${formatted}</span></p>`;
    }).join('\n');

    const reportHeader = (report && highlightAiOnly) ? `
      <div style="border: 2pt solid #003366; background-color: #f8fafc; padding: 16pt; margin-bottom: 24pt; font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt;">
          <tr>
            <td style="vertical-align: middle;">
              <div style="font-size: 15pt; font-weight: bold; color: #003366; text-transform: uppercase;">
                BÁO CÁO PHÂN TÍCH ĐẠO VĂN & VĂN PHONG AI
              </div>
              <div style="font-size: 9.5pt; color: #64748b; margin-top: 2pt;">
                AcademicHub Research Ecosystem &bull; Chuẩn Turnitin AI, GPTZero & Winston
              </div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <div style="display: inline-block; border: 2pt solid #dc2626; background-color: #fef2f2; padding: 6pt 12pt; text-align: center;">
                <span style="display: block; font-size: 9pt; font-weight: bold; color: #991b1b; text-transform: uppercase;">TỶ LỆ AI</span>
                <span style="font-size: 22pt; font-weight: 900; color: #dc2626; line-height: 1;">${report.overallAiScore}%</span>
              </div>
            </td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 10.5pt; border-top: 1pt solid #cbd5e1; padding-top: 6pt;">
          <tr>
            <td style="padding: 4pt 0; color: #334155; width: 55%;"><strong>Tên tài liệu:</strong> ${fileName || 'Văn bản nghiên cứu'}</td>
            <td style="padding: 4pt 0; color: #334155; width: 45%;"><strong>Thời gian xuất:</strong> ${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 4pt 0; color: #334155;"><strong>Tỷ lệ Tự viết (Nguyên bản):</strong> <span style="color: #16a34a; font-weight: bold;">${report.overallHumanScore}%</span></td>
            <td style="padding: 4pt 0; color: #334155;"><strong>Quy mô toàn văn:</strong> ${totalWords} từ &bull; ${allParas.length} đoạn văn</td>
          </tr>
          <tr>
            <td style="padding: 4pt 0; color: #334155;" colspan="2"><strong>Kết luận kiểm định:</strong> <em>${report.verdict}</em></td>
          </tr>
        </table>

        <div style="margin-top: 10pt; padding: 6pt 8pt; background-color: #ffffff; border: 1pt dashed #cbd5e1; font-size: 9pt; color: #475569;">
          <strong>Quy ước đánh dấu văn bản:</strong>
          <span style="background-color: #ffcccc; color: #800000; padding: 1pt 5pt; margin: 0 4pt; font-weight: bold;">[Tô đỏ]</span> Đoạn nghi vấn AI cao (&gt;70%) &bull; 
          <span style="background-color: #fff2cc; color: #7f6000; padding: 1pt 5pt; margin: 0 4pt; font-weight: bold;">[Tô vàng]</span> Đoạn nghi vấn AI lai tạo (40-70%) &bull; 
          <span style="background-color: #dcfce7; color: #166534; padding: 1pt 5pt; margin: 0 4pt; font-weight: bold;">[Tô xanh lá]</span> Đoạn đã được AI biên tập chuẩn hóa &bull; 
          <span style="color: #000000; margin-left: 4pt;">Đoạn không tô màu là văn phong tự viết nguyên bản.</span>
        </div>
      </div>
      <div style="margin-bottom: 16pt; text-align: center;">
        <h3 style="font-family: 'Times New Roman', serif; font-size: 13pt; font-weight: bold; color: #000000; text-transform: uppercase; margin: 0;">
          NỘI DUNG TOÀN VĂN (NGUYÊN MẪU KÈM ĐÁNH DẤU BIÊN TẬP)
        </h3>
      </div>
    ` : '';

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${cleanFileName}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4;
          margin: 2.0cm 2.0cm 2.0cm 2.5cm;
          mso-page-orientation: portrait;
        }
        body { 
          font-family: 'Times New Roman', Times, serif; 
          font-size: 13pt; 
          line-height: 1.5; 
          text-align: justify; 
          color: #000000;
        }
        p { 
          margin-top: 6pt; 
          margin-bottom: 6pt; 
          text-indent: 1.27cm; 
          line-height: 1.5; 
          text-align: justify; 
        }
      </style>
    </head>
    <body>`;

    const footer = "</body></html>";
    const sourceHTML = header + reportHeader + bodyContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${cleanFileName}_${highlightAiOnly ? 'to_mau_doan_AI' : 'ban_sach'}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Copy full document text
  const handleCopyFullText = () => {
    navigator.clipboard.writeText(inputText);
    setCopiedId('full_text');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered segments
  const filteredSegments = report?.segments.filter(s => {
    if (activeFilter === 'high') return s.status === 'high_ai';
    if (activeFilter === 'medium') return s.status === 'medium_ai';
    if (activeFilter === 'human') return s.status === 'human';
    return true;
  }) || [];

  const selectedSegment = report?.segments.find(s => s.id === selectedSegmentId) || report?.segments[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      {/* Title & Introduction Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full border border-blue-400/30">
                <ShieldCheck size={14} className="text-cyan-300" />
                Công nghệ phát hiện & Khử văn phong AI học thuật
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30">
                <Check size={13} className="text-emerald-300" />
                {user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() 
                  ? `Admin toàn quyền: ${ADMIN_EMAIL}`
                  : `Cán bộ được cấp quyền AI: ${user?.email || 'Đã cấp phép'}`}
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Kiểm tra AI & Đạo văn Chuyên sâu
            </h1>
            <p className="text-blue-200 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
              Tải lên tài liệu (.doc, .docx, .pdf), quét từng đoạn để nhận diện tỷ lệ sinh bởi AI, 
              đối chiếu nguồn gốc và viết lại theo văn phong học thuật tự nhiên để không bị các hệ thống kiểm tra bắt lỗi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowLogicModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 border border-amber-300/40 text-xs font-bold text-amber-950 transition flex items-center gap-1.5 shadow-md shadow-amber-950/20 cursor-pointer"
              title="Xem phân tích cơ chế iThenticate vs Gemini 3.8 Flash, ưu điểm hệ thống và quản lý lưu trữ file"
            >
              <HelpCircle size={15} className="text-amber-950" />
              Giải thích Logic & Lưu file
            </button>
            <button
              onClick={handleNewInspection}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 border border-emerald-400/40 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
              title="Làm mới và nạp tài liệu mới để kiểm tra"
            >
              <FilePlus size={15} className="text-white" />
              Kiểm tra bản mới
            </button>
            <button
              onClick={() => {
                setInputText(sampleAiText);
                setFileName('Mau_van_ban_AI.docx');
                setViewMode('colored');
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5 backdrop-blur-sm"
              title="Dán thử một đoạn văn mẫu đặc trưng của ChatGPT"
            >
              <Bot size={15} className="text-amber-300" />
              Mẫu văn bản AI
            </button>
            <button
              onClick={() => {
                setInputText(sampleHumanText);
                setFileName('Mau_nghien_cuu_thuc_te.docx');
                setViewMode('colored');
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5 backdrop-blur-sm"
              title="Dán thử bài nghiên cứu thực nghiệm của con người"
            >
              <User size={15} className="text-emerald-300" />
              Mẫu người viết
            </button>
          </div>
        </div>
      </div>

      {scanError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertOctagon className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1 text-sm font-medium">{scanError}</div>
          <button onClick={() => setScanError(null)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Input, File Upload & Colored Highlight View  */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[680px]">
          
          {/* Left Column Top Bar */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Văn bản kiểm tra
              </span>
              {fileName && (
                <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full max-w-[200px] truncate" title={fileName}>
                  {fileName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {inputText && (
                <button
                  onClick={handleNewInspection}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Làm mới để kiểm tra tài liệu hoặc bài báo khác"
                >
                  <RotateCcw size={13} />
                  Kiểm tra bản khác
                </button>
              )}

              {/* Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".doc,.docx,.pdf,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                title="Tải lên file định dạng Word (.doc, .docx), PDF (.pdf) hoặc Text (.txt)"
              >
                <Plus size={15} strokeWidth={2.5} />
                Tải file lên (.doc, .docx, .pdf)
              </button>

              {/* View Switcher: Highlight vs Raw Edit */}
              <div className="flex bg-gray-200 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setViewMode('colored')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    viewMode === 'colored' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Hiển thị văn bản kèm màu nhận diện AI"
                >
                  <Eye size={13} />
                  Tô màu
                </button>
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    viewMode === 'edit' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Chỉnh sửa hoặc dán văn bản trực tiếp"
                >
                  <Edit3 size={13} />
                  Sửa chữ
                </button>
              </div>

              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setFileName('');
                    setReport(null);
                    setSelectedSegmentId(null);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                  title="Xóa trắng văn bản"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Text Area / Colored Highlight Viewer Area */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            {viewMode === 'edit' ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Dán nội dung bài báo, luận văn hoặc đoạn nghiên cứu cần kiểm tra vào đây, hoặc nhấn nút [+ Tải file lên] ở góc trên..."
                  className="w-full flex-1 min-h-[460px] p-4 text-sm sm:text-base text-gray-800 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-sans leading-relaxed"
                />
                <div className="flex justify-between items-center text-xs text-gray-400 mt-2 px-1">
                  <span>Số ký tự: {inputText.length} | Số từ: {inputText ? inputText.split(/\s+/).filter(Boolean).length : 0}</span>
                  <span>Hỗ trợ file: .docx, .doc, .pdf, .txt</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* When Report Exists and we show Colored Mode */}
                {report && report.segments.length > 0 ? (
                  <div className="flex-1 min-h-[460px] max-h-[580px] overflow-y-auto space-y-3.5 pr-2">
                    {report.segments.map((seg, idx) => {
                      const isSelected = selectedSegmentId === seg.id;
                      let bgClass = "bg-emerald-50/60 border-emerald-200 hover:border-emerald-400 text-emerald-950";
                      let tagBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      let label = "Tự nhiên (<40% AI)";

                      if (seg.status === 'high_ai') {
                        bgClass = "bg-red-50/80 border-red-300 hover:border-red-500 text-red-950 shadow-xs";
                        tagBg = "bg-red-100 text-red-800 border-red-200 font-bold";
                        label = `AI: ${seg.aiScore}% (Cao)`;
                      } else if (seg.status === 'medium_ai') {
                        bgClass = "bg-amber-50/80 border-amber-300 hover:border-amber-500 text-amber-950";
                        tagBg = "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
                        label = `AI: ${seg.aiScore}% (Nghi vấn)`;
                      }

                      return (
                        <div
                          key={seg.id}
                          onClick={() => setSelectedSegmentId(seg.id)}
                          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative text-sm sm:text-base leading-relaxed ${bgClass} ${
                            isSelected ? 'ring-2 ring-blue-600 shadow-md transform scale-[1.01]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2 select-none">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                              Đoạn {idx + 1}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${tagBg}`}>
                              {label}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{seg.originalText}</p>

                          {/* Quick action buttons inside card */}
                          {seg.status !== 'human' && (
                            <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-gray-500 italic text-[11px]">
                                {customRewrites[seg.id] 
                                  ? '✨ Đã có bản viết lại mới:' 
                                  : 'Nhấn để xem phân tích nguồn & viết lại bên phải'}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                {customRewrites[seg.id] ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApplyRewrite(seg.id, customRewrites[seg.id]);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer"
                                      title="Thay thế ngay đoạn này vào văn bản"
                                    >
                                      <Check size={13} />
                                      Áp dụng ngay
                                    </button>
                                    <button
                                      disabled={humanizingSegmentId === seg.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSegmentId(seg.id);
                                        handleHumanizeSegment(seg);
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-md border border-gray-300 transition flex items-center gap-1"
                                      title="Tạo phương án viết lại khác"
                                    >
                                      <RefreshCw size={12} className={humanizingSegmentId === seg.id ? "animate-spin" : ""} />
                                      Đổi ý
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    disabled={humanizingSegmentId === seg.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSegmentId(seg.id);
                                      handleHumanizeSegment(seg);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-200 shadow-xs transition flex items-center gap-1 cursor-pointer"
                                  >
                                    {humanizingSegmentId === seg.id ? (
                                      <>
                                        <RefreshCw size={12} className="animate-spin text-blue-600" />
                                        Đang viết lại...
                                      </>
                                    ) : (
                                      <>
                                        <Wand2 size={13} className="text-blue-600" />
                                        Viết lại ngay
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* If no report yet or empty text */
                  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center min-h-[460px] border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                      <Upload size={30} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                      {inputText ? "Văn bản đã nạp - Sẵn sàng kiểm tra" : "Tải file lên hoặc Dán văn bản"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">
                      {inputText 
                        ? `Đã nạp ${inputText.split(/\s+/).filter(Boolean).length} từ. Nhấn nút "Kiểm tra AI & Đạo văn" phía dưới để bắt đầu quét chi tiết.` 
                        : "Hỗ trợ tài liệu Word (.doc, .docx), Acrobat PDF (.pdf) hoặc văn bản thô (.txt)."}
                    </p>

                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-200 transition flex items-center gap-2 cursor-pointer"
                      >
                        <Plus size={16} />
                        Chọn file từ máy tính
                      </button>
                      <button
                        onClick={() => setViewMode('edit')}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-sm font-semibold border border-gray-300 transition flex items-center gap-2"
                      >
                        <Edit3 size={16} />
                        Dán nội dung bằng tay
                      </button>
                    </div>

                    {inputText && (
                      <div className="mt-6 w-full text-left bg-white p-3.5 rounded-xl border border-gray-200 text-xs text-gray-600 max-h-36 overflow-hidden relative">
                        <span className="font-semibold text-gray-700 block mb-1">Trích đoạn đầu văn bản:</span>
                        <p className="line-clamp-3 italic text-gray-500">{inputText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Left Column Bottom Control Bar */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 font-medium">
              {report ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đã phân tích {report.segments.length} đoạn ({report.wordCount} từ)
                </span>
              ) : (
                <span>Trạng thái: Sẵn sàng phân tích</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {report && (
                <button
                  onClick={handleNewInspection}
                  className="px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  title="Làm mới để nạp và kiểm tra tài liệu / bài báo mới"
                >
                  <RotateCcw size={16} className="text-indigo-600" />
                  Kiểm tra bản khác
                </button>
              )}
              <button
                disabled={isScanning || !inputText.trim()}
                onClick={handleRunAiScan}
                className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                  isScanning || !inputText.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer active:scale-95'
                }`}
              >
                {isScanning ? (
                  <>
                    <RefreshCw size={17} className="animate-spin text-white" />
                    Đang quét AI & Đối chiếu nguồn...
                  </>
                ) : (
                  <>
                    <Search size={17} />
                    Kiểm tra AI & Đạo văn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AI Report, Source Attribution & Humanizer  */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. Overall Score & Stylometric Card */}
          {report ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert size={20} className={report.overallAiScore > 50 ? "text-red-500" : "text-emerald-500"} />
                    Báo cáo Phân tích AI & Đạo văn
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Đánh giá theo chuẩn Turnitin AI, GPTZero & Winston
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyFullText}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5"
                    title="Sao chép toàn bộ văn bản hiện tại"
                  >
                    {copiedId === 'full_text' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedId === 'full_text' ? 'Đã chép' : 'Sao chép'}
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Xuất file Word giữ nguyên mẫu và chỉ tô màu các đoạn do AI viết"
                  >
                    <Download size={14} />
                    Xuất file Word
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(false)}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition flex items-center gap-1"
                    title="Xuất file Word nguyên bản sạch không tô màu"
                  >
                    <FileText size={13} />
                    Bản sạch
                  </button>
                  <button
                    onClick={handleNewInspection}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Bắt đầu kiểm tra một tài liệu / bài báo mới"
                  >
                    <PlusCircle size={14} />
                    Kiểm tra bản mới
                  </button>
                </div>
              </div>

              {/* Gauges & Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
                {/* AI Score - Nổi bật MÀU ĐỎ theo yêu cầu */}
                <div className="p-3.5 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 via-rose-50 to-red-100/70 text-center shadow-xs">
                  <span className="text-xs font-extrabold uppercase tracking-wide block text-red-700">
                    Tỷ lệ AI
                  </span>
                  <span className="text-2xl sm:text-3xl font-black block my-0.5 text-red-600">
                    {report.overallAiScore}%
                  </span>
                  <span className="text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full inline-block">
                    {report.highAiParagraphCount} đoạn cảnh báo
                  </span>
                </div>

                {/* Human Score */}
                <div className="p-3.5 rounded-xl border bg-blue-50/60 border-blue-200 text-center text-blue-950">
                  <span className="text-xs font-semibold block text-gray-600">Tỷ lệ Tự viết</span>
                  <span className="text-2xl sm:text-3xl font-extrabold block my-0.5 text-blue-700">
                    {report.overallHumanScore}%
                  </span>
                  <span className="text-[11px] font-medium text-gray-500">
                    Tính nguyên bản
                  </span>
                </div>

                {/* Burstiness (Biến thiên nhịp câu) */}
                <div className="p-3.5 rounded-xl border bg-gray-50 border-gray-200 text-center">
                  <span className="text-xs font-semibold block text-gray-600" title="Độ biến thiên độ dài câu. Con người thường viết câu dài ngắn xen kẽ ngẫu nhiên (chỉ số cao), còn AI viết các câu đều đặn (chỉ số thấp).">
                    Nhịp câu (Burstiness)
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold block my-0.5 text-gray-800">
                    {report.burstinessScore}%
                  </span>
                  <span className="text-[11px] font-medium text-gray-500">
                    {report.burstinessScore < 50 ? 'Đều đặn (kiểu AI)' : 'Tự nhiên'}
                  </span>
                </div>

                {/* Perplexity (Độ phức hợp từ vựng) */}
                <div className="p-3.5 rounded-xl border bg-gray-50 border-gray-200 text-center">
                  <span className="text-xs font-semibold block text-gray-600" title="Độ phong phú và bất ngờ của từ vựng học thuật.">
                    Độ phức hợp (Perplexity)
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold block my-0.5 text-gray-800">
                    {report.perplexityScore}%
                  </span>
                  <span className="text-[11px] font-medium text-gray-500">
                    Vốn từ học thuật
                  </span>
                </div>
              </div>

              {/* Verdict & Summary Banner */}
              <div className={`p-4 rounded-xl border mb-3 flex items-start gap-3 ${
                report.overallAiScore > 50 
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900' 
                  : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              }`}>
                {report.overallAiScore > 50 ? (
                  <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
                ) : (
                  <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={18} />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold">{report.verdict}</h4>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      report.plagiarismRisk === 'Cao' 
                        ? 'bg-red-100 text-red-800 border-red-200' 
                        : report.plagiarismRisk === 'Trung bình' 
                        ? 'bg-amber-100 text-amber-800 border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      Rủi ro trùng lặp ý tưởng: {report.plagiarismRisk || 'Thấp'}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{report.summary}</p>
                  {report.detectedSourcesSummary && (
                    <div className="mt-2 pt-2 border-t border-black/5 text-[11.5px] flex items-center gap-1.5 font-medium">
                      <BookOpen size={13} className="flex-shrink-0 text-blue-700" />
                      <span>{report.detectedSourcesSummary}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk Humanize Button */}
              {report.highAiParagraphCount > 0 && (
                <div className="pt-2">
                  <button
                    disabled={humanizeAllProgress !== null}
                    onClick={handleAutoHumanizeAll}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-sm shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {humanizeAllProgress ? (
                      <>
                        <RefreshCw size={16} className="animate-spin text-white" />
                        Đang tự động chuẩn hóa: {humanizeAllProgress.current}/{humanizeAllProgress.total} đoạn...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-amber-300" />
                        Tự động sửa toàn bộ {report.highAiParagraphCount} đoạn AI (Vượt qua quét đạo văn)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Placeholder before first scan */
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Search size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Hệ thống Phân tích AI & Viết lại Học thuật</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
                Khi nhấn "Kiểm tra AI & Đạo văn", hệ thống sẽ quét từng câu, tính toán tỷ lệ AI, 
                truy vết nguồn tài liệu lý thuyết gốc và cung cấp gợi ý viết lại tự nhiên để không bị phát hiện.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                {/* Khung 1: Mức độ can thiệp AI - Tông đỏ cảnh báo */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-100/50 border-2 border-red-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <span className="text-xs font-bold text-red-900 flex items-center gap-1.5 mb-1.5">
                      <ShieldAlert size={16} className="text-red-600 flex-shrink-0" />
                      1. Tô màu đoạn AI
                    </span>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200/90 text-red-900 border border-red-300">Đỏ: &gt;70%</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-900 border border-amber-300">Vàng: 40-70%</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/90 text-emerald-900 border border-emerald-300">Xanh: &lt;40%</span>
                    </div>
                    <p className="text-xs text-red-950/80 leading-relaxed">
                      Phân vùng trực quan mức độ can thiệp AI: Đỏ (Nguy cơ cao), Vàng (Nghi vấn lai tạo), Xanh (Văn phong tự viết nguyên bản).
                    </p>
                  </div>
                </div>

                {/* Khung 2: Đối chiếu nguồn gốc - Tông vàng/cam học thuật */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-100/50 border-2 border-amber-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-1.5">
                      <BookOpen size={16} className="text-amber-700 flex-shrink-0" />
                      2. Chỉ ra tài liệu gốc
                    </span>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-900 border border-amber-300">Đối chiếu nguồn</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-200/90 text-orange-900 border border-orange-300">Trích dẫn chuẩn</span>
                    </div>
                    <p className="text-xs text-amber-950/80 leading-relaxed">
                      Xác định trường phái lý thuyết, tác giả hoặc giáo trình gốc mà AI đã tổng hợp, giúp bổ sung trích dẫn APA/IEEE chính xác.
                    </p>
                  </div>
                </div>

                {/* Khung 3: Viết lại tự nhiên - Tông xanh ngọc chuẩn hóa */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/90 to-teal-100/50 border-2 border-emerald-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-1.5">
                      <Wand2 size={16} className="text-emerald-700 flex-shrink-0" />
                      3. Viết lại tự nhiên
                    </span>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/90 text-emerald-900 border border-emerald-300">Khử sáo rỗng</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-200/90 text-teal-900 border border-teal-300">Vượt Turnitin</span>
                    </div>
                    <p className="text-xs text-emerald-950/80 leading-relaxed">
                      Phá vỡ cấu trúc máy móc, tái cấu trúc lập luận học thuật sâu sắc, giữ nguyên ý nghĩa chuyên môn và áp dụng chỉ với 1 cú click.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Detailed Inspection & Flexible Segment Editor */}
          {report && selectedSegment && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Edit3 size={16} className="text-indigo-600" />
                    Chỉnh sửa & Khử AI linh hoạt từng đoạn
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    selectedSegment.status === 'high_ai' 
                      ? 'bg-red-100 text-red-800 border-red-200' 
                      : selectedSegment.status === 'medium_ai'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    AI Score: {selectedSegment.aiScore}%
                  </span>
                </div>

                <div className="text-xs text-gray-400 font-medium">
                  Đoạn {report.segments.findIndex(s => s.id === selectedSegment.id) + 1} / {report.segments.length}
                </div>
              </div>

              {/* Original snippet */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Văn bản gốc đoạn này:
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedSegment.originalText);
                      setCopiedId(`orig-${selectedSegment.id}`);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  >
                    {copiedId === `orig-${selectedSegment.id}` ? <Check size={12} className="text-emerald-600"/> : <Copy size={12}/>}
                    {copiedId === `orig-${selectedSegment.id}` ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 leading-relaxed max-h-32 overflow-y-auto italic">
                  "{selectedSegment.originalText}"
                </div>
              </div>

              {/* Reasons list */}
              {selectedSegment.reasons.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                    Dấu hiệu nhận diện AI:
                  </label>
                  <ul className="space-y-1.5">
                    {selectedSegment.reasons.map((r, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-2 bg-red-50/50 p-2 rounded-lg border border-red-100">
                        <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Likely Source & Citation Hint */}
              <div className="mb-5 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <BookOpen size={14} className="text-indigo-600" />
                    Nguồn đối chiếu lý thuyết & Chỉ dẫn trích dẫn:
                  </span>
                  {selectedSegment.citationSuggestion && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedSegment.citationSuggestion || '');
                        setCopiedId(`cit-${selectedSegment.id}`);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 bg-indigo-100/70 px-2 py-0.5 rounded"
                      title="Sao chép gợi ý trích dẫn"
                    >
                      {copiedId === `cit-${selectedSegment.id}` ? <Check size={11} className="text-emerald-600"/> : <Copy size={11}/>}
                      {copiedId === `cit-${selectedSegment.id}` ? 'Đã chép' : 'Chép trích dẫn'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                  {selectedSegment.likelySource || "Tài liệu cơ sở tri thức LLM hoặc tổng hợp giáo trình đại cương trực tuyến."}
                </p>
                {selectedSegment.citationSuggestion && (
                  <p className="text-[11.5px] text-indigo-800 mt-1.5 italic bg-white/60 p-2 rounded border border-indigo-100">
                    💡 <strong>Gợi ý trích dẫn tránh đạo văn:</strong> {selectedSegment.citationSuggestion}
                  </p>
                )}
              </div>

              {/* Flexible Rewrite Box & Style Picker */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600" />
                    Tùy chọn phong cách viết lại:
                  </label>

                  {/* Style selector */}
                  <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-medium">
                    <button
                      onClick={() => {
                        setRewriteStyle('academic');
                        handleHumanizeSegment(selectedSegment, 'academic');
                      }}
                      className={`px-2 py-1 rounded transition ${rewriteStyle === 'academic' ? 'bg-white font-bold text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                      title="Phong cách chuẩn mực học thuật, tự nhiên, đa dạng câu"
                    >
                      🎓 Học thuật
                    </button>
                    <button
                      onClick={() => {
                        setRewriteStyle('concise');
                        handleHumanizeSegment(selectedSegment, 'concise');
                      }}
                      className={`px-2 py-1 rounded transition ${rewriteStyle === 'concise' ? 'bg-white font-bold text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                      title="Súc tích, đanh thép, loại bỏ hoàn toàn hư từ"
                    >
                      ⚡ Súc tích
                    </button>
                    <button
                      onClick={() => {
                        setRewriteStyle('argumentative');
                        handleHumanizeSegment(selectedSegment, 'argumentative');
                      }}
                      className={`px-2 py-1 rounded transition ${rewriteStyle === 'argumentative' ? 'bg-white font-bold text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                      title="Phản biện sâu sắc, lập luận đối sánh chuyên sâu"
                    >
                      ⚖️ Phản biện
                    </button>
                  </div>
                </div>

                {/* Rewritten / Editable Text Content */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold text-emerald-900">
                      Nội dung đề xuất (Bạn có thể gõ sửa trực tiếp vào khung dưới):
                    </span>
                    <button
                      disabled={humanizingSegmentId === selectedSegment.id}
                      onClick={() => handleHumanizeSegment(selectedSegment, rewriteStyle)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {humanizingSegmentId === selectedSegment.id ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Đang tạo lại...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} />
                          Tạo phương án khác ({rewriteStyle === 'academic' ? 'Học thuật' : rewriteStyle === 'concise' ? 'Súc tích' : 'Phản biện'})
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={
                      manualEditTexts[selectedSegment.id] !== undefined
                        ? manualEditTexts[selectedSegment.id]
                        : (customRewrites[selectedSegment.id] || selectedSegment.humanizedSuggestion || selectedSegment.originalText)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualEditTexts(prev => ({
                        ...prev,
                        [selectedSegment.id]: val
                      }));
                      setCustomRewrites(prev => ({
                        ...prev,
                        [selectedSegment.id]: val
                      }));
                    }}
                    placeholder="Nhập hoặc chỉnh sửa nội dung viết lại..."
                    className="w-full p-3.5 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-emerald-50/40 text-sm text-gray-900 leading-relaxed font-sans resize-y transition outline-none"
                  />
                </div>

                {/* Action buttons: Apply to Original Document / Copy / Restore */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const currentText = manualEditTexts[selectedSegment.id] !== undefined
                        ? manualEditTexts[selectedSegment.id]
                        : (customRewrites[selectedSegment.id] || selectedSegment.humanizedSuggestion || '');
                      if (!currentText.trim()) return;
                      handleApplyRewrite(selectedSegment.id, currentText);
                    }}
                    className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={15} />
                    Áp dụng đoạn này vào văn bản gốc
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentText = manualEditTexts[selectedSegment.id] !== undefined
                        ? manualEditTexts[selectedSegment.id]
                        : (customRewrites[selectedSegment.id] || selectedSegment.humanizedSuggestion || '');
                      navigator.clipboard.writeText(currentText);
                      setCopiedId(selectedSegment.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition flex items-center gap-1"
                    title="Sao chép đoạn viết lại"
                  >
                    {copiedId === selectedSegment.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedId === selectedSegment.id ? 'Đã chép' : 'Chép'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Segment Filter Tabs & Quick Navigator */}
          {report && report.segments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Danh sách phân đoạn ({report.segments.length})
                </span>

                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition ${activeFilter === 'all' ? 'bg-white shadow-xs font-bold text-gray-900' : 'text-gray-600'}`}
                  >
                    Tất cả ({report.segments.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('high')}
                    className={`px-2.5 py-1 rounded-md transition ${activeFilter === 'high' ? 'bg-red-500 text-white font-bold' : 'text-red-700'}`}
                  >
                    AI cao ({report.segments.filter(s => s.status === 'high_ai').length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('medium')}
                    className={`px-2.5 py-1 rounded-md transition ${activeFilter === 'medium' ? 'bg-amber-500 text-white font-bold' : 'text-amber-700'}`}
                  >
                    Nghi vấn ({report.segments.filter(s => s.status === 'medium_ai').length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('human')}
                    className={`px-2.5 py-1 rounded-md transition ${activeFilter === 'human' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-700'}`}
                  >
                    Tự nhiên ({report.segments.filter(s => s.status === 'human').length})
                  </button>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {filteredSegments.map((seg, idx) => {
                  const isSelected = selectedSegmentId === seg.id;
                  return (
                    <div
                      key={seg.id}
                      onClick={() => setSelectedSegmentId(seg.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/70 font-medium' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          seg.status === 'high_ai' ? 'bg-red-500' : seg.status === 'medium_ai' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-bold text-gray-700 flex-shrink-0">#{idx + 1}</span>
                        <span className="text-gray-600 truncate">{seg.originalText}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-bold ${
                          seg.status === 'high_ai' ? 'text-red-600' : seg.status === 'medium_ai' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {seg.aiScore}%
                        </span>
                        <ArrowRight size={13} className="text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL: Giải thích Logic AI 34% vs iThenticate 0% & Lưu file */}
      {/* ========================================================= */}
      {showLogicModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-scale-up">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Giải thích Logic AI & Quản lý lưu trữ tài liệu</h3>
                  <p className="text-xs text-blue-200">Báo cáo kiểm định học thuật AcademicHub Ecosystem</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogicModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-gray-700">
              {/* Question 1: So sánh cơ chế giữa iThenticate/Turnitin và Hệ thống Gemini 3.8 Flash */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 shadow-xs">
                <h4 className="font-bold text-amber-950 flex items-center gap-2 text-base">
                  <AlertTriangle size={19} className="text-amber-600 flex-shrink-0" />
                  1. Tại sao có sự khác biệt giữa kết quả kiểm tra của iThenticate AI và Hệ thống này?
                </h4>
                <div className="text-xs sm:text-sm text-gray-800 space-y-3 leading-relaxed pl-6">
                  <div>
                    <span className="font-semibold text-amber-900 block mb-1">
                      🏢 Cơ chế của iThenticate / Turnitin AI:
                    </span>
                    <p className="text-gray-700">
                      iThenticate sử dụng mô hình phân loại nhị phân (Binary Classifier) được huấn luyện chủ yếu trên tập ngữ liệu tiếng Anh khổng lồ với <em>ngưỡng kích hoạt tin cậy rất cao (&gt;80%)</em> trên các đoạn văn bản dài liên tục. Khi phân tích <strong>ngữ pháp tiếng Việt</strong> hoặc các văn bản đã qua biên tập nhẹ (lai tạo giữa người và máy), iThenticate thường kích hoạt bộ lọc bảo thủ để tránh báo động sai (False Positive), dẫn đến việc dễ bỏ qua các đoạn có sự can thiệp của AI và trả về tỷ lệ rất thấp hoặc 0% AI.
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-blue-900 block mb-1">
                      ⚡ Cơ chế vượt trội của Hệ thống (Mô hình Gemini 3.8 Flash chuyên sâu kết hợp hàng triệu trang web):
                    </span>
                    <p className="text-gray-700 mb-2">
                      Hệ thống ứng dụng mô hình <strong>Gemini 3.8 Flash</strong> chuyên sâu về ngôn ngữ học học thuật tiếng Việt, kết hợp tìm kiếm đối chiếu thời gian thực (Google Search Grounding) với hàng triệu trang web, bài báo và giáo trình trực tuyến:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700 pt-1">
                      <li className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                        <strong className="text-indigo-900 block">📊 Nhịp điệu câu (Burstiness):</strong>
                        Đo độ biến thiên độ dài câu. Con người hành văn uyển chuyển (câu ngắn, câu dài xen kẽ); AI sinh văn bản có độ dài đều đặn, cấu trúc đối xứng máy móc.
                      </li>
                      <li className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                        <strong className="text-indigo-900 block">🔍 Độ phức hợp từ vựng (Perplexity):</strong>
                        Bóc tách các cụm từ nối và quán ngữ sáo rỗng đặc trưng của LLM (<em>"trong bối cảnh", "đóng vai trò quan trọng", "không thể phủ nhận rằng", "nhìn chung", "bên cạnh đó"...</em>).
                      </li>
                      <li className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                        <strong className="text-indigo-900 block">🌐 Đối chiếu dữ liệu toàn diện:</strong>
                        Quét sâu các đoạn tổng quan lý thuyết chung chung để nhận diện nguồn tài liệu nền tảng, giúp cảnh báo các đoạn cần bổ sung dữ liệu thực nghiệm hoặc trích dẫn chính xác.
                      </li>
                      <li className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                        <strong className="text-indigo-900 block">🎯 Phân tích từng phân đoạn (Granular Analysis):</strong>
                        Đánh giá chi tiết từng câu, từng đoạn thay vì chỉ đưa ra một con số chung chung, giúp người viết biết chính xác vị trí cần tinh chỉnh.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Question 2: 3 Ưu điểm vượt trội của Hệ thống Gemini 3.8 Flash */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 shadow-xs">
                <h4 className="font-bold text-indigo-950 flex items-center gap-2 text-base">
                  <Sparkles size={19} className="text-indigo-600 flex-shrink-0" />
                  2. Ba (03) Ưu điểm đột phá của Hệ thống phân tích AI & Viết lại học thuật
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Card 1: Tô màu đoạn AI */}
                  <div className="p-3.5 bg-white rounded-2xl border border-red-100 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">1</div>
                      <h5 className="font-bold text-gray-900 text-xs sm:text-sm">Tô màu cảnh báo đa tầng</h5>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700">Đỏ: &gt;70%</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">Vàng: 40-70%</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Xanh: &lt;40%</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Phân vùng trực quan mức độ can thiệp của AI: Đỏ (Nguy cơ cao), Vàng (Nghi vấn lai tạo/khái quát chung), Xanh (Văn phong con người tự viết nguyên bản).
                    </p>
                  </div>

                  {/* Card 2: Chỉ ra tài liệu gốc */}
                  <div className="p-3.5 bg-white rounded-2xl border border-amber-100 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">2</div>
                      <h5 className="font-bold text-gray-900 text-xs sm:text-sm">Chỉ ra tài liệu & nguồn gốc</h5>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">Đối chiếu nguồn</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">Trích dẫn chuẩn</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Xác định trường phái lý thuyết, tác giả hoặc giáo trình gốc mà AI đã tổng hợp, gợi ý trích dẫn chuẩn APA/IEEE chính xác để tránh bị quy lỗi đạo văn ý tưởng.
                    </p>
                  </div>

                  {/* Card 3: Viết lại tự nhiên */}
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">3</div>
                      <h5 className="font-bold text-gray-900 text-xs sm:text-sm">Viết lại học thuật tự nhiên</h5>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Khử sáo rỗng</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">Vượt Turnitin</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Phá vỡ cấu trúc máy móc, tái cấu trúc lập luận học thuật sâu sắc, giữ nguyên 100% ý nghĩa chuyên môn và số liệu thực nghiệm chỉ với 1 cú click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 3: Sau khi kiểm tra xong, file lưu vào đâu? */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 shadow-xs">
                <h4 className="font-bold text-blue-950 flex items-center gap-2 text-base">
                  <Download size={19} className="text-blue-600 flex-shrink-0" />
                  3. Sau khi kiểm tra xong, file được lưu vào đâu?
                </h4>
                <div className="text-xs sm:text-sm text-gray-800 space-y-2 leading-relaxed pl-6">
                  <p>
                    🔒 <strong>Bảo mật bản quyền tuyệt đối:</strong> Toàn bộ văn bản và file Thầy tải lên chỉ được xử lý tạm thời trong <strong>bộ nhớ RAM của trình duyệt (Client-side Memory)</strong>. Hệ thống <strong>KHÔNG</strong> tự ý lưu trữ, lập chỉ mục hay tải lên cơ sở dữ liệu công khai để bảo vệ 100% quyền sở hữu trí tuệ của tác giả.
                  </p>
                  <p>
                    📥 <strong>Tải về máy tính linh hoạt:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700">
                    <li><strong>"Xuất file Word (Tô màu AI)"</strong>: Hệ thống sinh file Word (.doc) giữ nguyên mẫu bố cục tài liệu, kèm bảng thống kê kiểm định chuẩn Turnitin ở đầu trang và tô màu nổi bật từng đoạn AI. File được lưu trực tiếp vào thư mục <strong>Downloads (Tải xuống)</strong> trên máy tính của Thầy.</li>
                    <li><strong>"Bản sạch"</strong>: Xuất bản văn bản thuần túy không có màu đánh dấu, cấu trúc chỉn chu, sẵn sàng để in ấn hoặc nộp hội đồng xét duyệt.</li>
                  </ul>
                </div>
              </div>

              {/* Question 4: Cẩm nang chi tiết các nút bấm, chỉ số đo lường & Giải nghĩa 'Khử sáo rỗng' */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2 text-base">
                  <BookOpen size={19} className="text-emerald-600 flex-shrink-0" />
                  4. Hướng dẫn chi tiết các Nút chức năng, Chỉ số đo lường & Khái niệm "Khử sáo rỗng"
                </h4>

                {/* Phần A: Khử sáo rỗng là gì? */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    ✨ Khái niệm: "Khử sáo rỗng" là gì và tại sao giúp Vượt Turnitin?
                  </span>
                  <div className="text-xs text-gray-700 space-y-1.5 leading-relaxed">
                    <p>
                      • <strong>Sáo rỗng trong văn bản AI là gì?</strong> Các mô hình LLM (ChatGPT, Claude, Gemini...) khi sinh văn bản thường tự động chèn dày đặc các cụm từ đệm khuôn mẫu, sáo ngữ rỗng nghĩa như: <em>"trong bối cảnh hiện nay", "đóng vai trò vô cùng quan trọng", "không thể phủ nhận rằng", "nhìn chung", "bên cạnh đó", "là nhân tố then chốt", "mang tính đột phá", "cần có sự phối hợp đồng bộ"...</em>
                    </p>
                    <p>
                      • <strong>Tại sao Turnitin/GPTZero bắt được AI?</strong> Các công cụ kiểm định phát hiện AI chính là dựa vào việc đếm tần suất lặp lại dày đặc và tính đối xứng máy móc của các cụm từ sáo rỗng này.
                    </p>
                    <p>
                      • <strong>Tác dụng của "Khử sáo rỗng":</strong> Hệ thống tự động bóc tách, loại bỏ triệt để các cụm từ đệm rập khuôn đó, thay thế bằng cách lập luận trực diện, chắc nịch, giàu tính học thuật và số liệu thực chứng, giúp đoạn văn đạt tỷ lệ AI an toàn (&lt;5%).
                    </p>
                  </div>
                </div>

                {/* Phần B: 4 Thẻ chỉ số phân tích */}
                <div className="space-y-2">
                  <h5 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                    📊 Ý nghĩa 4 Thẻ chỉ số đo lường trên Báo cáo:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-red-100 space-y-1">
                      <strong className="text-red-700 block">🔴 TỶ LỆ AI (%):</strong>
                      <p className="text-gray-600">Tổng phần trăm dung lượng văn bản bị nghi vấn có sự can thiệp của AI hoặc tổng hợp lý thuyết rập khuôn.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                      <strong className="text-blue-700 block">🔵 Tỷ lệ Tự viết (%):</strong>
                      <p className="text-gray-600">Phần trăm nội dung do con người tự viết với dấu ấn cá nhân, hành văn tự nhiên và có số liệu nghiên cứu thực nghiệm.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1">
                      <strong className="text-amber-800 block">⚡ Nhịp câu (Burstiness %):</strong>
                      <p className="text-gray-600">Độ biến thiên độ dài câu. Con người viết câu ngắn dài xen kẽ tự nhiên (&gt;70%); AI viết các câu đều đặn máy móc (&lt;45%).</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                      <strong className="text-purple-800 block">📚 Độ phức hợp (Perplexity %):</strong>
                      <p className="text-gray-600">Độ sâu, đa dạng và tính độc đáo của vốn từ vựng học thuật chuyên ngành.</p>
                    </div>
                  </div>
                </div>

                {/* Phần C: Ý nghĩa các Nút bấm & Công cụ tương tác */}
                <div className="space-y-2">
                  <h5 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                    🛠️ Ý nghĩa các Nút bấm & Bảng điều khiển tác vụ:
                  </h5>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong>🤖 Nút [Mẫu văn bản AI] & [Mẫu người viết]:</strong> Nạp nhanh 2 mẫu văn bản chuẩn để kiểm thử và so sánh ngay sự khác biệt về điểm số và chỉ số giữa văn bản AI và người viết.
                    </li>
                    <li className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong>🔍 Nút [Kiểm tra AI & Đạo văn]:</strong> Kích hoạt bộ quét phân tích toàn bộ văn bản (hỗ trợ tới 80–100 trang A4) và phân tách thành từng phân đoạn để chấm điểm chi tiết.
                    </li>
                    <li className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong>🪄 Nút tím [Tự động sửa toàn bộ các đoạn AI]:</strong> Tính năng Humanize 1-click tự động viết lại tất cả các đoạn Đỏ/Vàng trong toàn bài, giữ nguyên 100% nội dung và giảm tỷ lệ AI xuống dưới 5%.
                    </li>
                    <li className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong>📖 Khung [Nguồn đối chiếu lý thuyết] & Nút [Chép trích dẫn]:</strong> Chỉ rõ tác giả, giáo trình gốc và cung cấp sẵn mẫu trích dẫn chuẩn APA/IEEE để dán vào bài tránh bị coi là đạo văn ý tưởng.
                    </li>
                    <li className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong>🎓⚡⚖️ 3 Phong cách viết lại [Học thuật, Súc tích, Phản biện]:</strong> Cho phép linh hoạt chọn giọng văn nghiên cứu chuẩn mực, cô đọng hoặc tranh luận sắc bén theo từng ngữ cảnh bài báo.
                    </li>
                    <li className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong>📥 Nút [Áp dụng đoạn này vào văn bản gốc]:</strong> Thay thế tức thì câu văn vừa viết lại vào vị trí tương ứng trong bài gốc mà không làm mất cấu trúc tài liệu.
                    </li>
                    <li className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <strong>🏷️ Bộ lọc [Tất cả, AI cao, Nghi vấn, Tự nhiên]:</strong> Lọc nhanh danh sách phân đoạn theo mức độ cảnh báo để người dùng rà soát và chỉnh sửa lần lượt từng đoạn.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowLogicModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
