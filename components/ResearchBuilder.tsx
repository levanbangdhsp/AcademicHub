
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Lightbulb, RefreshCw, Upload, PenTool, CheckCircle, ArrowRight, Wand2, BookOpen, Quote, Globe, Cpu, Copy, ArrowLeft, FileDown, Save, User, Clock, Plus, Wrench, ShieldAlert, Download, Edit2, Sparkles, Palette, ClipboardList, Zap, Presentation, MonitorPlay, X, Lock, Table, PlusCircle, MinusCircle, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import { suggestResearchTopics, generatePaperOutline, convertThesisToPaper, IMRaD_Paper, smartWriteSection, paraphraseContent, checkPlagiarism, suggestShortPaperTitle, analyzePaperStyle, StyleGuide, generateSlideContent, SlideItem, DetailedOutline, generateFullPaper, generateSurveyTable, analyzeSurveyData } from '../services/gemini';
import { User as UserType } from '../types';

// URL API Google Script - ENSURE THIS IS THE LATEST DEPLOYED URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyDhpj6MNMkE94akevQCKM6EnwATahQBfm11KGm-2yn5FBp0pYYJqn3Ywt1pLGVQR22w/exec";

// Declare libraries
declare var mammoth: any;
declare var PptxGenJS: any;

const MAJORS = [
  "Lý luận và phương pháp dạy học bộ môn Toán",
  "Lý luận và phương pháp dạy học bộ môn Vật lý",
  "Lý luận và phương pháp dạy học bộ môn Hóa học",
  "Lý luận và phương pháp dạy học bộ môn tiếng Pháp",
  "Lý luận và phương pháp dạy học bộ môn tiếng Trung Quốc",
  "Lý luận và phương pháp dạy học bộ môn tiếng Anh",
  "Lý luận và phương pháp dạy học bộ môn Ngữ văn",
  "Giáo dục học",
  "Giáo dục học (Giáo dục mầm non)",
  "Giáo dục học (Giáo dục tiểu học)",
  "Giáo dục học (Giáo dục thể chất)",
  "Giáo dục học (Giáo dục chính trị)",
  "Quản lý giáo dục",
  "Toán giải tích",
  "Đại số và lý thuyết số",
  "Hình học và tô pô",
  "Vật lý nguyên tử và hạt nhân",
  "Hóa vô cơ",
  "Hóa hữu cơ",
  "Sinh thái học",
  "Địa lý học",
  "Tâm lý học",
  "Khoa học máy tính",
  "Văn học Việt Nam",
  "Văn học nước ngoài",
  "Lý luận văn học",
  "Ngôn ngữ học",
  "Lịch sử Việt Nam",
  "Lịch sử thế giới"
];

const formatDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string') return 'N/A';
  const parts = dateStr.split(' ');
  if (parts.length >= 2) {
      const datePart = parts.find(p => p.includes('/'));
      if (datePart) return datePart;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('vi-VN');
  return dateStr; 
};

interface ResearchBuilderProps {
    cachedProjects?: any[]; 
    initialStudentId?: string;
    onCacheUpdate?: (projects: any[], studentId: string) => void;
    user?: UserType | null;
}

export const ResearchBuilder: React.FC<ResearchBuilderProps> = ({ 
    cachedProjects = [], 
    initialStudentId = '',
    onCacheUpdate,
    user
}) => {
    
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); 
  const [mode, setMode] = useState<'suggest' | 'custom' | 'convert' | 'upload'>('suggest');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studentId, setStudentId] = useState(initialStudentId || '');
  const [myPapers, setMyPapers] = useState<any[]>([]);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [major, setMajor] = useState(MAJORS[0]);
  const [isOtherMajor, setIsOtherMajor] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  
  const [paperData, setPaperData] = useState<IMRaD_Paper>({
      title: '',
      keywords_vi: '',
      abstract: '',
      introduction: '',
      methods: '',
      results: '',
      discussion: '',
      conclusion: '',
      references: '',
      title_en: '',
      abstract_en: '',
      keywords_en: ''
  });

  const [activeSection, setActiveSection] = useState<keyof IMRaD_Paper>('introduction');
  const [uploadText, setUploadText] = useState('');
  const [isWriting, setIsWriting] = useState(false); 
  const [isShorteningTitle, setIsShorteningTitle] = useState(false);

  // Tools states
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState<'slides' | 'plagiarism'>('slides');
  const [slideSource, setSlideSource] = useState<'current' | 'upload'>('current');
  const [slideUploadText, setSlideUploadText] = useState('');
  const [slideResult, setSlideResult] = useState<SlideItem[]>([]);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [slideCount, setSlideCount] = useState<number>(10);
  const [plagiarismResult, setPlagiarismResult] = useState<{score: number, matches: string[]} | null>(null);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [plagiarismText, setPlagiarismText] = useState('');
  const [plagSource, setPlagSource] = useState<'current' | 'upload'>('current');
  const [plagUploadText, setPlagUploadText] = useState('');
  const [isToolParaphrasing, setIsToolParaphrasing] = useState<string | null>(null);
  const [paraphrasedMatches, setParaphrasedMatches] = useState<string[]>([]);
  const [isSyncingText, setIsSyncingText] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [styleGuide, setStyleGuide] = useState<StyleGuide | null>(null);
  const [sampleText, setSampleText] = useState('');
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  // State cho tính năng Bảng số liệu (Results Table) - ADDED
  const [showTableModal, setShowTableModal] = useState(false);
  const [resultTableHtml, setResultTableHtml] = useState<string>(''); // Lưu HTML của bảng
  const [isGeneratingTable, setIsGeneratingTable] = useState(false);
  const [isAnalyzingTable, setIsAnalyzingTable] = useState(false);

  // State cho Modal Xóa dòng
  const [showDeleteRowConfirm, setShowDeleteRowConfirm] = useState(false);
  const [showNoRowSelectedWarning, setShowNoRowSelectedWarning] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Refs cho thao tác bảng
  const editableTableRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);
  const rowToDeleteIndex = useRef<number>(-1);

  // PERMISSION STATE
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
      if (cachedProjects && cachedProjects.length > 0) {
          const papers = cachedProjects.filter(p => p.projectType === 'scientific_paper');
          setMyPapers(papers);
      }
  }, [cachedProjects]);

  // OPTIMIZED USE EFFECT FOR SYNCING TEXT
  // Only runs when modal opens or source changes, NOT when paperData changes
  useEffect(() => {
    if (showToolsModal) {
        if (slideSource === 'current') {
            // Sync slide text ONLY once when modal opens
            const content = `${paperData.title}\n${paperData.abstract}\n${paperData.introduction}\n${paperData.methods}\n${paperData.results}\n${paperData.discussion}`;
            setSlideUploadText(content);
        }

        if (plagSource === 'current') {
            setIsSyncingText(true);
            // Simulate loading for better UX
            const timer = setTimeout(() => {
                // Manually construct full text from current state, no dependency needed
                // This prevents the infinite loop
                const fullText = [
                    `TIÊU ĐỀ: ${paperData.title}`,
                    `TÓM TẮT: ${paperData.abstract}`,
                    paperData.introduction,
                    paperData.methods,
                    paperData.results,
                    paperData.discussion,
                    paperData.conclusion,
                    paperData.references
                ].filter(t => typeof t === 'string' && t.trim() !== "").join('\n\n');
                
                setPlagiarismText(fullText);
                setIsSyncingText(false);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            // FIX: Stop loading immediately if source is not 'current'
            setIsSyncingText(false);
        }
    }
  }, [showToolsModal, plagSource, slideSource]); // Removed paperData from dependencies

  const fetchMyPapers = async () => {
      if (!studentId) return;
      setIsLoadingPapers(true);
      try {
          const response = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: 'getOutlines', studentId: studentId }) });
          const result = await response.json();
          if (result.success && result.outlines) {
              const allProjects = result.outlines;
              const papers = allProjects.filter((p: any) => p.projectType === 'scientific_paper');
              setMyPapers(papers);
              if (onCacheUpdate) {
                  onCacheUpdate(allProjects, studentId);
              }
          } else { setMyPapers([]); alert("Không tìm thấy bài báo nào cho mã học viên này."); }
      } catch (error) { console.error("Lỗi tải bài báo:", error); } finally { setIsLoadingPapers(false); }
  };

  const handleSelectPaper = async (paper: any) => {
      setResultTableHtml(''); // <--- THÊM DÒNG NÀY (Để xóa bảng của bài cũ đi)
      setCurrentPaperId(paper.id);
      
      // Default to empty structure
      let loadedData: IMRaD_Paper = {
          title: paper.topic || '',
          keywords_vi: '', abstract: '', introduction: '', methods: '', results: '', discussion: '', conclusion: '', references: '',
          title_en: '', abstract_en: '', keywords_en: ''
      };

      setIsLoadingPapers(true);

      try {
          // Check if stored on Drive
          if (paper.driveFileId) {
               const response = await fetch(GOOGLE_SCRIPT_URL, {
                  method: "POST",
                  headers: { "Content-Type": "text/plain;charset=utf-8" },
                  body: JSON.stringify({ action: 'getProjectContent', fileId: paper.driveFileId })
              });
              const result = await response.json();
              
              if (result.success && result.data) {
                  // Extract inner data if wrapped
                  const rawData = result.data.outlineData || result.data;
                  // Merge with defaults to ensure all fields exist
                  loadedData = { ...loadedData, ...rawData };
                  
                  // ADDED: Restore table HTML if exists (Check inside the loaded object)
                  if (loadedData.resultTableHtml) {
                      setResultTableHtml(loadedData.resultTableHtml);
                  }
              } else {
                  alert("Không thể tải nội dung từ Drive: " + (result.message || "Lỗi không xác định"));
              }
          } else if (paper.outlineData) {
              // Legacy Fallback (Old Google Sheet storage)
              loadedData = { ...loadedData, ...paper.outlineData };
          }
          
          setPaperData(loadedData);
          setStep(3); 

      } catch (error) {
          console.error("Error loading paper:", error);
          alert("Lỗi kết nối khi tải bài báo.");
      } finally {
          setIsLoadingPapers(false);
      }
  };

  const handleStartNew = () => {
      setCurrentPaperId(null);
      setPaperData({ title: '', keywords_vi: '', abstract: '', introduction: '', methods: '', results: '', discussion: '', conclusion: '', references: '', title_en: '', abstract_en: '', keywords_en: '' });
      setResultTableHtml(''); // Reset table
      setStep(1);
  };

  const handleModeSelect = (selectedMode: 'suggest' | 'custom' | 'convert' | 'upload') => {
      setMode(selectedMode);
      setStep(2);
      setSuggestedTitles([]);
      setMajor(MAJORS[0]);
      setIsOtherMajor(false);
  };

  const handleSuggest = async () => {
      if (!major) return;
      setIsLoading(true);
      try {
          const titles = await suggestResearchTopics(major, keywords);
          setSuggestedTitles(titles);
      } catch (e) { alert("Lỗi khi gợi ý."); } finally { setIsLoading(false); }
  };
  const handleSelectTitle = (title: string) => { setPaperData(prev => ({ ...prev, title })); setStep(3); };

  const handleCreateCustom = async () => {
      if (!paperData.title) return;
      setIsLoading(true);
      try {
          const outline = await generatePaperOutline(paperData.title, paperData.abstract);
          setPaperData(prev => ({ ...prev, ...outline })); 
          setStep(3);
      } catch (e) { alert("Lỗi khi tạo dàn ý bài báo."); } finally { setIsLoading(false); }
  };

  const handleConvertProject = async (project: any) => {
      setIsLoading(true);
      try {
          // 1. Fetch Content first if on Drive
          let projectContentMap = project.outlineData.contentMap || {};
          let projectOutline = project.outlineData;

          if (project.driveFileId) {
              const response = await fetch(GOOGLE_SCRIPT_URL, {
                  method: "POST",
                  headers: { "Content-Type": "text/plain;charset=utf-8" },
                  body: JSON.stringify({ action: 'getProjectContent', fileId: project.driveFileId })
              });
              const result = await response.json();
              if (result.success && result.data) {
                  const fullData = result.data.outlineData || result.data;
                  projectContentMap = fullData.contentMap || {};
                  projectOutline = fullData;
              }
          }

          // 2. Convert
          const result = await convertThesisToPaper(projectOutline, projectContentMap);
          setPaperData(result);
          setStep(3);
      } catch (e) { alert("Lỗi khi chuyển đổi: " + (e as Error).message); } finally { setIsLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          const arrayBuffer = event.target?.result;
          if (arrayBuffer && typeof mammoth !== 'undefined') {
              try { const result = await mammoth.extractRawText({ arrayBuffer }); setUploadText(result.value); } catch (err) { alert("Lỗi đọc file."); }
          }
      }; reader.readAsArrayBuffer(file);
  };
  const handleProcessUpload = async () => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const fileName = fileInput?.files?.[0]?.name.replace('.docx', '') || "Bài báo từ file tải lên";
      setPaperData(prev => ({ ...prev, title: fileName, introduction: uploadText }));
      setStep(3);
  };

  const handleWriteAll = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!paperData.title) { alert("Vui lòng nhập tiêu đề bài báo trước."); return; }
      setIsWriting(true);
      try {
          const result = await generateFullPaper(
              paperData.title, 
              paperData.keywords_vi || "", 
              major, 
              styleGuide || undefined
          );
          setPaperData(prev => ({ ...prev, ...result }));
          alert("Đã viết xong toàn bộ bài báo!");
      } catch (e) {
          alert("Lỗi khi viết toàn bộ: " + (e as Error).message);
      } finally {
          setIsWriting(false);
      }
  };

  const handleAIWrite = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      setIsWriting(true);
      try {
          const currentContent = paperData[activeSection];
          const sectionTitle = activeSection;
          const newContent = await smartWriteSection(paperData.title, sectionTitle, currentContent, [], major || 'Nghiên cứu khoa học', 'scientific_paper', 'Tiếng Việt', styleGuide || undefined);
          setPaperData(prev => ({ ...prev, [activeSection]: newContent }));
      } catch (e) { alert("Lỗi khi AI viết bài."); } finally { setIsWriting(false); }
  };

  const handleShortenTitle = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!paperData.title) return;
      setIsShorteningTitle(true);
      try {
          const shortTitle = await suggestShortPaperTitle(paperData.title);
          if (window.confirm(`Gợi ý tên mới: "${shortTitle}"\n\nBạn có muốn dùng tên này không?`)) {
              setPaperData(prev => ({ ...prev, title: shortTitle }));
          }
      } catch(e) { alert("Lỗi khi rút gọn tên."); } finally { setIsShorteningTitle(false); }
  };

  const handleEditorParaphrase = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      setIsWriting(true);
      try {
          const currentContent = paperData[activeSection];
          if (!currentContent) return;
          const newContent = await paraphraseContent(currentContent);
          setPaperData(prev => ({ ...prev, [activeSection]: newContent }));
      } catch (e) { alert("Lỗi khi paraphrase."); } finally { setIsWriting(false); }
  };

  const handleSavePaper = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!studentId) { const id = prompt("Vui lòng nhập Mã học viên để lưu bài:"); if (id) setStudentId(id); else return; }
      setIsSaving(true);
      try {
          const payload = { 
              action: 'saveOutline', 
              studentInfo: { id: studentId, name: "Research Author", major: major, supervisor: "" }, 
              topic: paperData.title, 
              projectType: 'scientific_paper', 
              outlineData: { 
                  ...paperData, 
                  projectType: 'scientific_paper',
                  resultTableHtml: resultTableHtml // Save table inside outlineData
              }
          };
          const response = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
          const result = await response.json();
          if (result.success) { alert("Đã lưu bài báo thành công!"); if (result.id) setCurrentPaperId(result.id); fetchMyPapers(); } else { alert("Lỗi khi lưu: " + result.message); }
      } catch (error) { alert("Lỗi kết nối server."); } finally { setIsSaving(false); }
  };

  const handleDownloadDoc = () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      const htmlContent = `<html><head><meta charset='utf-8'><title>${paperData.title}</title></head><body><h1>${paperData.title}</h1><br/><div><strong>Tóm tắt:</strong> ${paperData.abstract}</div><div><strong>Từ khóa:</strong> ${paperData.keywords_vi}</div><br/><h2>1. Introduction</h2><p>${paperData.introduction}</p><h2>2. Methods</h2><p>${paperData.methods}</p><h2>3. Results</h2>${resultTableHtml ? `<div class="table-container">${resultTableHtml}</div>` : ''}<p>${paperData.results}</p><h2>4. Discussion</h2><p>${paperData.discussion}</p><h2>5. Conclusion</h2><p>${paperData.conclusion}</p><h2>6. References</h2><p>${paperData.references}</p><br/><hr/><h1>${paperData.title_en}</h1><div><strong>Abstract:</strong> ${paperData.abstract_en}</div><div><strong>Keywords:</strong> ${paperData.keywords_en}</div></body></html>`;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BaiBao_${Date.now()}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- TOOL HANDLERS ---
  const handleCheckPlagiarism = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      const text = plagSource === 'current' ? plagiarismText : plagUploadText; if (!text.trim()) { alert("Vui lòng nhập nội dung."); return; } setIsCheckingPlagiarism(true);
      try { const result = await checkPlagiarism(text); setPlagiarismResult(result); } catch (e) { alert("Lỗi kiểm tra."); } finally { setIsCheckingPlagiarism(false); }
  };

  // UPDATED: FIX LOADING STATE & FILE UPLOAD
  const handleToolFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'plag' | 'import' | 'style' | 'slide') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) { alert("Chỉ hỗ trợ file .docx"); return; }
    
    // Set loading ONLY for plagiarism upload
    if (target === 'plag') setIsSyncingText(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer && typeof mammoth !== 'undefined') {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer });
                if (result.value) { 
                    if (target === 'slide') setSlideUploadText(result.value);
                    else if (target === 'plag') { 
                        setPlagUploadText(result.value); 
                        setPlagiarismText(result.value); // Populate immediately
                    }
                    else if (target === 'style') { setSampleText(result.value); }
                }
            } catch (err) { alert("Lỗi đọc file."); }
            finally {
                // TURN OFF LOADING
                if (target === 'plag') setIsSyncingText(false);
            }
        }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- UPDATED: AUTO REPLACE PARAPHRASED TEXT ---
  const handleToolParaphrase = async (matchText: string) => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      setIsToolParaphrasing(matchText);
      try {
          const rewritten = await paraphraseContent(matchText);
          
          // 1. Update Modal Text
          setPlagiarismText(prev => prev.replace(matchText, rewritten));
          if (plagSource === 'upload') setPlagUploadText(prev => prev.replace(matchText, rewritten));
          
          // 2. Auto Replace in Main Paper Data (Auto-sync)
          if (plagSource === 'current') {
              setPaperData(prev => {
                  const newData = { ...prev };
                  let updated = false;
                  // Loop through all IMRaD sections
                  (Object.keys(newData) as Array<keyof IMRaD_Paper>).forEach(key => {
                      const val = newData[key];
                      if (typeof val === 'string' && val.includes(matchText)) {
                          // Replace the exact match
                          // @ts-ignore
                          newData[key] = val.replace(matchText, rewritten);
                          updated = true;
                      }
                  });
                  return newData;
              });
          }

          navigator.clipboard.writeText(rewritten);
          setParaphrasedMatches(prev => [...prev, matchText]); 
          
          // Alert user
          if (plagSource === 'current') {
            alert(`Đã viết lại và TỰ ĐỘNG CẬP NHẬT vào bài báo!\n\n"${rewritten.substring(0, 50)}..."`);
          } else {
            alert(`Đã viết lại!\n\n"${rewritten.substring(0, 50)}..."`);
          }
          
      } catch (e) { alert("Lỗi viết lại."); } finally { setIsToolParaphrasing(null); }
  };

  const handleDownloadPlagiarismReport = () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!plagiarismResult) return;
      const htmlContent = `<html><head><meta charset='utf-8'><title>Plagiarism Report</title></head><body><h1>BÁO CÁO KIỂM TRA TRÙNG LẶP</h1><p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p><p><strong>Tỷ lệ:</strong> ${plagiarismResult.score}%</p><hr/><h3>NỘI DUNG GỐC:</h3><div>${plagiarismText ? plagiarismText.replace(/\n/g, '<br/>') : ''}</div><hr/><h3>CHI TIẾT:</h3>${(plagiarismResult.matches || []).map((match, i) => `<div><strong>Câu ${i+1}:</strong> "${match}"</div>`).join('')}<p>* Kết quả sơ bộ từ Google Search.</p></body></html>`;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Report_${studentId}.doc`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // NEW: Download Fixed File from Plagiarism Tool
  const handleDownloadFixedFile = () => {
    if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
    if (!plagiarismText.trim()) return;
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Fixed Document</title></head>
        <body>
            ${plagiarismText.replace(/\n/g, '<br/>')}
        </body></html>`;
    
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaiBao_DaSua_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAnalyzeStyle = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!sampleText.trim()) return;
      setIsAnalyzingStyle(true);
      try {
          const guide = await analyzePaperStyle(sampleText);
          setStyleGuide(guide);
          alert("Đã học xong phong cách! Các nội dung AI viết tiếp theo sẽ tuân thủ style này.");
          setShowStyleModal(false);
      } catch (e) {
          alert("Lỗi khi phân tích.");
      } finally {
          setIsAnalyzingStyle(false);
      }
  };

  const handleGenerateSlides = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      setIsGeneratingSlides(true);
      try {
          let topic = paperData.title;
          let contentMap: Record<string, string> = { 
              "Mở đầu": paperData.introduction || "",
              "Phương pháp": paperData.methods || "",
              "Kết quả": paperData.results || "",
              "Bàn luận": paperData.discussion || "",
              "Kết luận": paperData.conclusion || ""
          };
          
          if (slideSource === 'upload') { 
              if (!slideUploadText.trim()) { alert("Vui lòng nhập nội dung."); setIsGeneratingSlides(false); return; } 
              topic = "Tài liệu tải lên"; 
              contentMap = { "Nội dung": slideUploadText }; 
          } 

          const outline: DetailedOutline = { 
              translatedTopic: topic, rationale: "", objectives: { general: "", specific: [] }, objects: "", hypothesis: "", tasks: [], methods: [], expectedProducts: [], structure: [], references: [] 
          };

          const slides = await generateSlideContent(topic, outline, contentMap, slideCount);
          setSlideResult(slides);
      } catch (e) { alert("Lỗi tạo slide."); } finally { setIsGeneratingSlides(false); }
  };

  const handleExportPPTX = () => {
    if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
    if (!slideResult.length || typeof PptxGenJS === 'undefined') return;
    try {
        const pres = new PptxGenJS(); pres.layout = 'LAYOUT_16x9';
        const titleSlide = pres.addSlide(); 
        titleSlide.addText(paperData.title || "Báo cáo", { x: 1, y: 1.5, w: 8, h: 2, fontSize: 32, bold: true, align: 'center', color: '003366' });
        
        slideResult.forEach((slide) => { if (!slide) return; const s = pres.addSlide(); s.addText(slide.title || "Slide", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '003366', border: {pt:0, color:'FFFFFF', bottom:true} }); const bullets = (slide.bullets || []).map((b) => ({ text: b, options: { bullet: true, fontSize: 18, breakLine: true } })); s.addText(bullets, { x: 0.5, y: 1.5, w: 9, h: 4, lineSpacing: 32 }); });
        pres.writeFile({ fileName: `Slide_Paper.pptx` });
    } catch (e) { alert("Lỗi xuất PPTX."); }
  };

  // --- NEW HANDLERS FOR TABLE & ANALYSIS (PHƯƠNG ÁN A) ---
  const handleGenerateTable = async () => {
    setIsGeneratingTable(true);
    try {
        const table = await generateSurveyTable(paperData.title, "Kết quả nghiên cứu", major);
        setResultTableHtml(table);
    } catch (e) {
        alert("Lỗi khi tạo bảng.");
    } finally {
        setIsGeneratingTable(false);
    }
  };

  const handleAnalyzeResultTable = async () => {
    if (user?.role !== 'admin' && !user?.canEdit) { 
        setShowPermissionModal(true); 
        return; 
    }
    if (!resultTableHtml) {
        alert("Bạn chưa tạo bảng số liệu ở mục Results. Vui lòng quay lại mục Results để tạo bảng.");
        return;
    }
    setIsAnalyzingTable(true);
    try {
        // AI đọc bảng và viết phân tích (Gửi kèm Text ở paperData.results)
        const analysis = await analyzeSurveyData(paperData.title, "Bàn luận", resultTableHtml, paperData.results);
        
        // Nối nội dung vào ô Discussion hiện tại
        setPaperData(prev => ({ 
            ...prev, 
            discussion: (prev.discussion || "") + "\n\n[PHÂN TÍCH TỪ SỐ LIỆU]\n" + analysis 
        }));
        alert("Đã thêm phân tích từ số liệu vào mục Discussion!");
    } catch (e) {
        alert("Lỗi phân tích số liệu.");
    } finally {
        setIsAnalyzingTable(false);
    }
  };

  const handleTableFocus = (e: React.FocusEvent<HTMLDivElement>) => {
      let node = e.target as HTMLElement;
      // Traverse up to find TR
      while (node && node.nodeName !== 'TR' && node !== e.currentTarget) {
          node = node.parentElement as HTMLElement;
      }
      
      if (node && node.nodeName === 'TR') {
          activeRowRef.current = node as HTMLTableRowElement;
          
          // Capture index for robust deletion
          if (node.parentElement) {
              rowToDeleteIndex.current = (node as HTMLTableRowElement).rowIndex;

              Array.from(node.parentElement.children).forEach(tr => {
                  tr.classList.remove('selected-row');
                  (tr as HTMLElement).style.backgroundColor = ''; 
              });
          }
          
          // Add highlight to current row
          node.classList.add('selected-row');
          node.style.backgroundColor = '#eff6ff'; // Light blue highlight
      }
  };

  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
      let node = e.target as HTMLElement;
      while (node && node.nodeName !== 'TR' && node !== e.currentTarget) {
          node = node.parentElement as HTMLElement;
      }
      
      if (node && node.nodeName === 'TR') {
          activeRowRef.current = node as HTMLTableRowElement;
          
          // Capture index relative to tbody
          if (node.parentElement) {
              const allRows = Array.from(node.parentElement.children);
              rowToDeleteIndex.current = allRows.indexOf(node);

              allRows.forEach(tr => {
                  tr.classList.remove('selected-row');
                  (tr as HTMLElement).style.backgroundColor = ''; 
              });
          }
          
          node.classList.add('selected-row');
          node.style.backgroundColor = '#eff6ff';
      }
  };

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target.tagName === 'TD') {
        const cell = target as HTMLTableCellElement;
        const row = cell.parentElement as HTMLTableRowElement;
        
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                // Add new row below
                const newRow = row.cloneNode(true) as HTMLTableRowElement;
                Array.from(newRow.children).forEach((td: any) => {
                    // Clear text, keep buttons
                    if (!td.querySelector('button')) td.innerText = '';
                });
                row.insertAdjacentElement("afterend", newRow);
                // Focus first editable cell of new row
                const firstEditable = Array.from(newRow.children).find(td => !td.querySelector('button')) as HTMLElement;
                if (firstEditable) firstEditable.focus();
                break;

            case 'ArrowRight':
                e.preventDefault();
                let next = cell.nextElementSibling as HTMLElement;
                if (next) next.focus();
                break;

            case 'ArrowLeft':
                e.preventDefault();
                let prev = cell.previousElementSibling as HTMLElement;
                if (prev) prev.focus();
                break;

            case 'ArrowUp':
                e.preventDefault();
                const prevRow = row.previousElementSibling as HTMLTableRowElement;
                if (prevRow) {
                    const upCell = prevRow.children[cell.cellIndex] as HTMLElement;
                    if (upCell) upCell.focus();
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                const downRow = row.nextElementSibling as HTMLTableRowElement;
                if (downRow) {
                    const downCell = downRow.children[cell.cellIndex] as HTMLElement;
                    if (downCell) downCell.focus();
                }
                break;
        }
    }
  };

  // --- PERMISSION MODAL ---
  const PermissionModal = () => (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up border-t-4 border-orange-500">
              <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                      <Lock size={32} className="text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Tính năng bị giới hạn</h3>
                  <p className="text-gray-500 mt-2">Bạn cần được cấp quyền <strong>Ghi (Edit)</strong> để sử dụng tính năng cao cấp này và Lưu dữ liệu.</p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <p className="text-sm font-bold text-orange-800 mb-2">Vui lòng liên hệ Admin để duyệt đề cương:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center"><ArrowRight size={14} className="mr-2 text-orange-500"/> Email: <strong>Admin@edu.vn</strong></li>
                      <li className="flex items-center"><ArrowRight size={14} className="mr-2 text-orange-500"/> Điện thoại: <strong>0933686868</strong></li>
                  </ul>
              </div>

              <button 
                  onClick={() => setShowPermissionModal(false)}
                  className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg transition"
              >
                  Đã hiểu
              </button>
          </div>
      </div>
  );

  const renderToolsModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                   <ShieldAlert size={20} className="mr-2 text-red-600"/> Kiểm tra Đạo văn Bài báo
                </h3>
                <button onClick={() => setShowToolsModal(false)} className="hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto bg-white">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h4 className="text-lg font-bold text-gray-800">Quét Trùng lặp (Sơ bộ)</h4>
                        <p className="text-sm text-gray-500">Hệ thống sẽ gộp toàn bộ các mục của bài báo để kiểm tra.</p>
                    </div>
                    {plagiarismResult && (
                        <button onClick={handleDownloadPlagiarismReport} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center">
                            <Download size={14} className="mr-1"/> Tải Báo cáo (.doc)
                        </button>
                    )}
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start shadow-sm">
                    <ShieldAlert className="text-orange-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
                    <div className="text-sm text-orange-800">
                        <strong>Lưu ý quan trọng:</strong> Đây là công cụ <strong>Kiểm tra Sơ bộ (Preliminary Check)</strong> dựa trên dữ liệu công khai trên Internet (Open Web). 
                        <br/>Kết quả này mang tính tham khảo để giúp bạn rà soát lỗi copy-paste cơ bản. Nó <strong>KHÔNG</strong> thay thế được các hệ thống kiểm tra chuyên dụng của Nhà trường (như Turnitin, DoIT).
                    </div>
                </div>
                
                {/* SOURCE SELECTION */}
                <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" checked={plagSource === 'current'} onChange={() => setPlagSource('current')} className="mr-2" />
                            <span className="text-sm font-bold">Nội dung bài báo hiện tại</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" checked={plagSource === 'upload'} onChange={() => { setPlagSource('upload'); setPlagiarismText(plagUploadText); }} className="mr-2" />
                            <span className="text-sm">Tải file .docx bên ngoài</span>
                        </label>
                    </div>

                    {plagSource === 'upload' && (
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <label className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-50 flex items-center">
                                    <Upload size={14} className="mr-2"/> Tải file .docx
                                    <input type="file" accept=".docx" className="hidden" onChange={(e) => handleToolFileUpload(e, 'plag')} />
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(plagiarismText); alert("Đã copy toàn bộ nội dung!"); }}
                                    className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center"
                                    disabled={!plagiarismText}
                                >
                                    <Copy size={14} className="mr-1"/> Copy tất cả
                                </button>
                                <button 
                                    onClick={handleDownloadFixedFile} 
                                    className="bg-green-600 text-white border border-transparent px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center shadow-sm"
                                    disabled={!plagiarismText}
                                >
                                    <FileDown size={14} className="mr-1"/> Tải File đã sửa (.doc)
                                </button>
                            </div>
                        </div>
                    )}

                    {isSyncingText ? (
                        <div className="w-full border p-4 rounded-xl flex flex-col items-center justify-center min-h-[150px] bg-white text-gray-500">
                            <RefreshCw size={24} className="animate-spin mb-2 text-blue-500"/>
                            <span>Đang tổng hợp dữ liệu...</span>
                        </div>
                    ) : (
                        <textarea 
                            value={plagiarismText}
                            onChange={(e) => { setPlagiarismText(e.target.value); if(plagSource === 'upload') setPlagUploadText(e.target.value); }}
                            className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm min-h-[150px] bg-white"
                            placeholder="Nội dung cần kiểm tra sẽ hiện ở đây..."
                            readOnly={plagSource === 'current'} 
                        ></textarea>
                    )}
                    
                    <div className="flex justify-end mt-3">
                        <button 
                            onClick={handleCheckPlagiarism}
                            disabled={isCheckingPlagiarism || !plagiarismText.trim()}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 flex items-center shadow-lg shadow-red-100"
                        >
                            {isCheckingPlagiarism ? <RefreshCw size={18} className="animate-spin mr-2"/> : <ShieldAlert size={18} className="mr-2"/>}
                            Kiểm tra Ngay
                        </button>
                    </div>
                </div>
                
                {plagiarismResult && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
                        <div className={`p-4 border-b flex justify-between items-center ${plagiarismResult.score > 20 ? 'bg-red-50' : 'bg-green-50'}`}>
                            <span className="font-bold text-gray-700">Kết quả phân tích:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${plagiarismResult.score > 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                Trùng lặp khoảng: {plagiarismResult.score}%
                            </span>
                        </div>
                        <div className="p-4">
                            {(plagiarismResult.matches || []).length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-gray-600">Các câu nghi vấn trùng lặp:</p>
                                    {(plagiarismResult.matches || []).map((match, i) => (
                                        <div key={i} className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-100 border-l-4 border-l-red-500">
                                            <span className="text-red-700 font-bold block mb-1">Nghi vấn {i+1}:</span> 
                                            "{match}"
                                            <div className="mt-2 flex justify-end">
                                                <button 
                                                    onClick={() => handleToolParaphrase(match)}
                                                    disabled={isToolParaphrasing === match || paraphrasedMatches.includes(match)}
                                                    className={`text-xs border px-3 py-1 rounded-full font-bold flex items-center transition ${paraphrasedMatches.includes(match) ? "bg-green-100 text-green-700 border-green-200" : "bg-white border-red-300 text-red-600 hover:bg-red-50"}`}
                                                >
                                                    {isToolParaphrasing === match ? <RefreshCw size={12} className="animate-spin mr-1"/> : paraphrasedMatches.includes(match) ? <CheckCircle size={12} className="mr-1"/> : <Wand2 size={12} className="mr-1"/>}
                                                    {isToolParaphrasing === match ? "Đang viết lại..." : paraphrasedMatches.includes(match) ? "Đã sửa" : "AI Viết lại"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-green-600 py-4 font-medium flex items-center justify-center">
                                    <CheckCircle size={20} className="mr-2"/> Không tìm thấy nội dung trùng lặp.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  const renderStyleModal = () => (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
              <div className="bg-purple-50 border-b border-purple-100 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-purple-900 flex items-center">
                      <Palette size={20} className="mr-2"/> Cấu hình Văn phong (Style Transfer)
                  </h3>
                  <button onClick={() => setShowStyleModal(false)} className="hover:bg-purple-100 p-2 rounded-full"><X size={20} className="text-purple-900"/></button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                  <div className="mb-6">
                      <p className="text-gray-600 text-sm mb-4">
                          Bạn muốn bài báo của mình có giọng văn giống một bài mẫu cụ thể? 
                          Hãy dán nội dung hoặc tải file bài báo mẫu vào đây. AI sẽ phân tích và học theo.
                      </p>
                      
                      {styleGuide ? (
                           <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-4">
                               <h4 className="font-bold text-green-800 mb-2 flex items-center"><CheckCircle size={16} className="mr-2"/> AI đã học được phong cách:</h4>
                               <ul className="text-sm text-green-700 space-y-1 list-disc ml-5">
                                   <li><strong>Tone:</strong> {styleGuide.tone}</li>
                                   <li><strong>Trích dẫn:</strong> {styleGuide.citationStyle}</li>
                                   <li><strong>Định dạng:</strong> {styleGuide.formatting}</li>
                                   <li><strong>Từ vựng:</strong> {styleGuide.vocabulary}</li>
                               </ul>
                               <button onClick={()=>setStyleGuide(null)} className="text-xs text-red-500 underline mt-2">Xóa và học lại</button>
                           </div>
                      ) : (
                          <div className="space-y-4">
                               <div className="flex items-center gap-2">
                                    <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-50 flex items-center">
                                        <Upload size={16} className="mr-2"/> Tải bài mẫu (.docx)
                                        <input type="file" accept=".docx" className="hidden" onChange={(e) => handleToolFileUpload(e, 'style')} />
                                    </label>
                                    <span className="text-sm text-gray-500">hoặc dán text:</span>
                                </div>
                                <textarea 
                                    value={sampleText}
                                    onChange={(e) => setSampleText(e.target.value)}
                                    className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-[200px]"
                                    placeholder="Dán đoạn văn bản mẫu (Introduction, Methods...) vào đây..."
                                ></textarea>
                                <button 
                                    onClick={handleAnalyzeStyle}
                                    disabled={isAnalyzingStyle || !sampleText.trim()}
                                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center"
                                >
                                    {isAnalyzingStyle ? <RefreshCw className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                                    {isAnalyzingStyle ? 'Đang phân tích...' : 'Phân tích & Học Style'}
                                </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderDashboard = () => (
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Bài báo Khoa học</h2>
              <p className="text-gray-500 mb-8">Viết, chỉnh sửa và xuất bản các bài báo chuẩn IMRaD.</p>

              {/* SEARCH BAR */}
              <div className="bg-green-50 p-6 rounded-xl border border-green-100 mb-8">
                  <div className="flex gap-4 items-end">
                      <div className="flex-1">
                          <label className="block text-sm font-bold text-green-900 mb-2">Nhập Mã học viên để tải bài cũ:</label>
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  value={studentId} 
                                  onChange={e => setStudentId(e.target.value)} 
                                  onKeyDown={(e) => e.key === 'Enter' && studentId && fetchMyPapers()}
                                  placeholder="VD: HV123456" 
                                  className="flex-1 border p-3 rounded-lg outline-none"
                              />
                              <button onClick={fetchMyPapers} disabled={isLoadingPapers || !studentId} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50">
                                  {isLoadingPapers ? 'Đang tải...' : 'Tìm bài báo'}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              {/* START NEW BUTTON */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-green-400 transition cursor-pointer mb-8" onClick={handleStartNew}>
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3 text-green-600"><Plus size={32}/></div>
                  <h3 className="font-bold text-lg text-gray-800">Viết Bài Báo Mới</h3>
                  <p className="text-sm text-gray-500">Bắt đầu từ ý tưởng, tóm tắt hoặc chuyển đổi từ luận văn</p>
              </div>

              {/* PAPER LIST */}
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Danh sách Bài báo của tôi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myPapers.length > 0 ? myPapers.map(p => (
                      <div key={p.id} onClick={() => handleSelectPaper(p)} className="border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition bg-white relative group">
                          <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Bài báo khoa học</div>
                          <h3 className="font-bold text-lg text-gray-800 mb-2 pr-24 line-clamp-2 group-hover:text-green-700">{p.topic}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-4">
                              <User size={14} className="mr-1"/> {p.studentInfo.name || "Tác giả"}
                          </div>
                          <div className="flex items-center text-xs text-gray-400 mt-4 border-t pt-3">
                              <Clock size={12} className="mr-1"/> Cập nhật: {formatDate(p.createdAt)}
                          </div>
                      </div>
                  )) : (
                      <p className="text-gray-500 italic col-span-2 text-center py-4 bg-gray-50 rounded-lg">Chưa có bài báo nào. Hãy nhập Mã học viên hoặc tạo mới.</p>
                  )}
              </div>
          </div>
      </div>
  );

  const renderSelectionStep = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div onClick={() => handleModeSelect('suggest')} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg cursor-pointer transition group">
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <Lightbulb className="text-blue-600 group-hover:text-white" size={24}/>
              </div>
              <h3 className="font-bold text-lg text-gray-800">Tìm ý tưởng</h3>
              <p className="text-gray-500 text-sm mt-2">Chưa có chủ đề? AI sẽ gợi ý các đề tài nghiên cứu mới nhất.</p>
          </div>

          <div onClick={() => handleModeSelect('custom')} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-lg cursor-pointer transition group">
              <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <PenTool className="text-green-600 group-hover:text-white" size={24}/>
              </div>
              <h3 className="font-bold text-lg text-gray-800">Đã có Tên & Tóm tắt</h3>
              <p className="text-gray-500 text-sm mt-2">Nhập thông tin cơ bản, AI sẽ xây dựng cấu trúc IMRaD chi tiết.</p>
          </div>

          <div onClick={() => handleModeSelect('convert')} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-lg cursor-pointer transition group">
              <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                  <RefreshCw className="text-purple-600 group-hover:text-white" size={24}/>
              </div>
              <h3 className="font-bold text-lg text-gray-800">Chuyển đổi từ Nghiên cứu</h3>
              <p className="text-gray-500 text-sm mt-2">Tự động tóm tắt và chuyển đổi Luận văn/Đề án/Tiểu luận thành Bài báo.</p>
          </div>

          <div onClick={() => handleModeSelect('upload')} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-400 hover:shadow-lg cursor-pointer transition group">
              <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors">
                  <Upload className="text-orange-600 group-hover:text-white" size={24}/>
              </div>
              <h3 className="font-bold text-lg text-gray-800">Tải file có sẵn</h3>
              <p className="text-gray-500 text-sm mt-2">Tải file Word thô, hệ thống hỗ trợ chỉnh sửa và định dạng.</p>
          </div>
      </div>
  );

  const renderInputStep = () => (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => setStep(0)} className="text-gray-700 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center font-bold text-sm transition mb-6">
              <ArrowLeft size={18} className="mr-2"/> Về danh sách
          </button>

          {mode === 'suggest' && (
              <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">Tìm ý tưởng bài báo</h3>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên ngành</label>
                      <select 
                        value={isOtherMajor ? '__OTHER__' : major} 
                        onChange={(e) => {
                            if (e.target.value === '__OTHER__') {
                                setIsOtherMajor(true);
                                setMajor('');
                            } else {
                                setIsOtherMajor(false);
                                setMajor(e.target.value);
                            }
                        }} 
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white mb-2"
                      >
                        {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                        <option value="__OTHER__">Khác (Nhập thủ công)...</option>
                      </select>
                      {isOtherMajor && (
                        <input 
                            type="text" 
                            value={major} 
                            onChange={e => setMajor(e.target.value)} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="Nhập tên chuyên ngành..."
                            autoFocus
                        />
                      )}
                  </div>
                  <input type="text" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="Từ khóa (Tùy chọn)" className="w-full border p-3 rounded-lg"/>
                  <button onClick={handleSuggest} disabled={isLoading || !major} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center">
                      {isLoading ? <RefreshCw className="animate-spin mr-2"/> : null}
                      {isLoading ? 'Đang suy nghĩ...' : 'Gợi ý Tên Bài báo'}
                  </button>
                  {suggestedTitles.length > 0 && (
                      <div className="mt-4 space-y-2">
                          <p className="font-bold text-sm">Chọn một đề tài:</p>
                          {suggestedTitles.map((t, i) => (
                              <div key={i} onClick={()=>handleSelectTitle(t)} className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer text-sm text-blue-900">{t}</div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {mode === 'custom' && (
              <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">Khởi tạo Bài báo</h3>
                  <input type="text" value={paperData.title} onChange={e=>setPaperData({...paperData, title: e.target.value})} placeholder="Tên bài báo" className="w-full border p-3 rounded-lg font-bold"/>
                  <input type="text" value={paperData.keywords_vi} onChange={e=>setPaperData({...paperData, keywords_vi: e.target.value})} placeholder="Từ khóa (4-6 từ, cách nhau dấu phẩy)" className="w-full border p-3 rounded-lg text-sm"/>
                  <textarea value={paperData.abstract} onChange={e=>setPaperData({...paperData, abstract: e.target.value})} placeholder="Tóm tắt (Abstract) - Khoảng 200 từ" className="w-full border p-3 rounded-lg h-32"></textarea>
                  <button onClick={handleCreateCustom} disabled={isLoading || !paperData.title} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold">{isLoading ? 'Đang xây dựng dàn ý...' : 'Bắt đầu Viết'}</button>
              </div>
          )}

          {mode === 'convert' && (
              <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">Chọn Dự án để Chuyển đổi</h3>
                  {cachedProjects.filter(p=>p.projectType !== 'scientific_paper').length > 0 ? (
                      <div className="space-y-3">
                          {cachedProjects.filter(p=>p.projectType !== 'scientific_paper').map(p => (
                              <div key={p.id} onClick={() => handleConvertProject(p)} className="p-4 border rounded-xl hover:shadow-md cursor-pointer transition flex justify-between items-center">
                                  <div>
                                      <h4 className="font-bold text-gray-800">{p.topic}</h4>
                                      <p className="text-xs text-gray-500">Học viên: {p.studentInfo.name}</p>
                                  </div>
                                  <ArrowRight className="text-blue-500"/>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-gray-500 italic">Không tìm thấy dự án nào trong bộ nhớ. Vui lòng tải dự án ở tab "Dự án Học thuật" trước.</p>
                  )}
                  {isLoading && <p className="text-center text-blue-600 font-bold mt-4"><RefreshCw className="inline animate-spin"/> Đang đọc dữ liệu và chuyển đổi...</p>}
              </div>
          )}

          {mode === 'upload' && (
              <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">Tải file bài viết</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <input type="file" accept=".docx" onChange={handleFileUpload} className="mb-4"/>
                      <p className="text-sm text-gray-500">Hỗ trợ file .docx</p>
                  </div>
                  {uploadText && (
                      <div className="p-3 bg-gray-50 rounded text-xs text-gray-600 truncate max-h-20">{uploadText.substring(0, 200)}...</div>
                  )}
                  <button onClick={handleProcessUpload} disabled={!uploadText} className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold disabled:opacity-50">
                      Xử lý và Chỉnh sửa
                  </button>
              </div>
          )}
      </div>
  );

  const renderWorkspaceStep = () => {
      const sections: {id: keyof IMRaD_Paper, label: string}[] = [
          { id: 'introduction', label: '1. Introduction (Mở đầu)' },
          { id: 'methods', label: '2. Methods (Phương pháp)' },
          { id: 'results', label: '3. Results (Kết quả)' },
          { id: 'discussion', label: '4. Discussion (Bàn luận)' },
          { id: 'conclusion', label: '5. Conclusion (Kết luận)' },
          { id: 'references', label: '6. References (Tài liệu tham khảo)' },
          { id: 'title_en', label: 'ENGLISH METADATA (Title, Abstract...)' },
      ];

      return (
          <div className="flex flex-col h-full min-h-[700px]">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <div className="flex items-center flex-1 mr-4">
                      <button onClick={() => setStep(0)} className="mr-4 text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center text-sm font-bold transition flex-shrink-0"><ArrowLeft size={16} className="mr-1"/> Về danh sách</button>
                      <div className="flex-1 flex gap-2">
                          <input type="text" value={paperData.title} onChange={(e) => setPaperData(prev => ({ ...prev, title: e.target.value }))} className="w-full font-bold text-xl text-blue-900 bg-blue-50 border border-blue-100 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-1.5 outline-none transition" placeholder="Nhập tên bài báo..." />
                          <button onClick={handleShortenTitle} disabled={isShorteningTitle || !paperData.title} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-200 flex items-center whitespace-nowrap flex-shrink-0">{isShorteningTitle ? <RefreshCw size={14} className="animate-spin mr-1"/> : <Sparkles size={14} className="mr-1"/>}Rút gọn Tên</button>
                      </div>
                  </div>
                  <div className="flex gap-2 items-center flex-shrink-0">
                      <button onClick={handleWriteAll} disabled={isWriting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow transition disabled:opacity-50">
                          <Zap size={18} className="mr-2"/> 
                          {isWriting ? 'Đang viết toàn bộ...' : 'Viết Toàn bộ'}
                      </button>

                      <button onClick={() => setShowStyleModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white border-transparent px-4 py-2 rounded-lg font-bold flex items-center shadow-purple-200 shadow-sm transition"><Palette size={18} className="mr-2"/> Style</button>
                      <button onClick={() => setShowToolsModal(true)} className="bg-green-600 hover:bg-green-700 text-white border-transparent px-4 py-2 rounded-lg font-bold flex items-center shadow-green-200 shadow-sm transition"><Wrench size={18} className="mr-2"/> Tiện ích</button>
                      <button onClick={handleSavePaper} disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-blue-700 disabled:opacity-70">{isSaving ? <RefreshCw size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>} Lưu</button>
                      <button onClick={handleDownloadDoc} className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-bold flex items-center shadow-sm hover:bg-blue-50 transition"><FileDown size={18} className="mr-2"/> Tải (.doc)</button>
                  </div>
              </div>

              <div className="flex flex-1 gap-6">
                  <div className="w-64 bg-white border border-gray-200 rounded-xl p-2 h-fit">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Cấu trúc bài báo</p>
                      <button onClick={() => setStep(2)} className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 text-gray-700 hover:bg-gray-50 flex items-center"><FileText size={14} className="mr-2"/> Chỉnh sửa Tóm tắt</button>
                      <div className="my-2 border-t border-gray-100"></div>
                      {sections.map(sec => {
                            // 1. Kiểm tra xem mục này đã có nội dung chưa (lớn hơn 20 ký tự)
                            const hasContent = paperData[sec.id] && paperData[sec.id].toString().length > 20;
                            const isActive = activeSection === sec.id;

                            return (
                            <button 
                                key={sec.id} 
                                onClick={() => setActiveSection(sec.id as any)} 
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition flex justify-between items-center ${
                                    isActive 
                                        ? 'bg-blue-600 text-white font-bold' 
                                        : (hasContent ? 'text-green-700 bg-green-50 font-medium' : 'text-gray-700 hover:bg-gray-50')
                                }`}
                            >
                                <span>{sec.label}</span>
                                {/* 2. Hiển thị dấu tick nếu đã có nội dung và không đang chọn (hoặc muốn hiện luôn khi chọn cũng được) */}
                                {hasContent && !isActive && <CheckCircle size={14} className="text-green-600 flex-shrink-0 ml-2" />}
                                {isActive && <span className="text-white text-xs">●</span>} {/* Dấu chấm tròn khi đang chọn */}
                            </button>
                            );
                        })}
                  </div>

                  <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <span className="font-bold text-gray-700">{sections.find(s=>s.id===activeSection)?.label}</span>
                          <div className="flex gap-2">
                              <button onClick={handleAIWrite} disabled={isWriting} className="text-xs bg-white border px-3 py-1.5 rounded hover:bg-blue-50 text-blue-600 font-bold flex items-center disabled:opacity-50">{isWriting ? <RefreshCw size={14} className="animate-spin mr-1"/> : <Wand2 size={14} className="mr-1"/>}{isWriting ? 'Đang viết...' : 'AI Viết tiếp'}</button>
                              <button onClick={handleEditorParaphrase} disabled={isWriting} className="text-xs bg-white border px-3 py-1.5 rounded hover:bg-green-50 text-green-600 font-bold flex items-center disabled:opacity-50" title="Viết lại câu văn"><RefreshCw size={14} className="mr-1"/> Paraphrase</button>
                              
                              {/* Nếu đang ở mục Results -> Hiện nút Tạo Bảng */}
                              {activeSection === 'results' && (
                                  <button onClick={() => setShowTableModal(true)} className="text-xs bg-orange-100 border border-orange-200 px-3 py-1.5 rounded hover:bg-orange-200 text-orange-700 font-bold flex items-center">
                                      <Table size={14} className="mr-1"/> Bảng Số liệu
                                  </button>
                              )}

                              {/* Nếu đang ở mục Discussion -> Hiện nút Phân tích */}
                              {activeSection === 'discussion' && (
                                  <button onClick={handleAnalyzeResultTable} disabled={isAnalyzingTable} className="text-xs bg-purple-100 border border-purple-200 px-3 py-1.5 rounded hover:bg-purple-200 text-purple-700 font-bold flex items-center disabled:opacity-50">
                                      {isAnalyzingTable ? <RefreshCw size={14} className="animate-spin mr-1"/> : <Sparkles size={14} className="mr-1"/>}
                                      Phân tích Số liệu
                                  </button>
                              )}
                          </div>
                      </div>
                      
                      {/* Hiển thị Bảng số liệu ngay trên Textarea nếu đang ở mục Results hoặc Discussion */}
                      {(activeSection === 'results' || activeSection === 'discussion') && resultTableHtml && (
                          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-x-auto max-h-60">
                              <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Dữ liệu Bảng (View Only):</p>
                              <div dangerouslySetInnerHTML={{__html: resultTableHtml}} className="survey-table-view scale-90 origin-top-left"/>
                          </div>
                      )}

                      {activeSection === 'title_en' ? (
                          <div className="flex-1 p-6 overflow-y-auto">
                              <div className="mb-4">
                                  <label className="block text-sm font-bold mb-1 text-gray-700">English Title</label>
                                  <input type="text" value={paperData.title_en} onChange={e=>setPaperData({...paperData, title_en: e.target.value})} className="w-full border p-2 rounded" />
                              </div>
                              <div className="mb-4">
                                  <label className="block text-sm font-bold mb-1 text-gray-700">English Abstract</label>
                                  <textarea value={paperData.abstract_en} onChange={e=>setPaperData({...paperData, abstract_en: e.target.value})} className="w-full border p-2 rounded h-32" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold mb-1 text-gray-700">English Keywords</label>
                                  <input type="text" value={paperData.keywords_en} onChange={e=>setPaperData({...paperData, keywords_en: e.target.value})} className="w-full border p-2 rounded" />
                              </div>
                          </div>
                      ) : (
                          <textarea value={paperData[activeSection] || ''} onChange={(e) => setPaperData({...paperData, [activeSection]: e.target.value})} className="flex-1 p-6 outline-none resize-none text-base leading-relaxed text-gray-800 font-serif" placeholder={`Viết nội dung cho phần ${activeSection}...`}></textarea>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="animate-fade-in p-4">
        {step === 0 && renderDashboard()}
        {step === 1 && <div className="text-center py-8"><div className="flex justify-between items-center mb-6 max-w-4xl mx-auto px-4"><button onClick={() => setStep(0)} className="text-gray-500 hover:text-blue-600 flex items-center text-sm font-bold"><ArrowLeft size={16} className="mr-1"/> Hủy</button></div><h2 className="text-3xl font-bold text-gray-900 mb-2">Viết Bài Báo Khoa Học</h2><p className="text-gray-500 mb-10">Chọn phương thức bắt đầu phù hợp với bạn</p>{renderSelectionStep()}</div>}
        {step === 2 && renderInputStep()}
        {step === 3 && renderWorkspaceStep()}
        {showToolsModal && renderToolsModal()}
        {showStyleModal && renderStyleModal()}
        
        {/* NEW MODAL FOR TABLE INPUT */}
        {showTableModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col relative">
                    
                    <style>{`
                        /* Canh giữa mặc định cho tất cả các ô */
                        .survey-table th, .survey-table td { 
                            text-align: center !important; 
                            vertical-align: middle !important; 
                        }
                        /* Riêng cột thứ 2 (Nội dung) thì canh trái và thụt vào một chút */
                        .survey-table th:nth-child(2), .survey-table td:nth-child(2) { 
                            text-align: left !important; 
                            padding-left: 12px !important;
                        }
                    `}</style>

                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <div className="flex items-center">
                            <Table size={20} className="mr-2 text-orange-600"/>
                            <h3 className="font-bold text-lg text-gray-800">Nhập Số liệu Nghiên cứu</h3>
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={handleGenerateTable} disabled={isGeneratingTable} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-bold flex items-center">
                                {isGeneratingTable ? "Đang tạo..." : "AI Tạo Mẫu Bảng"}
                            </button>

                            <button onClick={() => {
                                 if (user?.role !== 'admin' && !user?.canEdit) { 
                                        setShowPermissionModal(true); 
                                        return; 
                                    }
                                  if (editableTableRef.current) {
                                      const tbody = editableTableRef.current.querySelector('tbody');
                                      if (tbody) {
                                          const lastRow = tbody.lastElementChild;
                                          if (lastRow) {
                                              const newRow = lastRow.cloneNode(true) as HTMLElement;
                                                // Logic mới: Tính số thứ tự tiếp theo
                                                const nextStt = tbody.children.length + 1;
                                                // Xử lý từng ô
                                                Array.from(newRow.children).forEach((cell: any, index: number) => {
                                                    // Giữ nguyên nút xóa (thường ở cột cuối)
                                                    if (cell.querySelector('button')) return;

                                                    // Nếu là cột đầu tiên (index 0) -> Gán số STT
                                                    if (index === 0) {
                                                        cell.innerText = nextStt.toString();
                                                    } else {
                                                        // Các cột còn lại -> Xóa trắng để nhập mới
                                                        cell.innerText = ''; 
                                                    }
                                                });  
                                             newRow.classList.remove('selected-row');
                                              newRow.style.backgroundColor = '';
                                              tbody.appendChild(newRow);
                                          }
                                      }
                                  }
                              }} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 text-sm flex items-center transition">
                                  <PlusCircle size={16} className="mr-1"/> Thêm dòng
                              </button>

                              <button onClick={() => {
                                  if (activeRowRef.current && editableTableRef.current?.contains(activeRowRef.current)) {
                                      rowToDeleteIndex.current = activeRowRef.current.rowIndex;
                                      setShowDeleteRowConfirm(true);
                                  } else {
                                      setShowNoRowSelectedWarning(true);
                                  }
                              }} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 text-sm flex items-center transition">
                                  <MinusCircle size={16} className="mr-1"/> Xóa dòng chọn
                              </button>

                              <button onClick={() => {
                                  if (editableTableRef.current) {
                                    if (user?.role !== 'admin' && !user?.canEdit) { 
                                        setShowPermissionModal(true); 
                                        return; 
                                    }
                                      const updatedHtml = editableTableRef.current.innerHTML;
                                      setResultTableHtml(updatedHtml);
                                      setSaveMessage({ text: "Đã lưu dữ liệu thành công!", type: 'success' });
                                      setTimeout(() => setSaveMessage(null), 3000);
                                  }
                              }} className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 text-sm flex items-center shadow-sm transition hover:scale-105 ml-2">
                                  <Save size={16} className="mr-1"/> Lưu Dữ Liệu
                              </button>

                            <button onClick={() => setShowTableModal(false)} className="hover:bg-gray-200 p-2 rounded-full"><X size={20}/></button>
                        </div>
                    </div>
                    
                    {/* SUCCESS/ERROR BANNER */}
                    {saveMessage && (
                          <div className={`text-center py-2 px-4 text-sm font-bold animate-fade-in ${saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {saveMessage.type === 'success' ? <CheckCircle size={16} className="inline mr-2 -mt-1"/> : <AlertCircle size={16} className="inline mr-2 -mt-1"/>}
                              {saveMessage.text}
                          </div>
                    )}

                    <div className="bg-yellow-50 p-3 text-xs text-center text-yellow-800 border-b border-yellow-100">
                        Click trực tiếp vào ô để nhập số liệu thực tế của bạn. Bấm <strong>Lưu Dữ Liệu</strong> trước khi đóng.
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-white survey-table-container" onKeyDown={handleTableKeyDown} onFocusCapture={handleTableFocus} onClick={handleTableClick}>
                        {resultTableHtml ? (
                            <div 
                                ref={editableTableRef}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                className="survey-table outline-none border p-2 focus:ring-2 focus:ring-blue-100 rounded"
                                dangerouslySetInnerHTML={{__html: resultTableHtml}}
                                // Removed onBlur auto-save to rely on explicit Save button
                            />
                        ) : (
                            <div className="text-center text-gray-400 mt-20">Chưa có bảng. Hãy bấm nút "AI Tạo Mẫu Bảng" ở trên.</div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t bg-gray-50 flex justify-end">
                        <button onClick={() => setShowTableModal(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition">Đóng</button>
                    </div>
                </div>
            </div>
        )}

        {/* DELETE ROW CONFIRMATION MODAL */}
          {showDeleteRowConfirm && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4 animate-fade-in">
                 <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up border-t-4 border-red-500">
                     <div className="flex items-center text-red-600 mb-4">
                         <Trash2 size={32} className="mr-3" />
                         <h3 className="text-xl font-bold">Xác nhận Xóa Dòng</h3>
                     </div>
                     <p className="text-gray-600 mb-6">
                         Bạn có chắc chắn muốn xóa dòng đang chọn không?
                         <br/><span className="text-red-500 text-xs mt-2 block font-medium">Hành động này không thể hoàn tác.</span>
                     </p>
                     <div className="flex justify-end space-x-3">
                         <button onClick={() => setShowDeleteRowConfirm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition">Hủy bỏ</button>
                         <button onClick={() => {
                             if (editableTableRef.current && rowToDeleteIndex.current > -1) {
                                 const allRows = editableTableRef.current.querySelectorAll('tr');
                                 const targetRow = allRows[rowToDeleteIndex.current];
                                 if (targetRow) {
                                     if (allRows.length > 2) {
                                         targetRow.remove();
                                         const updatedHtml = editableTableRef.current.innerHTML;
                                         setResultTableHtml(updatedHtml);
                                         setSaveMessage({ text: "Đã xóa dòng và cập nhật dữ liệu.", type: 'success' });
                                     } else {
                                         setSaveMessage({ text: "Không thể xóa dòng cuối cùng.", type: 'error' });
                                     }
                                 }
                             }
                             setShowDeleteRowConfirm(false);
                             setTimeout(() => setSaveMessage(null), 3000);
                         }} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-lg">Xác nhận Xóa</button>
                     </div>
                 </div>
             </div>
          )}

          {/* NO ROW SELECTED WARNING MODAL */}
          {showNoRowSelectedWarning && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4 animate-fade-in">
                 <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up border-t-4 border-yellow-500">
                     <div className="flex items-center text-yellow-600 mb-4">
                         <AlertTriangle size={32} className="mr-3" />
                         <h3 className="text-xl font-bold">Chưa chọn dòng</h3>
                     </div>
                     <p className="text-gray-600 mb-6">
                         Vui lòng <strong>click chuột vào một ô bất kỳ</strong> trong dòng bạn muốn xóa trước khi nhấn nút.
                     </p>
                     <div className="flex justify-end">
                         <button onClick={() => setShowNoRowSelectedWarning(false)} className="px-6 py-2 rounded-lg bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition shadow-lg">Đã hiểu</button>
                     </div>
                 </div>
             </div>
          )}

        {showPermissionModal && <PermissionModal />}
    </div>
  );
};
