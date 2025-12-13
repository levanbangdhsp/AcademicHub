
import React, { useState, useEffect, useRef } from 'react';
import { Layers, FileText, Presentation, Search, User, Upload, AlertTriangle, Download, ArrowRight, ArrowLeft, CheckCircle, Lightbulb, Sparkles, AlertCircle, Save, FileDown, FileType, FolderOpen, Plus, Clock, ChevronRight, Edit3, RefreshCw, BookOpen, PenTool, X, Copy, Wand2, GraduationCap, LayoutList, CheckSquare, Microscope, Briefcase, Book, FileUp, Globe, Wrench, ShieldAlert, MonitorPlay, ExternalLink, FileType2, Zap, Table, ListChecks, Eye, Printer, Trash2, Minimize2, Maximize2, MoveDown, BarChart2, PlusCircle, MinusCircle, Lock } from 'lucide-react';
import { suggestResearchTopics, checkTopicViability, generateDetailedOutline, refineDetailedOutline, findResearchEvidence, smartWriteSection, reviewThesisLogic, parseOutlineFromText, fixLogicIssue, generateSlideContent, checkPlagiarism, paraphraseContent, DetailedOutline, ResearchEvidence, SlideItem, generateSurveyContent, optimizeSurveyQuestionnaire, generateSurveyTable, analyzeSurveyData } from '../services/gemini';
import { TopicAnalysis, Topic, User as UserType } from '../types';

// URL API Google Script
// const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9G4xd4OhpykI9ctxbQCjuGIFbfisOFiOp7Atf30ddB4j290SVQHJ30jb3p9MxlO67Cg/exec";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyDhpj6MNMkE94akevQCKM6EnwATahQBfm11KGm-2yn5FBp0pYYJqn3Ywt1pLGVQR22w/exec";

// Declare libraries
declare var mammoth: any;
declare var PptxGenJS: any;
declare var jspdf: any;

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

// 5 PROJECT TYPES
const PROJECT_TYPES = [
    { id: 'master_thesis', label: 'Luận văn Thạc sĩ', icon: <Microscope size={24}/>, desc: 'Nghiên cứu hàn lâm (Cao học)' },
    { id: 'graduation_project', label: 'Khóa luận / Đề án Tốt nghiệp', icon: <Briefcase size={24}/>, desc: 'Dành cho Sinh viên năm cuối & Học viên cao học' },
    { id: 'course_project', label: 'Đồ án Môn học', icon: <Layers size={24}/>, desc: 'Giải quyết vấn đề cụ thể' },
    { id: 'essay', label: 'Tiểu luận Môn học', icon: <FileText size={24}/>, desc: 'Bài viết ngắn 10-15 trang' },
    { id: 'assignment', label: 'Bài tập lớn / NCKH', icon: <BookOpen size={24}/>, desc: 'Báo cáo tổng hợp' }
];

const LANGUAGES = [
    { code: 'Tiếng Việt', label: 'Tiếng Việt' },
    { code: 'English', label: 'English' },
    { code: 'Français', label: 'Français' },
    { code: 'Trung Quốc', label: '中文 (Chinese)' }
];

// Helper: Format date
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

// Helper for Labels
const SECTION_LABELS: Record<string, any> = {
  'Tiếng Việt': { 
      rationale: "1. Lý do chọn đề tài", 
      objectives: "2. Mục tiêu nghiên cứu", 
      objectives_gen: "Mục tiêu chung", 
      objectives_spe: "Mục tiêu cụ thể", 
      objects: "3. Đối tượng và Khách thể nghiên cứu", 
      scope: "4. Phạm vi nghiên cứu", // Mới
      hypothesis: "5. Giả thuyết khoa học", 
      tasks: "6. Nhiệm vụ nghiên cứu", 
      methods: "7. Phương pháp nghiên cứu", 
      significance: "8. Ý nghĩa khoa học và thực tiễn", // Mới
      expectedProducts: "9. Sản phẩm dự kiến / Đóng góp mới", // Mới
      structure: "10. Cấu trúc dự kiến", 
      references: "11. Tài liệu tham khảo dự kiến", 
      intro: "MỞ ĐẦU", 
      refs_header: "TÀI LIỆU THAM KHẢO" 
  },
  'English': { 
      rationale: "1. Rationale / Introduction", 
      objectives: "2. Research Objectives", 
      objectives_gen: "General Objective", 
      objectives_spe: "Specific Objectives", 
      objects: "3. Subjects & Object of Study", 
      scope: "4. Scope of Study", // Mới
      hypothesis: "5. Research Hypothesis", 
      tasks: "6. Research Tasks", 
      methods: "7. Research Methodology", 
      significance: "8. Significance of the Study", // Mới
      expectedProducts: "9. Expected Contributions", // Mới
      structure: "10. Proposed Structure", 
      references: "11. References", 
      intro: "INTRODUCTION", 
      refs_header: "REFERENCES" 
  },
  'Français': { 
      rationale: "1. Justification / Introduction", 
      objectives: "2. Objectifs de recherche", 
      objectives_gen: "Objectif général", 
      objectives_spe: "Objectifs spécifiques", 
      objects: "3. Sujets et objet de l'étude", 
      scope: "4. Portée de l'étude", // Mới
      hypothesis: "5. Hypothèse de recherche", 
      tasks: "6. Tâches de recherche", 
      methods: "7. Méthodologie", 
      significance: "8. Importance scientifique et pratique", // Mới
      expectedProducts: "9. Résultats attendus / Contributions", // Mới
      structure: "10. Structure proposée", 
      references: "11. Références", 
      intro: "INTRODUCTION", 
      refs_header: "RÉFÉRENCES" 
  },
  'Trung Quốc': { 
      rationale: "1. 选题理由 / 绪论", 
      objectives: "2. 研究目标", 
      objectives_gen: "总体目标", 
      objectives_spe: "具体目标", 
      objects: "3. 研究对象", 
      scope: "4. 研究范围", // Mới
      hypothesis: "5. 研究假设", 
      tasks: "6. 研究任务", 
      methods: "7. 研究方法", 
      significance: "8. 科学与实践意义", // Mới
      expectedProducts: "9. 预期成果 / 新贡献", // Mới
      structure: "10. 论文结构", 
      references: "11. 参考文献", 
      intro: "绪论", 
      refs_header: "参考文献" 
  }
};

interface Project { id: string; topic: string; studentInfo: { name: string; id: string; major: string; supervisor: string }; outlineData: DetailedOutline; createdAt: string; status: string; projectType?: string; driveFileId?: string; }
interface ThesisBuilderProps { initialProjects?: Project[]; initialStudentId?: string; onCacheUpdate?: (projects: Project[], studentId: string) => void; user?: UserType | null; }

export const ThesisBuilder: React.FC<ThesisBuilderProps> = ({ initialProjects = [], initialStudentId = '', onCacheUpdate, user }) => {
  // --- STATE ---
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [myProjects, setMyProjects] = useState<Project[]>(
    initialProjects.filter((p: any) => ['master_thesis', 'graduation_project', 'course_project', 'essay', 'assignment'].includes(p.projectType))
    );
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<0 | 1 | 2 | 3 | 4>(0); 
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectType, setProjectType] = useState<string>('master_thesis');
  const [language, setLanguage] = useState<string>('Tiếng Việt');
  const [refinementRequest, setRefinementRequest] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [activeChapter1Section, setActiveChapter1Section] = useState<string>('');
  const [chapter1Content, setChapter1Content] = useState<string>('');
  const [chapterContentMap, setChapterContentMap] = useState<Record<string, string>>({});
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [researchResults, setResearchResults] = useState<ResearchEvidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<ResearchEvidence[]>([]);
  const [isSearchingEvidence, setIsSearchingEvidence] = useState(false);
  const [isWritingSection, setIsWritingSection] = useState(false);
  const [reviewResult, setReviewResult] = useState<{issues: string[], overall: string} | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isFixingIssue, setIsFixingIssue] = useState<string | null>(null);
  const [fixedIssues, setFixedIssues] = useState<string[]>([]);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState<'slides' | 'plagiarism'>('slides');
  const [slideSource, setSlideSource] = useState<'current' | 'upload'>('current');
  const [slideUploadText, setSlideUploadText] = useState('');
  const [slideResult, setSlideResult] = useState<SlideItem[]>([]);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [slideCount, setSlideCount] = useState<number>(10);
  const [plagSource, setPlagSource] = useState<'current' | 'upload'>('current');
  const [plagUploadText, setPlagUploadText] = useState('');
  const [plagiarismText, setPlagiarismText] = useState('');
  const [plagiarismResult, setPlagiarismResult] = useState<{score: number, matches: string[]} | null>(null);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [isParaphrasing, setIsParaphrasing] = useState<string | null>(null);
  const [paraphrasedMatches, setParaphrasedMatches] = useState<string[]>([]);
  const [isSyncingText, setIsSyncingText] = useState(false);
  // NEW STATE FOR RECURSIVE WRITE
  const [isRecursiveWriting, setIsRecursiveWriting] = useState(false);
  // NEW STATE FOR SURVEY
  const [activeRightTab, setActiveRightTab] = useState<'research' | 'survey'>('research');
  const [surveyMap, setSurveyMap] = useState<Record<string, string>>({}); // section -> html
  const [isGeneratingSurvey, setIsGeneratingSurvey] = useState(false);
  const [surveyPreview, setSurveyPreview] = useState<string | null>(null); // For modal view
  const [optimizingSurvey, setOptimizingSurvey] = useState<string | null>(null); // For optimize loading
  const [isCompactSurveyView, setIsCompactSurveyView] = useState(false); // NEW: Toggle View Mode
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null); // For delete confirmation modal
  const [isAnalyzingData, setIsAnalyzingData] = useState<string | null>(null);
  // NEW STATE FOR SURVEY EDITING
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [showDeleteRowConfirm, setShowDeleteRowConfirm] = useState(false); // Modal xác nhận xóa dòng
  const [showNoRowSelectedWarning, setShowNoRowSelectedWarning] = useState(false); // Modal cảnh báo chưa chọn dòng
  
  // PERMISSION STATE
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editableTableRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);
  const rowToDeleteIndex = useRef<number>(-1); // NEW: Track row index to survive re-renders
  const [previewSection, setPreviewSection] = useState<string | null>(null);

  const [studentInfo, setStudentInfo] = useState({ name: '', id: initialStudentId, major: MAJORS[0], supervisor: '' });
  const [isOtherMajor, setIsOtherMajor] = useState(false);
  const [topicPath, setTopicPath] = useState<'suggest' | 'custom' | null>(null);
  const [keywords, setKeywords] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState(''); 
  const [viabilityData, setViabilityData] = useState<TopicAnalysis | null>(null);
  const [duplicateResults, setDuplicateResults] = useState<Topic[]>([]);
  const [outlineData, setOutlineData] = useState<DetailedOutline | null>(null);

  // Refs for navigation in Step 0
  const nameRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const majorRef = useRef<HTMLSelectElement>(null);
  const otherMajorRef = useRef<HTMLInputElement>(null);
  const supervisorRef = useRef<HTMLInputElement>(null);
  const langRef = useRef<HTMLSelectElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const focusNext = (nextRef: React.RefObject<HTMLElement>) => {
      if(nextRef.current) nextRef.current.focus();
  };

  useEffect(() => {
    if (showToolsModal) {
       setSlideResult([]); setPlagiarismResult(null);
       if (slideSource === 'current') setSlideUploadText(chapter1Content);
       if (plagSource === 'current') setPlagiarismText(chapter1Content);
    }
  }, [showToolsModal, chapter1Content]);

  useEffect(() => {
      if (activeToolTab === 'plagiarism' && plagSource === 'current') {
          setIsSyncingText(true);
          const timer = setTimeout(() => {
              let fullDraft = "";
              if (outlineData && outlineData.structure) {
                  const allTexts = outlineData.structure.map(section => {
                      if (section === activeChapter1Section) return chapter1Content;
                      return chapterContentMap[section] || "";
                  });
                  fullDraft = allTexts.filter(t => typeof t === 'string' && t.trim() !== "").join("\n\n");
              } else { fullDraft = chapter1Content; }
              setPlagiarismText(fullDraft);
              setIsSyncingText(false);
          }, 800);
          return () => clearTimeout(timer);
      }
  }, [activeToolTab, plagSource, chapter1Content, chapterContentMap, activeChapter1Section, outlineData]);

  const fetchMyProjects = async (studentId: string) => {
      if (!studentId) return;
      setIsLoadingProjects(true);
      try {
          const response = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: 'getOutlines', studentId: studentId }) });
          const result = await response.json();
          if (result.success && result.outlines) {
              // FILTER PROJECTS HERE
              const thesisProjects = result.outlines.filter((p: any) => ['master_thesis', 'graduation_project', 'course_project', 'essay', 'assignment'].includes(p.projectType));
              setMyProjects(thesisProjects);
              if (onCacheUpdate) onCacheUpdate(result.outlines, studentId);
          } else {
              setMyProjects([]); if (onCacheUpdate) onCacheUpdate([], studentId); 
          }
      } catch (error) { console.error("Lỗi tải projects:", error); } finally { setIsLoadingProjects(false); }
  };

  // --- UPDATED: AUTO FILL CONTENT MAP WHEN SELECTING/GENERATING ---
  const handleSelectProject = async (project: Project) => {
      setCurrentProjectId(project.id); setStudentInfo(project.studentInfo); setSelectedTopic(project.topic);
      const savedType = project.projectType || project.outlineData?.projectType || 'master_thesis';
      setProjectType(savedType);
      
      let loadedOutline = project.outlineData;
      
      if (project.driveFileId) {
          setLoading(true);
          try {
               const response = await fetch(GOOGLE_SCRIPT_URL, {
                  method: "POST",
                  headers: { "Content-Type": "text/plain;charset=utf-8" },
                  body: JSON.stringify({ action: 'getProjectContent', fileId: project.driveFileId })
              });
              const result = await response.json();
              if (result.success && result.data) {
                  loadedOutline = result.data.outlineData || result.data;
                  // Merge contentMap if exists
                  setChapterContentMap(prev => ({
                      ...prev,
                      ...(loadedOutline.contentMap || {})
                  }));
                  setSurveyMap(loadedOutline.surveyMap || {});
              } else {
                  alert("Không thể tải nội dung chi tiết: " + result.message);
                  setOutlineData(project.outlineData); 
              }
          } catch (e) { console.error(e); setOutlineData(project.outlineData); } finally { setLoading(false); }
      } else {
          // Legacy: Load from object
          if (project.outlineData.contentMap) {
              setChapterContentMap(prev => ({
                  ...prev, 
                  ...project.outlineData.contentMap
              }));
          }
          if (project.outlineData.surveyMap) setSurveyMap(project.outlineData.surveyMap);
      }
      
      setOutlineData(loadedOutline);
      setSetupStep(3); setView('wizard');
  };

  const handleCreateNew = () => {
      setCurrentProjectId(null); setSelectedTopic(''); setOutlineData(null); setViabilityData(null); setTopicPath(null); setSuggestedTopics([]); setRefinementRequest(''); setProjectType('master_thesis'); setIsOtherMajor(false); setDuplicateResults([]);
      setChapter1Content(''); setActiveChapter1Section(''); setChapterContentMap({}); setSearchTags([]); setResearchResults([]); setSelectedEvidence([]); setReviewResult(null); setSlideResult([]); setPlagiarismResult(null); setSlideSource('current'); setPlagSource('current'); setSlideCount(10); setFixedIssues([]); setParaphrasedMatches([]);
      setSurveyMap({}); 
      setSetupStep(0); setView('wizard');
  };

  const handleNameBlur = () => { if (!studentInfo.name) return; const normalized = studentInfo.name.trim().replace(/\s+/g, ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); setStudentInfo(prev => ({ ...prev, name: normalized })); };
  const handleSuggestTopics = async () => { if (!studentInfo.major) return; setLoading(true); try { const topics = await suggestResearchTopics(studentInfo.major, keywords); setSuggestedTopics(topics); } catch (e) { alert("Lỗi khi gợi ý."); } finally { setLoading(false); } };
  
  const handleCheckTopic = async () => {
    if (!selectedTopic) return; setLoading(true); setDuplicateResults([]);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, { 
          method: "POST", 
          headers: { "Content-Type": "text/plain;charset=utf-8" }, 
          body: JSON.stringify({ action: 'getTopics' }) 
      });
      const result = await response.json();
      const sheetDataRows = result.data || result.rows || [];
      const duplicates: Topic[] = [];
      if (sheetDataRows.length > 0) {
          const inputLower = selectedTopic.toLowerCase();
          sheetDataRows.forEach((row: any, idx: number) => {
              if (row.TENDETAI || row.tendetai) {
                  const dbTopic = row.TENDETAI || row.tendetai;
                  const dbTopicLower = dbTopic.toLowerCase();
                  if (dbTopicLower.includes(inputLower) || inputLower.includes(dbTopicLower)) {
                      duplicates.push({ id: idx, name: dbTopic, author: row.MSHV || row.mshv || 'Unknown', score: row.DIEM_BV ? parseFloat(row.DIEM_BV) : null, date: row.NGAYBAOVE || null, status: 'Đã bảo vệ', field: row.LINHVUC || 'Chưa phân loại' });
                  }
              }
          });
      }
      setDuplicateResults(duplicates);
      const analysis = await checkTopicViability(selectedTopic); setViabilityData(analysis); setSetupStep(2); 
    } catch (e) { alert("Lỗi khi kiểm tra."); } finally { setLoading(false); }
  };

  // --- UPDATED: GENERATE OUTLINE & AUTO FILL ---
  const handleGenerateOutline = async () => { 
      if (!selectedTopic || !studentInfo.major) return; 
      setLoading(true); 
      try { 
          const outline = await generateDetailedOutline(selectedTopic, studentInfo.major, projectType, language); 
          setOutlineData(outline);
          
          // AUTO-FILL LOGIC
          const newContentMap: Record<string, string> = {};
          const labels = SECTION_LABELS[language] || SECTION_LABELS['Tiếng Việt'];

          // Normalize helper
          const normalize = (str: string) => {
              if (!str) return "";
              return str.toLowerCase()
                  .replace(/^[\d.]+\s*/, '') // Remove leading numbers
                  .replace(/[.,:;!?]/g, '')  // Remove punctuation
                  .trim();
          };

          // Helper to find structure item based on keyword list
          const findItem = (keywords: string[]) => {
              return outline.structure.find(s => {
                  const normS = normalize(s);
                  return keywords.some(k => normS.includes(k));
              });
          };

          // 1. Rationale
          const rationaleItem = findItem(["lý do", "rationale", "justification"]);
          if (rationaleItem && outline.rationale) newContentMap[rationaleItem] = outline.rationale;

          // 2. Objectives
          const objItem = findItem(["mục tiêu", "mục đích", "objectives", "objectif"]);
          if (objItem && outline.objectives?.general) {
              let text = `**${labels.objectives_gen}:** ${outline.objectives.general}\n\n**${labels.objectives_spe}:**\n`;
              outline.objectives.specific.forEach(s => text += `- ${s}\n`);
              newContentMap[objItem] = text;
          }

          // 3. Objects (Fixed: use root keywords)
          const objectsItem = findItem(["đối tượng", "khách thể", "phạm vi", "subjects", "scope", "objets"]);
          if (objectsItem && outline.objects) newContentMap[objectsItem] = outline.objects;

          // 4. Hypothesis (Fixed: use root keywords)
          const hypoItem = findItem(["giả thuyết", "hypothesis", "hypothèse"]);
          if (hypoItem && outline.hypothesis) newContentMap[hypoItem] = outline.hypothesis;

          // 5. Tasks (Added)
          const tasksItem = findItem(["nhiệm vụ", "tasks", "tâches"]);
          if (tasksItem && outline.tasks && outline.tasks.length > 0) {
              // Convert array to bullet list string
              newContentMap[tasksItem] = outline.tasks.map(t => `- ${t}`).join('\n');
          }

          // 6. Methods (Added)
          const methodsItem = findItem(["phương pháp", "methods", "méthodes"]);
          if (methodsItem && outline.methods && outline.methods.length > 0) {
              // Convert array to bullet list string
              newContentMap[methodsItem] = outline.methods.map(m => `- ${m}`).join('\n');
          }
          // 7. Scope (Phạm vi - Mới)
          const scopeItem = findItem(["phạm vi", "scope", "giới hạn", "limitations"]);
          if (scopeItem && outline.scope) newContentMap[scopeItem] = outline.scope;

          // 8. Significance (Ý nghĩa - Mới)
          const sigItem = findItem(["ý nghĩa", "significance", "đóng góp", "contribution", "thực tiễn"]);
          if (sigItem && outline.significance) newContentMap[sigItem] = outline.significance;

          // 9. Expected Products (Sản phẩm - Mới)
          const prodItem = findItem(["sản phẩm", "product", "kết quả", "đóng góp mới"]);
          if (prodItem && outline.expectedProducts && outline.expectedProducts.length > 0) {
               newContentMap[prodItem] = outline.expectedProducts.map((p:string) => `- ${p}`).join('\n');
          }
          setChapterContentMap(prev => ({ ...prev, ...newContentMap }));
          setSetupStep(3); 
      } catch (e) { 
          alert("Lỗi khi tạo đề cương."); 
      } finally { 
          setLoading(false); 
      } 
  };
  
  const handleRefineOutline = async () => { if (!outlineData || !refinementRequest.trim()) return; setIsRefining(true); try { const newOutline = await refineDetailedOutline(outlineData, refinementRequest); setOutlineData(newOutline); setRefinementRequest(''); alert("Đã cập nhật!"); } catch (e) { alert("Lỗi khi chỉnh sửa."); } finally { setIsRefining(false); } };
  const handleToolFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'slide' | 'plag' | 'import') => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) { alert("Chỉ hỗ trợ file .docx"); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer && arrayBuffer instanceof ArrayBuffer && typeof mammoth !== 'undefined') {
            try { const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer }); if (result.value) { if (target === 'slide') setSlideUploadText(result.value); else if (target === 'plag') { setPlagUploadText(result.value); setPlagiarismText(result.value); } else if (target === 'import') setImportText(result.value); } } catch (error) { alert("Lỗi đọc file."); }
        }
    }; reader.readAsArrayBuffer(file);
  };
  const handleImportOutline = async () => { if (!importText.trim()) return; setIsImporting(true); try { const newOutline = await parseOutlineFromText(importText); setOutlineData(newOutline); setShowImportModal(false); setImportText(''); alert("Cập nhật thành công!"); } catch (e) { alert("Lỗi khi đọc dữ liệu."); } finally { setIsImporting(false); } };

  const handleSectionSelect = (newSection: string) => {
    if (activeChapter1Section === newSection) return;
    if (activeChapter1Section) { setChapterContentMap(prev => ({ ...prev, [activeChapter1Section]: chapter1Content })); }
    setChapter1Content(chapterContentMap[newSection] || ''); setActiveChapter1Section(newSection); setSearchTags([]); setResearchResults([]);
    setSelectedEvidence([]); 
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setChapter1Content(e.target.value); };
  const handleAddSearchTag = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && currentTagInput.trim()) { e.preventDefault(); if (!searchTags.includes(currentTagInput.trim())) { setSearchTags([...searchTags, currentTagInput.trim()]); } setCurrentTagInput(''); } };
  const handleRemoveTag = (tag: string) => { setSearchTags(searchTags.filter(t => t !== tag)); };
  const handleFindEvidence = async () => { if (searchTags.length === 0) return; setIsSearchingEvidence(true); try { const results = await findResearchEvidence(searchTags); setResearchResults(results); } catch (e) { alert("Lỗi tìm kiếm."); } finally { setIsSearchingEvidence(false); } };
  const toggleEvidenceSelection = (evidence: ResearchEvidence) => { const exists = selectedEvidence.find(e => e.source === evidence.source && e.author === evidence.author); if (exists) setSelectedEvidence(selectedEvidence.filter(e => e !== exists)); else setSelectedEvidence([...selectedEvidence, evidence]); };
  
  const handleInsertCitation = (evidence: ResearchEvidence) => {
    const citationText = ` [${evidence.author}, ${evidence.year}]`;
    if (textareaRef.current) { const start = textareaRef.current.selectionStart; const end = textareaRef.current.selectionEnd; const text = chapter1Content; const newText = text.substring(0, start) + citationText + text.substring(end, text.length); setChapter1Content(newText); setTimeout(() => { if (textareaRef.current) { textareaRef.current.focus(); textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + citationText.length; } }, 0); } else { setChapter1Content(prev => prev + citationText); }
  };

  const handleSmartWrite = async () => { 
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!activeChapter1Section) return; 
      setIsWritingSection(true); 
      try { 
          const generatedContent = await smartWriteSection(selectedTopic, activeChapter1Section, chapter1Content, selectedEvidence, studentInfo.major, projectType, language); 
          setChapter1Content(generatedContent); 
      } catch (error) { 
          alert("Lỗi khi viết bài."); 
      } finally { 
          setIsWritingSection(false); 
      } 
  };
  
  const handleRecursiveWrite = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!activeChapter1Section || !outlineData) return;
      setIsRecursiveWriting(true);
      try {
          const structure = outlineData.structure || [];
          const currentIndex = structure.findIndex(s => s === activeChapter1Section);
          if (currentIndex === -1) return;
          
          const currentTitleLower = activeChapter1Section.toLowerCase();
          const isBigChapter = currentTitleLower.startsWith('chương') || currentTitleLower.startsWith('chapter') || currentTitleLower.startsWith('phần');
          
          const sectionsToWrite: string[] = [activeChapter1Section];
          
          for (let i = currentIndex + 1; i < structure.length; i++) {
              const nextSection = structure[i];
              const nextLower = nextSection.toLowerCase();
              const nextIsBig = nextLower.startsWith('chương') || nextLower.startsWith('chapter') || nextLower.startsWith('phần') || nextLower.startsWith('kết luận') || nextLower.startsWith('conclusion') || nextLower.startsWith('mở đầu');
              
              if (isBigChapter) {
                  if (nextIsBig) break;
                  sectionsToWrite.push(nextSection);
              } else {
                   if (nextIsBig) break;
                   sectionsToWrite.push(nextSection);
              }
          }
          
          if (sectionsToWrite.length > 1 && !window.confirm(`Bạn có muốn AI tự động viết liên tiếp cho ${sectionsToWrite.length} mục (từ "${activeChapter1Section}" đến "${sectionsToWrite.length-1}") không?`)) {
              setIsRecursiveWriting(false);
              return;
          }

          for (const section of sectionsToWrite) {
              setActiveChapter1Section(section);
              const currentText = section === activeChapter1Section ? chapter1Content : (chapterContentMap[section] || "");
              if (currentText && currentText.length > 200) { continue; }
              setChapter1Content(currentText);
              const generated = await smartWriteSection(selectedTopic, section, currentText, selectedEvidence, studentInfo.major, projectType, language);
              setChapter1Content(generated);
              setChapterContentMap(prev => ({ ...prev, [section]: generated }));
              await new Promise(r => setTimeout(r, 1000));
          }
          alert("Đã hoàn thành viết tự động cho phần này!");
      } catch (error) { alert("Đã xảy ra lỗi trong quá trình viết tự động (có thể do quá tải). Vui lòng thử lại."); } finally { setIsRecursiveWriting(false); }
  };

  const handleReviewLogic = async () => {
    if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
    if (!outlineData) return; const finalContentMap = { ...chapterContentMap }; if (activeChapter1Section) finalContentMap[activeChapter1Section] = chapter1Content;
    if (Object.keys(finalContentMap).length === 0) { alert("Vui lòng viết nội dung trước."); return; }
    setIsReviewing(true); setFixedIssues([]); 
    try { const result = await reviewThesisLogic(selectedTopic, outlineData, finalContentMap, surveyMap); setReviewResult(result); } catch (e) { alert("Lỗi thẩm định."); } finally { setIsReviewing(false); }
  };

  const handleFixLogic = async (issue: string) => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      let targetSection = activeChapter1Section; let targetContent = chapter1Content;
      const sectionMatch = issue.match(/^\[(.*?)\]/);
      if (sectionMatch) {
          const extractedSection = sectionMatch[1];
          const matchingKey = Object.keys(chapterContentMap).find(key => key.includes(extractedSection) || extractedSection.includes(key));
          if (matchingKey) { targetSection = matchingKey; targetContent = chapterContentMap[matchingKey]; } 
          else { const inStructure = outlineData?.structure.find(s => s.includes(extractedSection)); if (inStructure) { targetSection = inStructure; targetContent = ""; } }
      }
      if (!targetContent) { alert(`Không tìm thấy nội dung cho "${targetSection}".`); if (targetSection !== activeChapter1Section) handleSectionSelect(targetSection); return; }
      if (targetSection !== activeChapter1Section) handleSectionSelect(targetSection);
      setIsFixingIssue(issue);
      try { const fixedContent = await fixLogicIssue(targetContent, issue, selectedTopic); setChapter1Content(fixedContent); setChapterContentMap(prev => ({ ...prev, [targetSection]: fixedContent })); setFixedIssues(prev => [...prev, issue]); } catch (e) { alert("Lỗi sửa."); } finally { setIsFixingIssue(null); }
  };

  const handleGenerateSlides = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      setIsGeneratingSlides(true);
      try {
          let topic = selectedTopic; let outline: DetailedOutline = outlineData || { translatedTopic: "", rationale: "", objectives: { general: "", specific: [] }, objects: "", hypothesis: "", tasks: [], methods: [], expectedProducts: [], structure: [], references: [] };
          let contentMap = { ...chapterContentMap }; if (activeChapter1Section) contentMap[activeChapter1Section] = chapter1Content;
          if (slideSource === 'upload') { if (!slideUploadText.trim()) { alert("Vui lòng nhập nội dung."); setIsGeneratingSlides(false); return; } topic = "Tài liệu tải lên"; contentMap = { "Nội dung": slideUploadText }; } 
          else if (!outlineData) { alert("Không có dữ liệu."); setIsGeneratingSlides(false); return; }
          const slides = await generateSlideContent(topic, outline, contentMap, slideCount); setSlideResult(slides);
      } catch (e) { alert("Lỗi tạo slide."); } finally { setIsGeneratingSlides(false); }
  };

  const handleExportPPTX = () => {
    if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
    if (!slideResult.length || typeof PptxGenJS === 'undefined') return;
    try {
        const pres = new PptxGenJS(); pres.layout = 'LAYOUT_16x9';
        const titleSlide = pres.addSlide(); titleSlide.addText(selectedTopic || "Báo cáo Tóm tắt", { x: 1, y: 1.5, w: 8, h: 2, fontSize: 32, bold: true, align: 'center', color: '003366' }); titleSlide.addText(`Người trình bày: ${studentInfo.name}`, { x: 1, y: 4, w: 8, fontSize: 18, align: 'center' });
        slideResult.forEach((slide) => { if (!slide) return; const s = pres.addSlide(); s.addText(slide.title || "Slide", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '003366', border: {pt:0, color:'FFFFFF', bottom:true} }); const bullets = (slide.bullets || []).map((b) => ({ text: b, options: { bullet: true, fontSize: 18, breakLine: true } })); s.addText(bullets, { x: 0.5, y: 1.5, w: 9, h: 4, lineSpacing: 32 }); });
        pres.writeFile({ fileName: `Slide_${studentInfo.id}.pptx` });
    } catch (e) { alert("Lỗi xuất PPTX."); }
  };

  const handleCheckPlagiarism = async () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      const text = plagSource === 'current' ? plagiarismText : plagUploadText; if (!text.trim()) { alert("Vui lòng nhập nội dung."); return; } setIsCheckingPlagiarism(true);
      try { const result = await checkPlagiarism(text); setPlagiarismResult(result); } catch (e) { alert("Lỗi kiểm tra."); } finally { setIsCheckingPlagiarism(false); }
  };

  // --- UPDATED: AUTO REPLACE PARAPHRASED TEXT ---
  const handleParaphrase = async (matchText: string) => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      setIsParaphrasing(matchText);
      try {
          const rewritten = await paraphraseContent(matchText);
          
          // 1. Update Modal Text
          setPlagiarismText(prev => prev.replace(matchText, rewritten)); 
          if (plagSource === 'upload') setPlagUploadText(prev => prev.replace(matchText, rewritten));
          
          // 2. Update Active Content
          if (plagSource === 'current') {
              if (chapter1Content.includes(matchText)) {
                  setChapter1Content(prev => prev.replace(matchText, rewritten));
              }
              
              // 3. Update Other Sections in Map
              setChapterContentMap(prev => {
                  const newMap = { ...prev };
                  let found = false;
                  Object.keys(newMap).forEach(key => {
                      if (newMap[key] && newMap[key].includes(matchText)) {
                          newMap[key] = newMap[key].replace(matchText, rewritten);
                          found = true;
                      }
                  });
                  return newMap;
              });
          }

          navigator.clipboard.writeText(rewritten);
          setParaphrasedMatches(prev => [...prev, matchText]); 
          alert(`Đã viết lại và TỰ ĐỘNG CẬP NHẬT vào bài làm!\n\n"${rewritten.substring(0, 50)}..."`);
      } catch (e) { alert("Lỗi viết lại."); } finally { setIsParaphrasing(null); }
  };

  const handleDownloadPlagiarismReport = () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!plagiarismResult) return;
      const htmlContent = `<html><head><meta charset='utf-8'><title>Plagiarism Report</title></head><body><h1>BÁO CÁO KIỂM TRA TRÙNG LẶP</h1><p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p><p><strong>Tỷ lệ:</strong> ${plagiarismResult.score}%</p><hr/><h3>NỘI DUNG GỐC:</h3><div>${plagiarismText ? plagiarismText.replace(/\n/g, '<br/>') : ''}</div><hr/><h3>CHI TIẾT:</h3>${(plagiarismResult.matches || []).map((match, i) => `<div><strong>Câu ${i+1}:</strong> "${match}"</div>`).join('')}<p>* Kết quả sơ bộ từ Google Search.</p></body></html>`;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Report_${studentInfo.id}.doc`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
    link.download = `DeCuong_DaSua_${studentInfo.id}_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleGenerateSurvey = async () => {
    if (!activeChapter1Section) {
        alert("Vui lòng chọn một mục trong Đề cương trước.");
        return;
    }
    setIsGeneratingSurvey(true);
    try {
        const tableHtml = await generateSurveyContent(selectedTopic, activeChapter1Section, studentInfo.major, language);
        setSurveyMap(prev => ({ ...prev, [activeChapter1Section]: tableHtml }));
    } catch (e) {
        alert("Lỗi khi tạo bảng hỏi.");
    } finally {
        setIsGeneratingSurvey(false);
    }
  };

  // NEW: Analyze Data Button Logic
  const handleAnalyzeSurveyData = async (section: string) => {
    if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
    const surveyHtml = surveyMap[section];
    if (!surveyHtml) return;

    setIsAnalyzingData(section);
    try {
        const analysis = await analyzeSurveyData(selectedTopic, section, surveyHtml);
        
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;
            const text = chapter1Content;
            
            const newText = text.substring(0, startPos) + 
                            `\n\n[KẾT QUẢ VÀ BÀN LUẬN]\n${analysis}\n` + 
                            text.substring(endPos, text.length);
            
            setChapter1Content(newText);
            
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = startPos + analysis.length + 25; 
            }, 0);
        } else {
             setChapter1Content(prev => prev + `\n\n[KẾT QUẢ VÀ BÀN LUẬN]\n${analysis}`);
        }
        setChapterContentMap(prev => ({ ...prev, [section]: chapter1Content })); 
        
        alert("Đã phân tích xong! Nội dung đã được chèn vào vị trí con trỏ.");
    } catch (e) {
        alert("Lỗi phân tích số liệu.");
    } finally {
        setIsAnalyzingData(null);
    }
  };

  const handleDownloadSurvey = (section: string, htmlContent: string) => {
      if (!htmlContent) return;
      const fullHtml = `
         <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
         <head><meta charset='utf-8'><title>Survey - ${section}</title></head>
         <body>
             ${htmlContent}
         </body></html>`;
     
     const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `BangHoi_${section.replace(/[^a-z0-9]/gi, '_')}.doc`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleOptimizeSurvey = async (section: string) => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      const currentHtml = surveyMap[section];
      if (!currentHtml) return;
      setOptimizingSurvey(section);
      try {
          const newHtml = await optimizeSurveyQuestionnaire(currentHtml, selectedTopic);
          setSurveyMap(prev => ({ ...prev, [section]: newHtml }));
          alert("Đã tối ưu hóa bảng hỏi thành công!");
      } catch (e) {
          alert("Lỗi tối ưu hóa.");
      } finally {
          setOptimizingSurvey(null);
      }
  };

  const handleDeleteSurvey = (section: string) => {
    setSurveyToDelete(section);
  };

  const confirmDeleteSurvey = () => {
    if (surveyToDelete) {
        setSurveyMap(prev => {
            const newMap = { ...prev };
            delete newMap[surveyToDelete];
            return newMap;
        });
        setSurveyToDelete(null);
    }
  };

  const handleExportAllSurveys = () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!outlineData || Object.keys(surveyMap).length === 0) return;
      let htmlBody = "";
      
      (outlineData.structure || []).forEach(sec => {
          if (surveyMap[sec]) {
              const match = sec.match(/^([\d.]+)/);
              const num = match ? match[1] : "";
              const tableName = num ? `Bảng ${num}` : "Bảng";
              htmlBody += `<h2 style="page-break-before: always; margin-top: 20px;">${tableName}: Khảo sát cho mục "${sec}"</h2>`;
              htmlBody += surveyMap[sec];
              htmlBody += "<br/>";
          }
      });

      const fullHtml = `
         <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
         <head><meta charset='utf-8'><title>All Surveys</title></head>
         <body>
             <h1 style="text-align: center;">TỔNG HỢP BẢNG HỎI KHẢO SÁT</h1>
             <h3 style="text-align: center;">Đề tài: ${selectedTopic}</h3>
             <hr/>
             ${htmlBody}
         </body></html>`;
     
     const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `TongHop_BangHoi_${studentInfo.id}.doc`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleSaveOutline = async () => {
    if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
    if (!outlineData) return; setIsSaving(true); 
    const finalContentMap = { ...chapterContentMap }; 
    if (activeChapter1Section) finalContentMap[activeChapter1Section] = chapter1Content;
    try { 
        const payload = { 
            action: 'saveOutline', 
            studentInfo, 
            topic: selectedTopic, 
            projectType, 
            outlineData: { 
                ...outlineData, 
                contentMap: finalContentMap, 
                surveyMap: surveyMap,
                projectType 
            } 
        }; 
        const response = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }); 
        const result = await response.json(); 
        if (result.success) { 
            alert("Đã lưu thành công vào Drive!"); 
            if (result.id) setCurrentProjectId(result.id); 
            setChapterContentMap(finalContentMap); 
            fetchMyProjects(studentInfo.id);
        } else { 
            alert("Lỗi khi lưu: " + result.message); 
        } 
    } catch (error) { alert("Lỗi kết nối."); } finally { setIsSaving(false); }
  };
  
  const handleDownloadProposal = () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!outlineData) return;
      const labels = SECTION_LABELS[language] || SECTION_LABELS['Tiếng Việt'];
      
      let html = `<html><head><meta charset='utf-8'><title>${selectedTopic}</title>
      <style>body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; }</style>
      </head><body>`;
      html += `<h1 style="text-align: center; text-transform: uppercase;">ĐỀ CƯƠNG CHI TIẾT</h1>`;
      html += `<h2 style="text-align: center;">Đề tài: ${selectedTopic}</h2>`;
      html += `<p style="text-align: center; font-style: italic;">(Học viên: ${studentInfo.name})</p><hr/>`;
      
      const p = (title: string, content: string) => `<h3>${title}</h3><p>${content}</p>`;
      
      if(outlineData.rationale) html += p(labels.rationale, outlineData.rationale);
      
      html += `<h3>${labels.objectives}</h3>`;
      if(outlineData.objectives?.general) html += `<p><strong>${labels.objectives_gen}:</strong> ${outlineData.objectives.general}</p>`;
      if(outlineData.objectives?.specific && outlineData.objectives.specific.length) {
          html += `<p><strong>${labels.objectives_spe}:</strong></p><ul>`;
          outlineData.objectives.specific.forEach(x => html += `<li>${x}</li>`);
          html += `</ul>`;
      }
      
      if(outlineData.objects) html += p(labels.objects, outlineData.objects);
      if(outlineData.hypothesis) html += p(labels.hypothesis, outlineData.hypothesis);
      
      if(outlineData.tasks && outlineData.tasks.length > 0) {
          html += `<h3>${labels.tasks}</h3><ul>`;
          outlineData.tasks.forEach(x => html += `<li>${x}</li>`);
          html += `</ul>`;
      }
      
      if(outlineData.methods && outlineData.methods.length > 0) {
          html += `<h3>${labels.methods}</h3><ul>`;
          outlineData.methods.forEach(x => html += `<li>${x}</li>`);
          html += `</ul>`;
      }
      
      if(outlineData.structure && outlineData.structure.length > 0) {
          html += `<h3>${labels.structure}</h3><ul>`;
          outlineData.structure.forEach(x => html += `<li>${x}</li>`);
          html += `</ul>`;
      }

      if(outlineData.references && outlineData.references.length > 0) {
          html += `<h3>${labels.references}</h3><ul>`;
          outlineData.references.forEach(x => html += `<li>${x}</li>`);
          html += `</ul>`;
      }
      html += `</body></html>`;
      
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DeCuong_${studentInfo.id}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const handleDownloadDoc = () => {
      if (user?.role !== 'admin' && !user?.canEdit) { setShowPermissionModal(true); return; }
      if (!outlineData) return;
      const finalContentMap = { ...chapterContentMap };
      if (activeChapter1Section) finalContentMap[activeChapter1Section] = chapter1Content;
      const typeLabel = PROJECT_TYPES.find(t => t.id === projectType)?.label || "LUẬN VĂN THẠC SĨ";
      const labels = SECTION_LABELS[language] || SECTION_LABELS['Tiếng Việt'];
      
      const renderSection = (title: string, content: string | undefined | null) => {
          if (!content || content === "N/A" || content === "") return "";
          return `<h3>${title}</h3><p>${content.replace(/\n/g, '<br/>')}</p>`;
      };

      const linkCitations = (content: string) => {
          if (!content) return "";
          let linkedContent = content.replace(/\n/g, '<br/>');
          linkedContent = linkedContent.replace(/\[(\d+)\]/g, (match, num) => {
              return `<a href="#ref_${num}" style="color:blue; text-decoration:none;">${match}</a>`;
          });
          if (outlineData.references) {
              outlineData.references.forEach((ref, idx) => {
                  const refID = idx + 1;
                  const authorMatch = ref.match(/^([^,(.]+)/);
                  const yearMatch = ref.match(/(\d{4})/);
                  if (authorMatch && yearMatch) {
                      const author = authorMatch[1].trim(); 
                      const year = yearMatch[1]; 
                      const citationRegex = new RegExp(`\\([^)]*?${author}[^)]*?${year}[^)]*?\\)`, 'g');
                      linkedContent = linkedContent.replace(citationRegex, (match) => {
                          return `<a href="#ref_${refID}" style="color:blue; text-decoration:none;">${match}</a>`;
                      });
                  }
              });
          }
          return linkedContent;
      };

      let appendixHtml = "";
      if (Object.keys(surveyMap).length > 0) {
         appendixHtml += `<br style="page-break-before: always;"/><h1>PHỤ LỤC: CÁC PHIẾU KHẢO SÁT</h1>`;
         (outlineData.structure || []).forEach(sec => {
            if (surveyMap[sec]) {
               appendixHtml += `<h3>Phụ lục cho mục: ${sec}</h3>`;
               appendixHtml += surveyMap[sec];
               appendixHtml += "<br/>";
            }
         });
      }

      const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
              <meta charset='utf-8'>
              <title>Project - ${studentInfo.id}</title>
              <style>
                  body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; }
                  h1 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 24pt; }
                  h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; text-transform: uppercase; }
                  h3 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
                  p { margin-bottom: 6pt; text-align: justify; }
                  a { color: blue; text-decoration: none; }
                  .toc-placeholder { color: red; font-style: italic; text-align: center; }
                  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                  th, td { border: 1px solid black; padding: 8px; text-align: center; }
              </style>
          </head>
          <body>
              <h1 style="text-transform: uppercase;">${selectedTopic}</h1>
              ${outlineData.translatedTopic ? `<p style="text-align: center; font-style: italic; font-size: 14pt;">(${outlineData.translatedTopic})</p>` : ''}
              <br/>
              <p style="text-align: center;"><strong>Học viên:</strong> ${studentInfo.name} - <strong>MSHV:</strong> ${studentInfo.id}</p>
              <p style="text-align: center;"><strong>Chuyên ngành:</strong> ${studentInfo.major}</p>
              <p style="text-align: center;"><strong>Loại hình:</strong> ${typeLabel}</p>
              <br/>
              <p class="toc-placeholder">[Vào Insert > Table of Contents để tạo Mục lục tự động tại đây]</p>
              <br style="page-break-before: always;"/>
              <h2>${labels.intro}</h2>
              ${renderSection(labels.rationale, outlineData.rationale)}
              ${outlineData.objectives?.general ? `<h3>${labels.objectives}</h3><p><strong>${labels.objectives_gen}:</strong> ${outlineData.objectives.general}</p>` : ''}
              ${(outlineData.objectives?.specific || []).length > 0 ? `<h3>${labels.objectives_spe}</h3><ul>${outlineData.objectives.specific.map(o=>`<li>${o}</li>`).join('')}</ul>` : ''}
              ${renderSection(labels.objects, outlineData.objects)}
              ${outlineData.hypothesis ? `<h3>${labels.hypothesis}</h3><p><em>${outlineData.hypothesis}</em></p>` : ''}
              
              <br style="page-break-before: always;"/>
              ${(outlineData.structure || []).map(s => {
                  let sectionHtml = '';
                  const cleanTitle = s.trim();
                  const cleanTitleLower = cleanTitle.toLowerCase();
                  const isBigHeader = cleanTitleLower.startsWith('chương') || cleanTitleLower.startsWith('chapter') || cleanTitleLower.startsWith('phần') || cleanTitleLower.startsWith('part') || cleanTitleLower.startsWith('kết luận') || cleanTitleLower.startsWith('conclusion');
                  
                  if (isBigHeader) {
                      sectionHtml += `<br style="page-break-before: always;"/><h2>${cleanTitle}</h2>`;
                  } else if (/^\d+\.\d+/.test(cleanTitle)) {
                      sectionHtml += `<h3>${cleanTitle}</h3>`;
                  } else {
                       sectionHtml += `<p style="font-weight: bold;">${cleanTitle}</p>`;
                  }
                  const userContent = finalContentMap[s];
                  if (userContent) {
                      sectionHtml += `<div>${linkCitations(userContent)}</div>`;
                  }
                  return sectionHtml;
              }).join('')}
              <br style="page-break-before: always;"/>
              <h2>${labels.refs_header}</h2>
              <ul>
                  ${(outlineData.references || []).map((r, i) => `<li id="ref_${i+1}"><a name="ref_${i+1}"></a>${r}</li>`).join('')}
              </ul>

              ${appendixHtml}
          </body></html>`;
          
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Project_${projectType}_${studentInfo.id}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const renderStructureItem = (text: string, index: number) => {
      let className = "text-gray-700 mb-1";
      const txt = text.toLowerCase();
      if (txt.startsWith("chương") || txt.startsWith("chapter") || txt.startsWith("phần") || txt.startsWith("part") || txt.startsWith("kết luận") || txt.startsWith("conclusion")) className = "text-blue-900 font-bold text-lg mt-4 border-b border-blue-100 pb-1";
      else if (/^\d+\.\d+/.test(text)) className = "text-gray-800 font-bold ml-4 mt-2";
      else if (/^\d+\.\d+\.\d+/.test(text)) className = "text-gray-700 font-medium ml-8";
      else if (text.trim().startsWith("-") || text.trim().startsWith("•")) className = "text-gray-600 ml-12 italic";
      return <div key={index} className={className}>{text}</div>;
  };

  // Helper to capture active row for delete function
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
              // Calculate index relative to tbody or table rows
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
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center"><h3 className="text-xl font-bold text-gray-800 flex items-center"><Wrench size={20} className="mr-2 text-blue-600"/> Tiện ích Hỗ trợ Luận văn</h3><button onClick={() => setShowToolsModal(false)} className="hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button></div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-2">
                    <button onClick={() => setActiveToolTab('slides')} className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center ${activeToolTab === 'slides' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-600 hover:bg-gray-100'}`}><Presentation size={18} className="mr-3"/> Tạo Slide (PowerPoint)</button>
                    <button onClick={() => setActiveToolTab('plagiarism')} className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center ${activeToolTab === 'plagiarism' ? 'bg-white text-red-600 shadow-sm border border-red-100' : 'text-gray-600 hover:bg-gray-100'}`}><ShieldAlert size={18} className="mr-3"/> Kiểm tra Đạo văn</button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto bg-white">
                    {activeToolTab === 'slides' && (
                        <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-6">Tạo Kịch bản Thuyết trình</h4>
                            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200"><div className="flex gap-4 mb-4"><label className="flex items-center cursor-pointer"><input type="radio" checked={slideSource === 'current'} onChange={() => { setSlideSource('current'); setSlideUploadText(chapter1Content); }} className="mr-2" /><span className="text-sm">Dự án hiện tại</span></label><label className="flex items-center cursor-pointer"><input type="radio" checked={slideSource === 'upload'} onChange={() => setSlideSource('upload')} className="mr-2" /><span className="text-sm">Tài liệu bên ngoài</span></label></div>{slideSource === 'upload' && (<div className="space-y-3 animate-fade-in"><div className="flex items-center gap-2"><label className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-50 flex items-center"><Upload size={14} className="mr-2"/> Tải file .docx<input type="file" accept=".docx" className="hidden" onChange={(e) => handleToolFileUpload(e, 'slide')} /></label></div><textarea value={slideUploadText} onChange={(e) => setSlideUploadText(e.target.value)} className="w-full border p-3 rounded-lg text-sm h-24 outline-none" placeholder="Dán nội dung..."></textarea></div>)}</div>
                            <div className="mb-6 flex items-end gap-4"><div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-1">Số lượng Slide:</label><input type="number" min="5" max="20" value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="w-full border p-3 rounded-lg outline-none"/></div><button onClick={handleExportPPTX} disabled={slideResult.length === 0} className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold text-sm flex items-center hover:bg-gray-50 disabled:opacity-50"><Download size={16} className="mr-2"/> Xuất PPTX</button></div>
                            <button onClick={handleGenerateSlides} disabled={isGeneratingSlides} className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center">{isGeneratingSlides ? 'Đang tạo...' : 'Tạo Nội dung'}</button>
                            {slideResult.length > 0 && <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">{slideResult.map((slide, idx) => (<div key={idx} className="border p-4 rounded bg-gray-50"><h5 className="font-bold text-blue-900 mb-2">{slide.title}</h5><ul className="list-disc ml-5 text-sm">{slide.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul></div>))}</div>}
                        </div>
                    )}
                    {activeToolTab === 'plagiarism' && (
                        <div>
                            <div className="mb-6 flex justify-between items-start"><div><h4 className="text-lg font-bold text-gray-800">Kiểm tra Trùng lặp (Sơ bộ)</h4><p className="text-sm text-gray-500">Quét dữ liệu trên Google để phát hiện các câu văn giống nhau.</p></div>{plagiarismResult && (<button onClick={handleDownloadPlagiarismReport} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center"><Download size={14} className="mr-1"/> Tải Báo cáo (.doc)</button>)}</div>
                            
                            {/* WARNING BOX ADDED HERE */}
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start shadow-sm">
                                <ShieldAlert className="text-orange-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
                                <div className="text-sm text-orange-800">
                                    <strong>Lưu ý quan trọng:</strong> Đây là công cụ <strong>Kiểm tra Sơ bộ (Preliminary Check)</strong> dựa trên dữ liệu công khai trên Internet (Open Web). 
                                    <br/>Kết quả này mang tính tham khảo để giúp bạn rà soát lỗi copy-paste cơ bản. Nó <strong>KHÔNG</strong> thay thế được các hệ thống kiểm tra chuyên dụng của Nhà trường (như Turnitin, DoIT).
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                                <div className="flex gap-4 mb-4"><label className="flex items-center cursor-pointer"><input type="radio" checked={plagSource === 'current'} onChange={() => setPlagSource('current')} className="mr-2" /><span className="text-sm font-bold">Nội dung đang soạn thảo</span></label><label className="flex items-center cursor-pointer"><input type="radio" checked={plagSource === 'upload'} onChange={() => { setPlagSource('upload'); setPlagiarismText(plagUploadText); }} className="mr-2" /><span className="text-sm">Tải file / Nhập văn bản ngoài</span></label></div>
                                
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

                                {isSyncingText ? <div className="w-full border p-4 rounded-xl flex flex-col items-center justify-center min-h-[150px] bg-white text-gray-500"><RefreshCw size={24} className="animate-spin mb-2 text-blue-500"/><span>Đang tổng hợp dữ liệu...</span></div> : <textarea value={plagiarismText} onChange={(e) => { setPlagiarismText(e.target.value); if(plagSource === 'upload') setPlagUploadText(e.target.value); }} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm min-h-[150px] bg-white" placeholder="Nội dung cần kiểm tra sẽ hiện ở đây..." readOnly={plagSource === 'current'}></textarea>}
                                <div className="flex justify-end mt-3"><button onClick={handleCheckPlagiarism} disabled={isCheckingPlagiarism || !plagiarismText.trim()} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 flex items-center shadow-lg shadow-red-100">{isCheckingPlagiarism ? <RefreshCw size={18} className="animate-spin mr-2"/> : <ShieldAlert size={18} className="mr-2"/>}Kiểm tra Ngay</button></div>
                            </div>
                            {plagiarismResult && (<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-fade-in"><div className={`p-4 border-b flex justify-between items-center ${plagiarismResult.score > 20 ? 'bg-red-50' : 'bg-green-50'}`}><span className="font-bold text-gray-700">Kết quả phân tích:</span><span className={`px-3 py-1 rounded-full text-sm font-bold ${plagiarismResult.score > 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Trùng lặp khoảng: {plagiarismResult.score}%</span></div><div className="p-4">{(plagiarismResult.matches || []).length > 0 ? (<div className="space-y-3"><p className="text-sm font-bold text-gray-600">Các câu nghi vấn trùng lặp (Highlight):</p>{(plagiarismResult.matches || []).map((match, i) => (<div key={i} className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-100 border-l-4 border-l-red-500"><span className="text-red-700 font-bold block mb-1">Câu nghi vấn {i+1}:</span>"{match}"<div className="mt-2 flex justify-end"><button onClick={() => handleParaphrase(match)} disabled={isParaphrasing === match || paraphrasedMatches.includes(match)} className={`text-xs border px-3 py-1 rounded-full font-bold flex items-center transition ${paraphrasedMatches.includes(match) ? "bg-green-100 text-green-700 border-green-200" : "bg-white border-red-300 text-red-600 hover:bg-red-50"}`}>{isParaphrasing === match ? <RefreshCw size={12} className="animate-spin mr-1"/> : paraphrasedMatches.includes(match) ? <CheckCircle size={12} className="mr-1"/> : <Wand2 size={12} className="mr-1"/>}{isParaphrasing === match ? "Đang viết lại..." : paraphrasedMatches.includes(match) ? "Đã sửa" : "AI Viết lại (Giảm trùng lặp)"}</button></div></div>))}</div>) : (<div className="text-center text-green-600 py-4 font-medium flex items-center justify-center"><CheckCircle size={20} className="mr-2"/> Không tìm thấy nội dung trùng lặp đáng kể trên các nguồn công khai.</div>)}<p className="text-xs text-gray-400 mt-4 italic text-center">* Lưu ý: Kết quả này chỉ mang tính tham khảo dựa trên dữ liệu Google Search công khai.</p></div></div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  const renderSetupStep0_Info = () => (
    <div className="w-full max-w-7xl mx-auto animate-fade-in text-left">
        <div className="mb-4">
        <button onClick={() => setView('list')} className="text-gray-500 hover:text-blue-600 flex items-center text-sm font-bold transition-colors">
            <ArrowLeft size={16} className="mr-1"/> Hủy & Quay lại
        </button>
    </div>

        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><User className="mr-2 text-blue-600"/> Thông tin & Loại hình Nghiên cứu</h3>
        
        {/* CARD SELECTION FOR PROJECT TYPES */}
        <p className="text-sm font-bold text-gray-700 mb-3">Chọn loại hình đề tài:</p>
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {PROJECT_TYPES.map(type => (
                <div key={type.id} onClick={() => setProjectType(type.id)} className={`p-3 border-2 rounded-xl cursor-pointer transition flex flex-col items-center text-center h-full hover:shadow-md ${projectType === type.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                    <div className={`mb-2 ${projectType === type.id ? 'text-blue-600' : 'text-gray-400'}`}>{type.icon}</div>
                    <span className={`font-bold text-sm mb-1 ${projectType === type.id ? 'text-blue-900' : 'text-gray-700'}`}>{type.label}</span>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                </div>
            ))}
        </div>

        {/* NEW INPUT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Họ và tên học viên</label>
                <input 
                    ref={nameRef}
                    type="text" 
                    value={studentInfo.name} 
                    onChange={e => setStudentInfo({...studentInfo, name: e.target.value})} 
                    onBlur={handleNameBlur} 
                    onKeyDown={(e) => e.key === 'Enter' && focusNext(idRef)}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Nguyễn Văn A"
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mã học viên</label>
                <input 
                    ref={idRef}
                    type="text" 
                    value={studentInfo.id} 
                    onChange={e => setStudentInfo({...studentInfo, id: e.target.value})} 
                    onKeyDown={(e) => e.key === 'Enter' && focusNext(majorRef)}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="HV123456"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Chuyên ngành</label>
                <select 
                    ref={majorRef}
                    value={isOtherMajor ? '__OTHER__' : studentInfo.major} 
                    onChange={(e) => { 
                        if (e.target.value === '__OTHER__') { 
                            setIsOtherMajor(true); 
                            setStudentInfo({...studentInfo, major: ''}); 
                            setTimeout(() => otherMajorRef.current?.focus(), 100);
                        } else { 
                            setIsOtherMajor(false); 
                            setStudentInfo({...studentInfo, major: e.target.value}); 
                        } 
                    }} 
                    onKeyDown={(e) => e.key === 'Enter' && (isOtherMajor ? focusNext(otherMajorRef) : focusNext(supervisorRef))}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                    <option value="__OTHER__">Khác (Nhập thủ công)...</option>
                </select>
                {isOtherMajor && (
                    <input 
                        ref={otherMajorRef}
                        type="text" 
                        value={studentInfo.major} 
                        onChange={e => setStudentInfo({...studentInfo, major: e.target.value})} 
                        onKeyDown={(e) => e.key === 'Enter' && focusNext(supervisorRef)}
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-2" 
                        placeholder="Nhập tên chuyên ngành..." 
                    />
                )}
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">GVHD Dự kiến</label>
                <input 
                    ref={supervisorRef}
                    type="text" 
                    value={studentInfo.supervisor} 
                    onChange={e => setStudentInfo({...studentInfo, supervisor: e.target.value})} 
                    onKeyDown={(e) => e.key === 'Enter' && focusNext(langRef)}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="TS. Nguyễn Văn B"
                />
            </div>
        </div>

        {/* LANGUAGE SELECTION */}
        <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Globe size={16} className="mr-2 text-blue-600"/> Ngôn ngữ viết đề cương:
            </label>
            <div className="flex items-center gap-4">
                <div className="relative w-full max-w-xs">
                    <select 
                        ref={langRef}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && focusNext(submitBtnRef)}
                        className="w-full border p-3 pl-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer font-bold text-blue-900"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-3.5 text-gray-400 rotate-90 pointer-events-none" size={16}/>
                </div>
                <p className="text-xs text-gray-500 italic">* AI sẽ sử dụng ngôn ngữ này để tạo đề cương và viết bài.</p>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
            <button 
                ref={submitBtnRef}
                onClick={() => setSetupStep(1)} 
                disabled={!studentInfo.name || !studentInfo.major} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center shadow-lg shadow-blue-200 transition-all transform hover:scale-105 active:scale-95"
            >
                Tiếp tục: Xác định Đề tài <ArrowRight size={18} className="ml-2"/>
            </button>
        </div>
    </div>
  );

  const renderSetupStep1_Topic = () => (
    <div className="w-full max-w-4xl mx-auto animate-fade-in"><h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Bạn đã có ý tưởng tên đề tài chưa?</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"><div onClick={() => setTopicPath('suggest')} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${topicPath === 'suggest' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}><div className="flex items-center mb-4"><div className="bg-blue-100 p-3 rounded-full mr-3"><Lightbulb className="text-blue-600"/></div><h4 className="font-bold text-gray-800">Chưa có, hãy gợi ý giúp tôi</h4></div><p className="text-sm text-gray-600">AI sẽ đóng vai Giáo sư chuyên ngành <strong>{studentInfo.major}</strong> để đề xuất các đề tài mới mẻ.</p></div><div onClick={() => setTopicPath('custom')} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${topicPath === 'custom' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}><div className="flex items-center mb-4"><div className="bg-green-100 p-3 rounded-full mr-3"><FileText className="text-green-600"/></div><h4 className="font-bold text-gray-800">Tôi đã có dự kiến tên đề tài</h4></div><p className="text-sm text-gray-600">Nhập trực tiếp tên đề tài của bạn để hệ thống kiểm tra.</p></div></div>{topicPath === 'suggest' && (<div className="bg-white p-6 rounded-xl border border-gray-200 animate-fade-in"><div className="flex gap-2 mb-4"><input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Nhập từ khóa mong muốn (VD: Chuyển đổi số...)" className="flex-1 border p-2 rounded-lg outline-none focus:border-blue-500"/><button onClick={handleSuggestTopics} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50">{loading ? 'Đang suy nghĩ...' : 'Gợi ý ngay'}</button></div>{suggestedTopics.length > 0 && (<div className="space-y-3"><p className="text-sm font-semibold text-gray-700">Chọn 1 đề tài ưng ý:</p>{suggestedTopics.map((t, i) => (<div key={i} className="flex items-start"><input type="radio" name="topic" id={`t-${i}`} checked={selectedTopic === t} onChange={() => setSelectedTopic(t)} className="mt-1 mr-3"/><label htmlFor={`t-${i}`} className="text-gray-800 cursor-pointer hover:text-blue-700">{t}</label></div>))}</div>)}</div>)}{topicPath === 'custom' && (<div className="bg-white p-6 rounded-xl border border-gray-200 animate-fade-in"><label className="block text-sm font-medium text-gray-700 mb-2">Nhập tên đề tài dự kiến:</label><textarea value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" rows={3} placeholder="VD: Biện pháp quản lý..."></textarea></div>)}<div className="mt-8 flex justify-between items-center"><button onClick={() => setSetupStep(0)} className="flex items-center px-5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors shadow-sm"><ArrowLeft size={18} className="mr-2"/> Quay lại</button><button onClick={() => { if (duplicateResults.length > 0) { setShowDuplicateWarning(true); } else { handleCheckTopic(); } }} disabled={!selectedTopic || loading} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center shadow-lg shadow-purple-200">{loading ? 'Đang kiểm tra...' : <><Search size={18} className="mr-2"/> Kiểm tra Trùng lặp & Khả thi</>}</button></div></div>
  );

  const renderSetupStep2_Check = () => (
      <div className="w-full max-w-3xl mx-auto animate-fade-in text-left">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Kết quả Kiểm tra Đề tài</h3>
          {duplicateResults.length > 0 && (<div className="mb-8 animate-fade-in"><div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start text-yellow-800 mb-4 shadow-sm"><AlertCircle size={24} className="mr-3 mt-1 text-yellow-600" /><div><p className="font-bold text-lg mb-2">Tìm thấy {duplicateResults.length} đề tài có liên quan!</p><ul className="list-disc ml-5 text-sm space-y-1"><li>Đề tài bạn nhập đã từng được nghiên cứu.</li><li>Việc trùng lặp có thể ảnh hưởng đến tính mới.</li></ul></div></div><div className="space-y-4">{duplicateResults.map(topic => (<div key={topic.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white"><div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-blue-900 mb-1">{topic.name}</h3><p className="text-gray-600 text-sm mb-2"><User size={14} className="inline mr-1"/> {topic.author}</p></div><span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Đã bảo vệ</span></div></div>))}</div></div>)}
          {viabilityData && (<div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${duplicateResults.length > 0 ? 'opacity-70 grayscale-[50%]' : ''}`}><div className="p-6 border-b border-gray-100 bg-gray-50"><h4 className="font-bold text-blue-900 text-lg mb-1">{selectedTopic}</h4><div className="flex items-center mt-2"><span className={`px-3 py-1 rounded-full text-sm font-bold mr-3 ${viabilityData.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Điểm khả thi: {viabilityData.score}/100</span><span className="text-sm text-gray-600 italic">Tính mới: {viabilityData.novelty}</span></div></div><div className="p-6 space-y-4"><div><h5 className="font-bold text-gray-700 mb-1">Đánh giá tổng quan:</h5><p className="text-gray-600 text-sm">{viabilityData.viability}</p></div>{viabilityData.suggestions.length > 0 && (<div className="bg-orange-50 p-4 rounded-lg border border-orange-100"><h5 className="font-bold text-orange-800 mb-2 flex items-center"><AlertCircle size={16} className="mr-2"/> Gợi ý cải tiến:</h5><ul className="list-disc ml-5 text-orange-800 space-y-1 text-sm">{viabilityData.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}</div></div>)}
          <div className="mt-8 flex justify-between items-center"><button onClick={() => setSetupStep(1)} className="flex items-center px-5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors shadow-sm"><ArrowLeft size={18} className="mr-2"/> Chọn lại đề tài</button><button onClick={() => { if (duplicateResults.length > 0) { setShowDuplicateWarning(true); } else { handleGenerateOutline(); } }} disabled={!selectedTopic || loading} className={`${duplicateResults.length > 0 ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'} text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center transform transition hover:-translate-y-1`}>{loading ? 'Đang viết đề cương...' : <><Sparkles size={18} className="mr-2"/> Tạo Đề Cương Chi Tiết</>}</button></div>
          {showDuplicateWarning && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-fade-in"><div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-t-4 border-red-500"><h3 className="text-xl font-bold text-red-600 mb-2 flex items-center"><AlertTriangle className="mr-2" size={24}/> Cảnh báo Trùng lặp</h3><p className="text-gray-700 mb-6 text-sm">Đề tài này có dấu hiệu trùng lặp cao... Bạn có chắc chắn muốn tiếp tục?</p><div className="flex justify-end gap-3"><button onClick={() => setShowDuplicateWarning(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-bold transition">Hủy bỏ</button><button onClick={() => { setShowDuplicateWarning(false); handleGenerateOutline(); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-lg">Vẫn tiếp tục</button></div></div></div>)}
      </div>
  );

  const renderSetupStep3_Outline = () => {
    const labels = SECTION_LABELS[language] || SECTION_LABELS['Tiếng Việt'];
    return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in text-left">
        <div className="flex flex-col mb-6">
            <button onClick={() => setSetupStep(2)} className="self-start flex items-center text-gray-500 hover:text-blue-600 mb-2 font-medium transition"><ArrowLeft size={16} className="mr-1"/> Quay lại bước Kiểm tra</button>
            <div className="flex justify-between items-center w-full">
                <h3 className="text-2xl font-bold text-gray-900">Đề Cương Chi Tiết (Dự thảo)</h3>
                <div className="flex gap-2">
                    <button onClick={handleDownloadProposal} className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-bold flex items-center shadow-sm hover:bg-blue-50 transition"><FileDown size={18} className="mr-2"/> Tải Đề cương (.doc)</button>
                    <button onClick={handleSaveOutline} disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-blue-700 disabled:opacity-70">{isSaving ? 'Đang lưu...' : <><Save size={18} className="mr-2"/> Lưu</>}</button>
                    <button onClick={() => setSetupStep(4)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-green-700 ml-2">Tiếp tục: Viết Tổng hợp <ArrowRight size={18} className="ml-2"/></button>
                </div>
            </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 shadow-sm flex justify-between items-center"><div><h4 className="font-bold text-orange-900 flex items-center mb-1"><FileUp size={18} className="mr-2" /> Đã có phản hồi từ GVHD?</h4><p className="text-xs text-orange-700">Nếu GVHD đã sửa trực tiếp trên file Word, hãy nhập nội dung đó vào đây để AI cập nhật lại.</p></div><button onClick={() => setShowImportModal(true)} className="bg-white border border-orange-300 text-orange-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-100 transition shadow-sm">Nhập lại (Import)</button></div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm"><h4 className="font-bold text-indigo-900 flex items-center mb-3"><Edit3 size={18} className="mr-2" /> Bạn muốn chỉnh sửa gì không?</h4><div className="flex gap-3"><textarea value={refinementRequest} onChange={(e) => setRefinementRequest(e.target.value)} placeholder="Ví dụ: Thêm chương về Thực trạng..." className="flex-1 border border-indigo-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" rows={2} /><button onClick={handleRefineOutline} disabled={isRefining || !refinementRequest.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-60 flex flex-col items-center justify-center min-w-[120px]">{isRefining ? <RefreshCw size={20} className="animate-spin mb-1"/> : <RefreshCw size={20} className="mb-1"/>}<span className="text-xs">Cập nhật</span></button></div></div>
        {outlineData && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-6">
                <div className="border-b pb-4"><h4 className="text-xl font-bold text-blue-900 text-center uppercase">{selectedTopic}</h4>{outlineData.translatedTopic && (<p className="text-center text-gray-500 italic mt-1 font-serif">({outlineData.translatedTopic})</p>)}</div>
                {outlineData.rationale && outlineData.rationale !== "N/A" && (<div><h5 className="font-bold text-gray-800 mb-2">{labels.rationale}</h5><p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-lg">{outlineData.rationale}</p></div>)}
                {(outlineData.objectives?.general || (outlineData.objectives?.specific && outlineData.objectives.specific.length > 0)) && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h5 className="font-bold text-gray-800 mb-2">{labels.objectives}</h5><div className="bg-gray-50 p-4 rounded-lg h-full">{outlineData.objectives?.general && <><p className="text-sm font-semibold text-gray-700">{labels.objectives_gen}:</p><p className="text-sm text-gray-600 mb-2">{outlineData.objectives.general}</p></>}{(outlineData.objectives?.specific || []).length > 0 && <><p className="text-sm font-semibold text-gray-700">{labels.objectives_spe}:</p><ul className="list-disc ml-5 text-sm text-gray-600">{(outlineData.objectives?.specific || []).map((o, i) => <li key={i}>{o}</li>)}</ul></>}</div></div>{outlineData.objects && outlineData.objects !== "N/A" && (<div><h5 className="font-bold text-gray-800 mb-2">{labels.objects}</h5><div className="bg-gray-50 p-4 rounded-lg h-full text-sm text-gray-600 whitespace-pre-line">{outlineData.objects}</div></div>)}</div>)}
                {/* HIỂN THỊ PHẠM VI NGHIÊN CỨU */}
                    {outlineData.scope && outlineData.scope !== "N/A" && (
                        <div className="mt-6">
                            <h5 className="font-bold text-gray-800 mb-2">{labels.scope}</h5>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 whitespace-pre-line border-l-4 border-indigo-400">
                                {outlineData.scope}
                            </div>
                        </div>
                    )}
                {outlineData.hypothesis && outlineData.hypothesis !== "N/A" && (<div><h5 className="font-bold text-gray-800 mb-2">{labels.hypothesis}</h5><p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg italic border-l-4 border-blue-400">"{outlineData.hypothesis}"</p></div>)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{outlineData.tasks && outlineData.tasks.length > 0 && (<div><h5 className="font-bold text-gray-800 mb-2">{labels.tasks}</h5><ul className="list-disc ml-5 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{(outlineData.tasks || []).map((t, i) => <li key={i}>{t}</li>)}</ul></div>)}{outlineData.methods && outlineData.methods.length > 0 && (<div><h5 className="font-bold text-gray-800 mb-2">{labels.methods}</h5><ul className="list-disc ml-5 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{(outlineData.methods || []).map((m, i) => <li key={i}>{m}</li>)}</ul></div>)}</div>
                {/* HIỂN THỊ Ý NGHĨA KHOA HỌC & THỰC TIỄN */}
                    {outlineData.significance && outlineData.significance !== "N/A" && (
                        <div className="mt-6">
                            <h5 className="font-bold text-gray-800 mb-2">{labels.significance}</h5>
                            <p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-lg border-l-4 border-green-400">
                                {outlineData.significance}
                            </p>
                        </div>
                    )}

                    {/* HIỂN THỊ SẢN PHẨM DỰ KIẾN */}
                    {outlineData.expectedProducts && outlineData.expectedProducts.length > 0 && (
                        <div className="mt-6">
                            <h5 className="font-bold text-gray-800 mb-2">{labels.expectedProducts}</h5>
                            <ul className="list-disc ml-5 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border-l-4 border-orange-400">
                                {outlineData.expectedProducts.map((p: any, i: number) => (
                                    <li key={i} className="mb-1">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                <div><h5 className="font-bold text-gray-800 mb-2">{labels.structure}</h5><div className="bg-white border border-gray-200 p-6 rounded-lg shadow-inner">{(outlineData.structure || []).map((s, i) => renderStructureItem(s, i))}</div></div>
            </div>
        )}
        {showImportModal && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-fade-in"><div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="text-xl font-bold text-gray-800">Nhập lại Đề cương (Import)</h3><button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button></div><div className="mb-4"><label className="block text-sm font-bold text-gray-700 mb-2">Cách 1: Tải lên file Word (.docx)</label><div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition relative"><input type="file" accept=".docx" onChange={(e) => handleToolFileUpload(e, 'import')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/><Upload className="text-gray-400 mb-2" size={24} /><p className="text-sm text-gray-600 font-medium">Kéo thả hoặc click để chọn file</p></div></div><label className="block text-sm font-bold text-gray-700 mb-2">Cách 2: Hoặc dán nội dung văn bản vào đây</label><textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full flex-1 border p-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono min-h-[150px] mb-4" placeholder="Paste nội dung..."></textarea><div className="flex justify-end gap-3"><button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button><button onClick={handleImportOutline} disabled={isImporting || !importText.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 flex items-center">{isImporting ? <RefreshCw size={18} className="animate-spin mr-2"/> : <Upload size={18} className="mr-2"/>}{isImporting ? 'AI đang phân tích...' : 'Phân tích & Cập nhật'}</button></div></div></div>)}
    </div>
  )};

  const renderStep4_Overview = () => {
    const fullStructure = outlineData?.structure || [];
    const typeLabel = PROJECT_TYPES.find(t=>t.id===projectType)?.label || 'Luận văn';


    return (
      <div className="w-full h-full flex flex-col animate-fade-in min-h-[700px] text-left">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100"><div className="flex items-center"><button onClick={() => setSetupStep(3)} className="flex items-center px-3 py-1.5 rounded-lg border-transparent text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm font-bold transition mr-4"><ArrowLeft size={16} className="mr-1"/> Về Đề cương</button><h3 className="font-bold text-lg text-blue-900 uppercase">Không gian Viết & Tổng hợp ({typeLabel})</h3></div><div className="flex gap-2"><button onClick={() => setShowToolsModal(true)} className="bg-green-600 hover:bg-green-700 text-white border-transparent px-4 py-2 rounded-lg font-bold flex items-center shadow-green-200 shadow-sm transition"><Wrench size={18} className="mr-2"/> Tiện ích</button><button onClick={handleReviewLogic} disabled={isReviewing} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-purple-700 disabled:opacity-50">{isReviewing ? <RefreshCw size={18} className="animate-spin mr-2"/> : <Microscope size={18} className="mr-2"/>}AI Thẩm định Logic</button><button onClick={handleDownloadDoc} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-blue-700"><FileDown size={18} className="mr-2"/> Xuất Word (Full)</button></div></div>
          <div className="flex flex-col md:flex-row gap-6 flex-1 h-full">
            <div className="w-full md:w-1/3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-fit"><h4 className="font-bold text-gray-800 mb-4 pb-2 border-b flex items-center"><FolderOpen size={18} className="mr-2 text-blue-600"/> Cấu trúc {typeLabel}</h4><div className="space-y-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {fullStructure.length > 0 ? fullStructure.map((item, idx) => { 
                    const txt = item.toLowerCase(); 
                    const isHeader = txt.startsWith("chương") || txt.startsWith("chapter") || txt.startsWith("phần") || txt.startsWith("part") || txt.startsWith("kết luận") || txt.startsWith("conclusion") || txt.startsWith("mở đầu") || txt.startsWith("introduction"); 
                    const isSub = /^\d+\.\d+/.test(item); 
                    const isActive = activeChapter1Section === item; 
                    const hasContent = chapterContentMap[item] && chapterContentMap[item].trim().length > 20;

                    return (
                        <div key={idx} onClick={() => handleSectionSelect(item)} className={`cursor-pointer p-2 rounded-lg text-sm transition-all flex justify-between items-center ${isActive ? 'bg-blue-100 text-blue-800 font-bold border-l-4 border-blue-500 pl-3' : 'hover:bg-gray-50 text-gray-700'} ${isHeader ? 'font-bold mt-4 uppercase bg-gray-50' : ''} ${isSub ? 'ml-4' : ''} ${hasContent ? 'text-green-700' : ''}`}>
                            <span>{item}</span>
                            {hasContent && !isActive && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                            {isActive && <span className="text-blue-500">●</span>}
                        </div>
                    ) 
                }) : (<p className="text-gray-400 text-sm italic">Chưa có dữ liệu đề cương.</p>)}
            </div></div>
            <div className="w-full md:w-2/3 flex flex-col gap-4">
                {/* LOGIC REVIEW RESULT - FIXED HEIGHT/SCROLL */}
                {reviewResult && (<div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-2 animate-fade-in relative max-h-[300px] overflow-y-auto"><button onClick={()=>setReviewResult(null)} className="absolute top-2 right-2 text-purple-400 hover:text-purple-600"><X size={16}/></button><h4 className="font-bold text-purple-800 mb-2 flex items-center sticky top-0 bg-purple-50 pb-2"><Microscope size={18} className="mr-2"/> Kết quả Thẩm định Logic:</h4><p className="text-sm text-purple-900 font-semibold mb-2">{reviewResult.overall}</p><ul className="list-disc ml-5 text-sm text-purple-800 space-y-2">{reviewResult.issues.map((issue, i) => (<li key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><span className={fixedIssues.includes(issue) ? "text-gray-500 line-through" : ""}>{issue}</span><button onClick={() => handleFixLogic(issue)} disabled={isFixingIssue === issue || fixedIssues.includes(issue)} className={`text-xs border px-3 py-1 rounded-full font-bold flex-shrink-0 flex items-center transition ${fixedIssues.includes(issue) ? "bg-green-100 text-green-700 border-green-200" : "bg-white border-purple-300 text-purple-700 hover:bg-purple-100"}`}>{isFixingIssue === issue ? <RefreshCw size={12} className="animate-spin mr-1"/> : fixedIssues.includes(issue) ? <CheckCircle size={12} className="mr-1"/> : <Wand2 size={12} className="mr-1"/>}{isFixingIssue === issue ? "Đang sửa..." : fixedIssues.includes(issue) ? "Đã sửa" : "Sửa giúp tôi"}</button></li>))}</ul></div>)}
                
                {/* RIGHT COLUMN TABS */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex mb-4 border-b border-gray-100">
                        <button onClick={() => setActiveRightTab('research')} className={`flex-1 py-2 text-sm font-bold flex items-center justify-center ${activeRightTab === 'research' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Search size={16} className="mr-2"/> Tìm kiếm Luận cứ
                        </button>
                        <button onClick={() => setActiveRightTab('survey')} className={`flex-1 py-2 text-sm font-bold flex items-center justify-center ${activeRightTab === 'survey' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                            <ListChecks size={16} className="mr-2"/> Thiết kế Bảng hỏi
                        </button>
                    </div>

                    {/* TAB: RESEARCH */}
                    {activeRightTab === 'research' && (
                        <div className="animate-fade-in">
                            <div className="mb-3">
                                <div className="flex flex-wrap gap-2 mb-2">{searchTags.map((tag, idx) => (<span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">{tag} <button onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-purple-900"><X size={14}/></button></span>))}</div>
                                <input type="text" value={currentTagInput} onChange={(e) => setCurrentTagInput(e.target.value)} onKeyDown={handleAddSearchTag} placeholder="Nhập khái niệm và nhấn Enter..." className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none"/>
                            </div>
                            <button onClick={handleFindEvidence} disabled={isSearchingEvidence || searchTags.length === 0} className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center">
                                {isSearchingEvidence ? <RefreshCw size={16} className="animate-spin mr-2"/> : <Sparkles size={16} className="mr-2"/>} {isSearchingEvidence ? 'AI đang tìm kiếm...' : 'Tìm Luận Cứ'}
                            </button>
                            {researchResults.length > 0 && (
                                <div className="mt-4 border-t pt-3 max-h-60 overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-center mb-2"><p className="text-xs font-bold text-gray-500 uppercase">Kết quả tìm kiếm:</p><p className="text-xs text-orange-600 italic animate-pulse">* Hãy chọn dấu + để AI sử dụng làm tư liệu viết bài.</p></div>
                                    <div className="space-y-3">{researchResults.map((res, i) => { const isSelected = selectedEvidence.some(e => e.source === res.source && e.author === res.author); return (<div key={i} className={`p-3 rounded-lg border text-sm transition ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-100 hover:border-blue-200'}`}><div className="flex justify-between items-start"><div className="flex-1"><p className="font-bold text-gray-800">{res.author} ({res.year})</p><p className="text-gray-600 italic mb-1">"{res.summary}"</p></div><button onClick={() => toggleEvidenceSelection(res)} className={`ml-2 p-1 rounded-full ${isSelected ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-blue-500'}`} title="Chọn làm dữ liệu đầu vào cho AI viết">{isSelected ? <CheckSquare size={18}/> : <Plus size={18}/>}</button></div><div className="flex justify-between items-center mt-2"><span className="text-xs text-gray-400 truncate max-w-[200px]" title={res.source}>{res.source}</span><button onClick={() => handleInsertCitation(res)} className="text-blue-600 font-bold text-xs flex items-center hover:bg-blue-50 px-2 py-1 rounded border border-transparent hover:border-blue-200"><Copy size={12} className="mr-1"/> Chèn trích dẫn</button></div></div>) })}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: SURVEY */}
                    {activeRightTab === 'survey' && (
                        <div className="animate-fade-in">
                            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg mb-3 text-sm text-orange-800">
                                <p className="mb-1 font-bold">Mục đang chọn: <span className="text-blue-700">{activeChapter1Section || "(Chưa chọn)"}</span></p>
                                <p className="text-xs">AI sẽ thiết kế bảng hỏi Likert (10-15 câu) dựa trên nội dung mục này.</p>
                            </div>
                            <button onClick={handleGenerateSurvey} disabled={isGeneratingSurvey || !activeChapter1Section} className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 flex justify-center items-center mb-4 shadow-sm">
                                {isGeneratingSurvey ? <RefreshCw size={16} className="animate-spin mr-2"/> : <Table size={16} className="mr-2"/>} {isGeneratingSurvey ? 'Đang thiết kế...' : 'Tạo Bảng hỏi cho mục này'}
                            </button>
                            
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs font-bold text-gray-500 uppercase">Danh sách Bảng hỏi</span>
                                <button onClick={() => setIsCompactSurveyView(!isCompactSurveyView)} className="text-xs text-blue-600 flex items-center hover:bg-blue-50 px-2 py-1 rounded transition">
                                    {isCompactSurveyView ? <Maximize2 size={12} className="mr-1"/> : <Minimize2 size={12} className="mr-1"/>}
                                    {isCompactSurveyView ? "Chi tiết" : "Rút gọn"}
                                </button>
                            </div>

                            <div className="border-t pt-2 max-h-[400px] overflow-y-auto custom-scrollbar space-y-4 pr-1">
                                {(outlineData?.structure || []).map((sec, idx) => {
                                    const surveyHtml = surveyMap[sec];
                                    if (!surveyHtml) return null;
                                    return (
                                        <div key={idx} className="border border-orange-200 rounded-lg p-3 bg-white hover:shadow-md transition group relative">
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="font-bold text-sm text-gray-800 truncate pr-2 w-1/3" title={sec}>{sec}</h5>
                                                <div className="flex gap-1">
                                                    {/* NEW: Analysis Button */}
                                                    <button onClick={() => handleAnalyzeSurveyData(sec)} disabled={isAnalyzingData === sec} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex items-center font-bold" title="AI Phân tích số liệu">
                                                        {isAnalyzingData === sec ? <RefreshCw size={14} className="animate-spin"/> : <BarChart2 size={14}/>}
                                                    </button>

                                                    <button onClick={() => { setSurveyPreview(surveyHtml); setPreviewSection(sec); }} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center font-bold" title="Xem chi tiết">
                                                        <Eye size={14}/>
                                                    </button>
                                                    <button onClick={() => handleOptimizeSurvey(sec)} disabled={optimizingSurvey === sec} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center font-bold" title="AI Tối ưu hóa">
                                                        {optimizingSurvey === sec ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                                    </button>
                                                    <button onClick={() => handleDownloadSurvey(sec, surveyHtml)} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 flex items-center font-bold" title="Tải về">
                                                        <FileDown size={14}/>
                                                    </button>
                                                    <button onClick={() => handleDeleteSurvey(sec)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 flex items-center font-bold" title="Xóa bảng hỏi">
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            </div>
                                            {!isCompactSurveyView && (
                                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 overflow-hidden max-h-24 relative">
                                                    <div dangerouslySetInnerHTML={{__html: surveyHtml}} className="scale-75 origin-top-left w-[130%] pointer-events-none"/>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {Object.keys(surveyMap).length > 0 && (
                                    <button onClick={handleExportAllSurveys} className="w-full mt-4 bg-white border-2 border-orange-500 text-orange-600 py-2 rounded-lg font-bold hover:bg-orange-50 flex justify-center items-center">
                                        <Printer size={16} className="mr-2"/> Xuất toàn bộ Bảng hỏi (.doc)
                                    </button>
                                )}
                                {Object.keys(surveyMap).length === 0 && <p className="text-center text-gray-400 text-sm py-4 italic">Chưa có bảng hỏi nào được tạo.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* EDITOR */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex-1 flex flex-col min-h-[400px]"><div className="flex justify-between items-center mb-2"><h4 className="font-bold text-gray-800 flex items-center"><PenTool size={18} className="mr-2 text-blue-600"/> Soạn thảo: {activeChapter1Section || "Chọn mục bên trái"}</h4><div className="flex items-center gap-2"><span className="text-xs text-gray-400 mr-2">{chapter1Content.length} ký tự</span><button onClick={handleSaveOutline} disabled={isSaving || !activeChapter1Section} className="flex items-center text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">{isSaving ? <RefreshCw size={12} className="animate-spin mr-1"/> : <Save size={12} className="mr-1"/>} Lưu toàn bộ</button></div></div>
                <div className="flex gap-2 mb-2 bg-gray-50 p-2 rounded-lg overflow-x-auto items-center">
                    {/* LANGUAGE SELECTOR */}
                    <div className="relative min-w-[140px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe size={16} className="text-gray-500" />
                        </div>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="appearance-none w-full pl-9 pr-8 py-2 rounded-lg text-sm font-bold border border-gray-200 bg-white text-gray-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronRight size={14} className="text-gray-400 rotate-90" />
                        </div>
                    </div>

                    <button onClick={handleSmartWrite} disabled={!activeChapter1Section || isWritingSection || isRecursiveWriting} className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${chapter1Content.length > 50 ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:opacity-50`}>
                        {isWritingSection ? <RefreshCw size={16} className="animate-spin mr-2"/> : <Wand2 size={16} className="mr-2"/>}
                        {selectedEvidence.length > 0 ? `Tổng hợp & Viết lại (${selectedEvidence.length})` : (chapter1Content.length > 50 ? `Nâng cấp văn phong` : `Viết nháp tự động`)}
                    </button>
                    {/* RECURSIVE WRITE BUTTON */}
                    <button onClick={handleRecursiveWrite} disabled={!activeChapter1Section || isWritingSection || isRecursiveWriting} className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-bold transition bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 whitespace-nowrap shadow-sm border border-purple-200" title="AI sẽ viết tự động toàn bộ các mục con của phần này">
                        {isRecursiveWriting ? <RefreshCw size={16} className="animate-spin mr-2"/> : <Zap size={16} className="mr-2"/>}
                        {isRecursiveWriting ? 'Đang viết trọn bộ...' : 'Viết trọn bộ phần này (Auto-Fill)'}
                    </button>
                </div>
                <textarea ref={textareaRef} className="flex-1 w-full p-6 border border-gray-100 bg-white rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none font-serif text-lg text-gray-800 shadow-inner custom-scrollbar" style={{ textAlign: 'justify', lineHeight: '1.6' }} placeholder="Bắt đầu viết nội dung tại đây... Hãy chọn một mục bên trái để bắt đầu." value={chapter1Content} onChange={handleContentChange} disabled={!activeChapter1Section}></textarea></div>
            </div>
          </div>
          
          {/* SURVEY PREVIEW MODAL */}
          {surveyPreview && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col relative">

                  {/* ĐOẠN BẠN MỚI THÊM VÀO ĐÂY */}
                    <style>{`
                        .survey-table th, .survey-table td { 
                            text-align: center !important; 
                            vertical-align: middle !important; 
                        }
                        .survey-table th:nth-child(2), .survey-table td:nth-child(2) { 
                            text-align: left !important; 
                            padding-left: 12px !important;
                        }
                    `}</style>

                      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                          <div className="flex items-center">
                              <Table size={20} className="mr-2 text-orange-600"/>
                              <h3 className="font-bold text-lg text-gray-800">Nhập liệu & Xem Bảng hỏi ({previewSection})</h3>
                          </div>
                          
                          {/* MODAL TOOLBAR */}
                          <div className="flex gap-2">
                              <button onClick={() => {
                                  if (editableTableRef.current) {
                                      const tbody = editableTableRef.current.querySelector('tbody');
                                      if (tbody) {
                                          const lastRow = tbody.lastElementChild;
                                          if (lastRow) {
                                              const newRow = lastRow.cloneNode(true) as HTMLElement; // Added HTMLElement type assertion
                                              // Clear cell content
                                              Array.from(newRow.children).forEach((cell: any) => {
                                                  // Keep delete button if it exists, otherwise clear text
                                                  if (!cell.querySelector('button')) cell.innerText = ''; 
                                              });
                                              // Also clear selection visual
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
                                      // TRIGGER MODAL INSTEAD OF NATIVE CONFIRM
                                      // Ensure index is captured fresh just in case
                                      rowToDeleteIndex.current = activeRowRef.current.rowIndex;
                                      setShowDeleteRowConfirm(true);
                                  } else {
                                      // SHOW ERROR BANNER INSTEAD OF ALERT (Or Modal)
                                      setShowNoRowSelectedWarning(true);
                                  }
                              }} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 text-sm flex items-center transition">
                                  <MinusCircle size={16} className="mr-1"/> Xóa dòng chọn
                              </button>

                              <button onClick={() => {
                                  if (editableTableRef.current && previewSection) {
                                      const updatedHtml = editableTableRef.current.innerHTML;
                                      
                                      // 1. Update Local State immediately
                                      setSurveyMap(prev => ({ ...prev, [previewSection]: updatedHtml }));

                                      // 2. Update Preview State
                                      setSurveyPreview(updatedHtml);

                                      // 3. Show In-UI Success Message
                                      setSaveMessage({ text: "Đã lưu dữ liệu thành công!", type: 'success' });
                                      setTimeout(() => setSaveMessage(null), 3000);
                                  }
                              }} className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 text-sm flex items-center shadow-sm transition hover:scale-105 ml-2">
                                  <Save size={16} className="mr-1"/> Lưu Dữ Liệu
                              </button>
                              
                              <button onClick={() => setSurveyPreview(null)} className="hover:bg-gray-200 p-2 rounded-full transition"><X size={20}/></button>
                          </div>
                      </div>
                      
                      {/* SUCCESS/ERROR BANNER */}
                      {saveMessage && (
                          <div className={`text-center py-2 px-4 text-sm font-bold animate-fade-in ${saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {saveMessage.type === 'success' ? <CheckCircle size={16} className="inline mr-2 -mt-1"/> : <AlertCircle size={16} className="inline mr-2 -mt-1"/>}
                              {saveMessage.text}
                          </div>
                      )}
                      
                      <div className="bg-yellow-50 p-3 text-xs text-yellow-800 border-b border-yellow-100 text-center">
                           * Bạn có thể <strong>click trực tiếp vào các ô</strong> trong bảng dưới đây để nhập số liệu (Số lượng, Tỷ lệ %). <br/>
                           Sau đó bấm nút <strong>Lưu Dữ Liệu</strong> màu xanh ở trên để hệ thống ghi nhận trước khi đóng cửa sổ.
                      </div>
                      
                      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white survey-table-container" onKeyDown={handleTableKeyDown} onFocusCapture={handleTableFocus} onClick={handleTableClick}>
                          <div 
                              ref={editableTableRef}
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              className="survey-table outline-none border border-transparent focus:border-blue-200 p-2 rounded"
                              // Initialize with current HTML
                              dangerouslySetInnerHTML={{__html: surveyPreview}} 
                              // Visual cue when editing
                              onFocus={(e) => e.currentTarget.classList.add('ring-2', 'ring-blue-100')}
                              onBlur={(e) => e.currentTarget.classList.remove('ring-2', 'ring-blue-100')}
                          />
                      </div>
                      
                      <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                          <button onClick={() => setSurveyPreview(null)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition">Đóng</button>
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
                             // Use the Index to find the row in the *current* DOM (post re-render)
                             if (editableTableRef.current && rowToDeleteIndex.current > -1) {
                                 // Need to find the correct row. Since table structure is simple:
                                 // The raw HTML structure is usually `<table><thead>...</thead><tbody><tr>...</tr>...</tbody></table>`
                                 // rowIndex on a TR counts from the top of the table (including thead).
                                 
                                 const allRows = editableTableRef.current.querySelectorAll('tr');
                                 const targetRow = allRows[rowToDeleteIndex.current];
                                 
                                 if (targetRow) {
                                     // Ensure we are not deleting the only data row if desired, or header
                                     // Assuming typical structure: Header is row 0.
                                     if (allRows.length > 2) { // Header + at least 1 data row
                                         targetRow.remove();
                                         
                                         // SYNC
                                         const updatedHtml = editableTableRef.current.innerHTML;
                                         setSurveyPreview(updatedHtml);
                                         setSurveyMap(prev => ({ ...prev, [previewSection]: updatedHtml }));
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

          {/* DELETE SURVEY CONFIRMATION MODAL */}
          {surveyToDelete && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 animate-fade-in">
                 <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up">
                     <div className="flex items-center text-red-600 mb-4">
                         <Trash2 size={32} className="mr-3" />
                         <h3 className="text-xl font-bold">Xác nhận Xóa Bảng hỏi</h3>
                     </div>
                     <p className="text-gray-600 mb-6">
                         Bạn có chắc chắn muốn xóa bảng hỏi của mục: <br/>
                         <span className="font-bold text-gray-800">"{surveyToDelete}"</span> không?
                         <br/><span className="text-red-500 text-xs mt-2 block font-medium">Hành động này không thể hoàn tác.</span>
                     </p>
                     <div className="flex justify-end space-x-3">
                         <button onClick={() => setSurveyToDelete(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition">Hủy bỏ</button>
                         <button onClick={confirmDeleteSurvey} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-lg">Xác nhận Xóa</button>
                     </div>
                 </div>
             </div>
          )}

          {/* IMPORTANT: ADD THIS TO RENDER IN STEP 4 */}
          {showPermissionModal && setupStep === 4 && <PermissionModal />}
      </div>
    );
  };

  return (
    <div className="animate-fade-in p-4">
        {view === 'list' && (
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Dự án Học thuật (Luận văn & Đề án)</h2>
                    <p className="text-gray-500 mb-8">Quản lý và thực hiện các dự án nghiên cứu học thuật của bạn.</p>

                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-8">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-purple-900 mb-2">Nhập Mã học viên để tải dự án cũ:</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={studentInfo.id} 
                                        onChange={e => setStudentInfo({...studentInfo, id: e.target.value})} 
                                        onKeyDown={(e) => e.key === 'Enter' && studentInfo.id && fetchMyProjects(studentInfo.id)}
                                        placeholder="VD: HV123456" 
                                        className="flex-1 border p-3 rounded-lg outline-none"
                                    />
                                    <button onClick={() => fetchMyProjects(studentInfo.id)} disabled={isLoadingProjects || !studentInfo.id} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50">
                                        {isLoadingProjects ? 'Đang tải...' : 'Tìm dự án'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div onClick={handleCreateNew} className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-purple-400 transition cursor-pointer mb-8 group">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 text-purple-600 group-hover:scale-110 transition"><Plus size={32}/></div>
                        <h3 className="font-bold text-lg text-gray-800">Tạo Dự án Mới</h3>
                        <p className="text-sm text-gray-500">Bắt đầu xây dựng Luận văn, Đề án hoặc Tiểu luận mới</p>
                    </div>

                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Danh sách Dự án của tôi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myProjects.length > 0 ? myProjects.map(p => {
                            const pType = PROJECT_TYPES.find(t => t.id === p.projectType);
                            return (
                                <div key={p.id} onClick={() => handleSelectProject(p)} className="border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition bg-white relative group">
                                    <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-purple-100 text-purple-700">{pType?.label || "Dự án"}</div>
                                    <h3 className="font-bold text-lg text-gray-800 mb-2 pr-24 line-clamp-2 group-hover:text-purple-700">{p.topic}</h3>
                                    <div className="flex items-center text-sm text-gray-500 mb-4">
                                        <User size={14} className="mr-1"/> {p.studentInfo.name || "Tác giả"}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-400 mt-4 border-t pt-3">
                                        <Clock size={12} className="mr-1"/> Cập nhật: {formatDate(p.createdAt)}
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-gray-500 italic col-span-2 text-center py-4 bg-gray-50 rounded-lg">Chưa có dự án nào. Hãy nhập Mã học viên hoặc tạo mới.</p>
                        )}
                    </div>
                </div>
            </div>
        )}

        {view === 'wizard' && (
            <>
                {setupStep === 0 && (
                    <div className="text-center py-8">
                
                        {renderSetupStep0_Info()}
                    </div>
                )}
                {setupStep === 1 && <div className="text-center py-8">{renderSetupStep1_Topic()}</div>}
                {setupStep === 2 && <div className="text-center py-8">{renderSetupStep2_Check()}</div>}
                {setupStep === 3 && renderSetupStep3_Outline()}
                {setupStep === 4 && renderStep4_Overview()}
            </>
        )}

        {showToolsModal && renderToolsModal()}
        {showPermissionModal && (setupStep !== 4) && <PermissionModal />}
    </div>
  );
};
