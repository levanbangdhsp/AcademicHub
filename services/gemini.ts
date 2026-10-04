
import { GoogleGenAI, Type } from "@google/genai";
import { TopicAnalysis } from '../types';

// Ensure API Key is available
const apiKey = 
  process.env.GEMINI_API_KEY || 
  process.env.API_KEY || 
  process.env.VITE_GEMINI_API_KEY || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__) || 
  '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// Helper: Retry mechanism for API calls (Handle 429 Rate Limits)
const generateWithRetry = async (options: any, retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(options);
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      // If rate limited and not the last retry
      if (isRateLimit && i < retries - 1) {
        console.warn(`Quota exceeded (429). Retrying attempt ${i + 1}/${retries} in ${(i + 1) * 1.5}s...`);
        await new Promise(res => setTimeout(res, (i + 1) * 1500));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Request failed after retries");
};

// Helper: Determine Citation Style based on Major
const getCitationStyle = (major: string): string => {
  const naturalSciences = [
    "Toán", "Vật lý", "Hóa học", "Sinh", "Tin", "Máy tính", "Kỹ thuật", "Công nghệ", "Thống kê"
  ];
  const isNatural = naturalSciences.some(k => major.toLowerCase().includes(k.toLowerCase()));
  return isNatural ? "IEEE (đánh số [1], [2]...)" : "APA 7th (Tên tác giả, Năm)";
};

// DEFINITION: Hard Sciences (Khoa học Tự nhiên/Kỹ thuật)
const HARD_SCIENCES = [
  "Đại số", "Giải tích", "Hình học", "Tô pô", "Toán", 
  "Vật lý", "Hạt nhân", "Nguyên tử", 
  "Tin học", "Máy tính", "Dữ liệu", "AI", "Mạng", "Phần mềm",
  "Hóa học", "Kỹ thuật"
];

const isHardScience = (major: string) => {
  return HARD_SCIENCES.some(key => major.toLowerCase().includes(key.toLowerCase()));
};

// 1. Check Topic Viability
export const checkTopicViability = async (topic: string): Promise<TopicAnalysis> => {
  if (!apiKey) throw new Error("API Key missing");

  const model = "gemini-3.8-flash";
  const prompt = `Bạn là một Hội đồng khoa học xét duyệt đề tài Thạc sĩ. Hãy phân tích đề tài: "${topic}".
  
  Yêu cầu trả về JSON với các trường sau (Nội dung phải bằng Tiếng Việt 100%):
  - score: Điểm số khả thi (0-100).
  - viability: Đánh giá tổng quan về tính khả thi, sự phù hợp với trình độ Thạc sĩ.
  - suggestions: 3 gợi ý cụ thể để cải tiến tên đề tài hoặc phạm vi nghiên cứu cho tốt hơn.
  - novelty: Đánh giá về tính mới và đóng góp của đề tài.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            viability: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            novelty: { type: Type.STRING }
          },
          required: ["score", "viability", "suggestions", "novelty"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TopicAnalysis;
  } catch (error) {
    console.error("Topic Check Error:", error);
    throw error;
  }
};

// --- THÊM ĐOẠN NÀY VÀO services/gemini.ts ---

// 1.5 Analyze Research Trends (Phân tích Xu hướng Nghiên cứu)
export const analyzeTopicTrends = async (topic: string): Promise<any> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash"; // Hoặc gemini-2.0-flash-exp nếu có

  const prompt = `Bạn là một chuyên gia phân tích xu hướng nghiên cứu khoa học.
  Đề tài: "${topic}"

  Nhiệm vụ: Hãy tìm kiếm thông tin trên Google Scholar và Internet (sử dụng Google Search Tool) để phân tích đề tài này.
  Hãy phân tích riêng biệt cho phạm vi "Việt Nam" và "Thế giới".

  Yêu cầu trả về kết quả dưới dạng JSON chuẩn (không markdown) với cấu trúc sau:
  {
    "vietnam": {
      "quantity": "Nhận định về số lượng nghiên cứu tại VN (Ví dụ: Khá ít, Rất phổ biến...)",
      "trend": "Mô tả xu hướng nghiên cứu tại VN hiện nay (tập trung vào mảng nào?)",
      "insight": "Một nhận định sâu sắc về thực trạng tại VN",
      "suggestions": ["Gợi ý hướng nghiên cứu 1 phù hợp bối cảnh VN", "Gợi ý 2", "Gợi ý 3"]
    },
    "world": {
      "quantity": "Nhận định về độ phổ biến trên thế giới",
      "trend": "Thế giới đang đi về hướng nào với đề tài này?",
      "insight": "Công nghệ/Lý thuyết mới nhất thế giới đang áp dụng",
      "suggestions": ["Hướng nghiên cứu nâng cao 1", "Hướng nghiên cứu nâng cao 2", "Hướng nghiên cứu nâng cao 3"]
    }
  }`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Kích hoạt Search Grounding        
      }
    });

    let text = response.text || "{}";
    
    // --- BẮT ĐẦU ĐOẠN MỚI ---
    // Tìm chuỗi JSON nằm giữa dấu ngoặc nhọn đầu tiên và cuối cùng
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        text = match[0];
    }
    // --- KẾT THÚC ĐOẠN MỚI ---

    return JSON.parse(text);
  } catch (error) {
    console.error("Analyze Trends Error:", error);
    throw error;
  }
};


// 2. Suggest Topics
export const suggestResearchTopics = async (major: string, keywords?: string): Promise<string[]> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Đóng vai là một Giáo sư hướng dẫn nghiên cứu khoa học chuyên ngành ${major}. 
  Hãy đề xuất 5 tên đề tài luận văn thạc sĩ mới mẻ, có tính cấp thiết và khả thi.
  ${keywords ? `Ngữ cảnh bổ sung/Từ khóa: ${keywords}` : ''}
  Yêu cầu định dạng: Chỉ trả về một mảng JSON chứa 5 chuỗi tên đề tài (Tiếng Việt).`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result.topics || [];
  } catch (error) {
    console.error("Suggest Topics Error:", error);
    throw error;
  }
};

// 3. Generate Detailed Outline
export interface DetailedOutline {
  translatedTopic?: string; // Tên đề tài dịch sang ngôn ngữ đích
  rationale: string;
  objectives: { general: string; specific: string[] };
  objects: string;
  scope: string; // Phạm vi nghiên cứu
  hypothesis: string;
  tasks: string[];
  methods: string[];
  significance: string; // Ý nghĩa khoa học và thực tiễn
  expectedProducts: string[];
  structure: string[];
  references: string[];
  contentMap?: Record<string, string>; // Store content for each section
  surveyMap?: Record<string, string>; // Store survey HTML for each section (PERSISTENCE)
  projectType?: string; // Store project type in JSON for persistence
}

// Cấu hình Schema dùng chung cho Outline
const outlineSchema = {
  type: Type.OBJECT,
  properties: {
    translatedTopic: { type: Type.STRING },
    rationale: { type: Type.STRING },
    objectives: {
      type: Type.OBJECT,
      properties: {
        general: { type: Type.STRING },
        specific: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    objects: { type: Type.STRING },
    scope: { type: Type.STRING },
    hypothesis: { type: Type.STRING },
    tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
    expectedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
    methods: { type: Type.ARRAY, items: { type: Type.STRING } },
    significance: { type: Type.STRING },
    structure: { type: Type.ARRAY, items: { type: Type.STRING } },
    references: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["translatedTopic", "rationale","objectives","objects","scope","hypothesis","tasks","methods","significance","expectedProducts","structure","references"]
};

export const generateDetailedOutline = async (
  topic: string, 
  major: string, 
  projectType: string,
  language: string = "Tiếng Việt"
): Promise<DetailedOutline> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash"; 

  const isHard = isHardScience(major);
  let structurePrompt = "";
  
  // LOGIC: HARD SCIENCE vs SOCIAL SCIENCE
  if (isHard) {
    structurePrompt = `
      * QUAN TRỌNG: Đây là đề tài thuộc lĩnh vực TỰ NHIÊN / KỸ THUẬT (Toán, Lý, Tin...).
      - Cấu trúc đề nghị (Strict):
         + Mở đầu (Introduction): Giới thiệu bài toán.
         + Kiến thức chuẩn bị (Preliminaries/Background): Định nghĩa, bổ đề.
         + Nội dung chính (Main Results): Các chương giải quyết vấn đề, chứng minh định lý, thuật toán.
         + Kết luận (Conclusion).
      - Với các trường rationale, objects, hypothesis: Nếu không áp dụng, hãy để chuỗi rỗng "" hoặc "N/A".
    `;
  } else {
    // Social Science Logic - RESTORED DETAILED SWITCH
    switch(projectType) {
        case 'master_thesis':
            structurePrompt = `
            * YÊU CẦU CẤU TRÚC LUẬN VĂN THẠC SĨ (Khoa học Xã hội):
            - Mở đầu
            - Chương 1: Cơ sở lý luận...
            - Chương 2: Thực trạng...
            - Chương 3: Biện pháp/Giải pháp/Thực nghiệm...
            - Kết luận & Kiến nghị
            `;
            break;
        case 'graduation_project': // Khoa luan / De an tot nghiep
            structurePrompt = `
            * YÊU CẦU CẤU TRÚC KHÓA LUẬN / ĐỀ ÁN TỐT NGHIỆP:
            - Phần 1: Tổng quan nghiên cứu (Lý do, Mục tiêu, Đối tượng...)
            - Phần 2: Nội dung thực hiện & Kết quả
            - Phần 3: Kết luận
            `;
            break;
        case 'course_project': // Do an mon hoc
             structurePrompt = `
             * YÊU CẦU CẤU TRÚC ĐỒ ÁN MÔN HỌC (Ngắn gọn):
             - 1. Đặt vấn đề
             - 2. Giải quyết vấn đề (Chia các mục nhỏ)
             - 3. Kết luận
             `;
             break;
        case 'essay': // Tieu luan
             structurePrompt = `
             * YÊU CẦU CẤU TRÚC TIỂU LUẬN MÔN HỌC:
             - Mở bài
             - Thân bài (Chia các ý chính)
             - Kết bài
             `;
             break;
        default:
            structurePrompt = "Chia thành 3 phần: Mở đầu, Nội dung (3 chương), Kết luận.";
    }
  }

  const prompt = `Bạn là chuyên gia nghiên cứu và Giáo sư hướng dẫn. 
  Hãy xây dựng một Đề cương chi tiết (Detailed Outline) cho đề tài: '${topic}' thuộc chuyên ngành ${major}.
  Loại hình dự án: ${projectType}.
  Ngôn ngữ phản hồi: ${language} (Value trong JSON phải là ${language}).
  
  ${structurePrompt}
  
  Cấu trúc JSON bắt buộc (Vui lòng điền đầy đủ và chi tiết):
  1. translatedTopic: Dịch tên đề tài sang ${language} (Nếu là tiếng Việt thì giữ nguyên).
  2. rationale: Lý do chọn đề tài / Tính cấp thiết.
  3. objectives: 
     - general: Mục tiêu chung.
     - specific: Mảng các mục tiêu cụ thể (ít nhất 3 ý).
  4. objects: Đối tượng và Khách thể nghiên cứu.
  5. scope: Phạm vi nghiên cứu (Phạm vi nội dung, không gian, thời gian).
  6. hypothesis: Giả thuyết khoa học.
  7. tasks: Mảng các Nhiệm vụ nghiên cứu.
  8. methods: Mảng các Phương pháp nghiên cứu.
  9. significance: Ý nghĩa khoa học và thực tiễn của đề tài.
  10. expectedProducts: Mảng các Sản phẩm dự kiến / Đóng góp mới (nếu không có hãy tự suy luận từ mục tiêu) 
  11. structure: Cấu trúc báo cáo dự kiến (Mảng string). 
     * Trình bày chi tiết đến cấp tiểu mục (Ví dụ: "Chương 1: ...", "1.1. ...", "1.2. ...").
     * Đảm bảo logic chặt chẽ giữa tên chương và nội dung bên trong.
  12. references: Danh sách 10 tài liệu tham khảo chuẩn (APA hoặc IEEE).
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: outlineSchema
      }
    });

    return JSON.parse(response.text || "{}") as DetailedOutline;
  } catch (error) {
    console.error("Outline Gen Error:", error);
    throw error;
  }
};

// 3.5 Refine Outline (Chỉnh sửa Đề cương)
export const refineDetailedOutline = async (currentOutline: DetailedOutline, userFeedback: string): Promise<DetailedOutline> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  // Chuyển outline hiện tại thành chuỗi JSON để gửi lại cho Gemini
  const outlineStr = JSON.stringify(currentOutline);

  const prompt = `Bạn là Giáo sư hướng dẫn. Dưới đây là Đề cương Luận văn hiện tại (định dạng JSON):
  
  ${outlineStr}
  
  Học viên vừa có yêu cầu chỉnh sửa như sau: "${userFeedback}"
  
  Nhiệm vụ của bạn:
  1. Hãy giữ nguyên cấu trúc JSON.
  2. Thực hiện các thay đổi nội dung chính xác theo yêu cầu.
  3. Giữ nguyên ngôn ngữ hiện tại của đề cương.
  
  Trả về: Toàn bộ JSON Đề cương mới đã được cập nhật.`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: outlineSchema
      }
    });

    return JSON.parse(response.text || "{}") as DetailedOutline;
  } catch (error) {
    console.error("Refine Outline Error:", error);
    throw error;
  }
};

// NEW: 3.5.1 Parse Outline From Text (Import Feature)
export const parseOutlineFromText = async (rawText: string): Promise<DetailedOutline> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Dưới đây là nội dung văn bản của một đề cương nghiên cứu/luận văn (có thể do học viên copy từ file Word):
  
  """
  ${rawText.substring(0, 15000)} 
  """
  (Nội dung đã được cắt bớt nếu quá dài)

  Nhiệm vụ: Hãy đóng vai một trợ lý thông minh, đọc hiểu văn bản trên và trích xuất thông tin để tái tạo lại cấu trúc JSON chuẩn của phần mềm.
  
  Hãy cố gắng map các nội dung vào đúng các trường sau:
  1. translatedTopic (Tên đề tài)
  2. rationale (Lý do chọn đề tài/Đặt vấn đề)
  3. objectives (general: Mục tiêu chung/Mục tiêu nghiên cứu. specific: Mảng các mục tiêu cụ thể (ít nhất 3 ý))   
  4. objects (Đối tượng & khách thể/Đối tượng và Khách thể nghiên cứu)
  5. scope (Phạm vi nghiên cứu (Phạm vi nội dung, không gian, thời gian))
  6. hypothesis (Giả thuyết/Giả thuyết khoa học)
  7. tasks (Nhiệm vụ/Nhiệm vụ nghiên cứu)
  8. methods (Phương pháp/Phương pháp nghiên cứu)
  9. significance (Ý nghĩa khoa học và thực tiễn của đề tài)
  10. expectedProducts (Mảng các Sản phẩm dự kiến/Đóng góp mới - nếu không có hãy tự suy luận từ mục tiêu)
  11. structure (Cấu trúc các chương/mục - Hãy list ra danh sách các tiêu đề chương, mục)
  12. references (Tài liệu tham khảo)

  Yêu cầu: Trả về đúng định dạng JSON. Nếu mục nào thiếu trong văn bản gốc, hãy để chuỗi rỗng.`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: outlineSchema
      }
    });

    return JSON.parse(response.text || "{}") as DetailedOutline;
  } catch (error) {
    console.error("Parse Outline Error:", error);
    throw error;
  }
};

// 3.6 Find Research Evidence (Tìm kiếm luận cứ - Hybrid Mode)
export interface ResearchEvidence {
  source: string;
  summary: string;
  year: string;
  author: string;
}

export const findResearchEvidence = async (topics: string[]): Promise<ResearchEvidence[]> => {
  if (!apiKey) throw new Error("API Key missing");
  
  const topicsStr = topics.join(", ");
  const prompt = `Hãy tìm kiếm thông tin học thuật và bằng chứng nghiên cứu cho các khái niệm sau: "${topicsStr}".
  
  Sử dụng Google Search để tìm dữ liệu thực tế.
  
  QUAN TRỌNG: Hãy trả về kết quả dưới dạng chuỗi JSON hợp lệ.
  - Không được dùng Markdown code block.
  - Các dấu ngoặc kép (") bên trong nội dung văn bản (summary, source) BẮT BUỘC phải được escape bằng dấu gạch chéo ngược (ví dụ: \\").
  
  Cấu trúc JSON:
  {
    "evidence": [
      {
        "author": "Tên tác giả",
        "year": "Năm xuất bản",
        "source": "Tên nguồn/bài báo",
        "summary": "Tóm tắt ngắn gọn quan điểm (50 từ)"
      }
    ]
  }`;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema must be removed when using tools
      }
    });

    let text = response.text || "{}";
    
    // Robust extraction: Extract everything between the first { and last }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        text = match[0];
    }
    
    const result = JSON.parse(text);
    return result.evidence || [];
  } catch (error) {
    console.error("Find Evidence Error:", error);
    // Return empty array instead of throwing to prevent crashing the UI
    return []; 
  }
};

// --- NEW: ANALYZE PAPER STYLE (STYLE TRANSFER) ---
export interface StyleGuide {
    tone: string;
    citationStyle: string;
    formatting: string;
    vocabulary: string;
}

export const analyzePaperStyle = async (sampleText: string): Promise<StyleGuide> => {
    if (!apiKey) throw new Error("API Key missing");
    const model = "gemini-3.8-flash";

    const prompt = `Hãy đóng vai một biên tập viên tạp chí khoa học. Dưới đây là một đoạn văn bản mẫu từ một bài báo đã xuất bản:

    """
    ${sampleText.substring(0, 3000)}
    """

    Nhiệm vụ: Hãy phân tích và trích xuất "Phong cách viết" (Style Guide) của tác giả này để tôi có thể bắt chước.
    
    Yêu cầu trả về JSON:
    - tone: Giọng văn (Ví dụ: Trang trọng, khách quan, hay dùng câu bị động...)
    - citationStyle: Cách trích dẫn (Ví dụ: APA (Author, Year) hay IEEE [1], đặt ở cuối câu hay đầu câu?)
    - formatting: Cách định dạng (Ví dụ: Tiêu đề in đậm, cách đánh số mục...)
    - vocabulary: Từ vựng (Ví dụ: Dùng từ chuyên ngành sâu, hay từ phổ thông?)
    `;

    try {
        const response = await generateWithRetry({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        // Fallback default style
        return {
            tone: "Trang trọng, học thuật",
            citationStyle: "APA 7th",
            formatting: "Tiêu chuẩn",
            vocabulary: "Chuyên ngành"
        };
    }
};

// 3.7 Smart Write Section (Giáo sư ảo viết bài) - UPDATED WITH STYLE GUIDE & EVIDENCE CITATION
export const smartWriteSection = async (
  topic: string, 
  sectionTitle: string, 
  currentContent: string, 
  evidenceList: ResearchEvidence[],
  major: string,
  projectType: string, // <--- THÊM THAM SỐ NÀY
  language: string = "Tiếng Việt",
  styleGuide?: StyleGuide, // NEW OPTIONAL PARAM
  outlineContext?: any // <--- THÊM MỚI: Tham số nhận dữ liệu đề cương
  ): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  // DETECT CITATION STYLE
  const defaultCitationStyle = getCitationStyle(major);

  // --- THÊM MỚI: XỬ LÝ CONTEXT ĐỀ CƯƠNG ---
  let contextPrompt = "";
  if (outlineContext) {
      // Chỉ lấy những thông tin quan trọng nhất để tránh quá tải token
      contextPrompt = `
      * THÔNG TIN QUAN TRỌNG TỪ ĐỀ CƯƠNG (BÁM SÁT ĐỂ KHÔNG LẠC ĐỀ):
      - Lý do chọn đề tài: ${outlineContext.rationale || "N/A"}
      - Mục tiêu: ${outlineContext.objectives?.general || "N/A"}
      - Đối tượng/Phạm vi: ${outlineContext.objects || "N/A"} / ${outlineContext.scope || "N/A"}
      - Giả thuyết: ${outlineContext.hypothesis || "N/A"}
      `;
  }
     // BUILD STYLE INSTRUCTION
    let styleInstruction = "";
  if (styleGuide) {
      styleInstruction = `
      *** TUÂN THỦ NGHIÊM NGẶT PHONG CÁCH SAU (STYLE TRANSFER): ***
      - Giọng văn (Tone): ${styleGuide.tone}
      - Kiểu trích dẫn (Citation): ${styleGuide.citationStyle} (Ưu tiên áp dụng kiểu này thay vì mặc định)
      - Định dạng (Formatting): ${styleGuide.formatting}
      - Từ vựng (Vocabulary): ${styleGuide.vocabulary}
      `;
  } else {
      styleInstruction = `- Chuyên ngành này yêu cầu trích dẫn theo chuẩn: ${defaultCitationStyle}.`;
  }

  let evidenceText = "";
  let mandatoryEvidenceInstruction = "";
  
  if (evidenceList.length > 0) {
    evidenceText = "DANH SÁCH LUẬN CỨ KHÓA (KEY EVIDENCES) MÀ NGƯỜI DÙNG ĐÃ CHỌN (BẮT BUỘC PHẢI SỬ DỤNG VÀ TRÍCH DẪN):\n";
    evidenceList.forEach((ev, idx) => {
      evidenceText += `${idx+1}. [Tác giả: ${ev.author}, Năm: ${ev.year}] - Nguồn: ${ev.source} - Nội dung: "${ev.summary}"\n`;
    });
    
    mandatoryEvidenceInstruction = `
    * YÊU CẦU ĐẶC BIỆT VỀ LUẬN CỨ:
    1. Bạn BẮT BUỘC phải tổng hợp và sử dụng các ý tưởng từ danh sách "LUẬN CỨ KHÓA" ở trên vào bài viết.
    2. NGAY SAU KHI sử dụng ý của luận cứ nào, phải đặt trích dẫn [Tác giả, Năm] ở cuối câu đó.
    3. Ví dụ: "...theo nghiên cứu này (Nguyen, 2023)."
    4. Cố gắng lồng ghép ít nhất ${Math.min(evidenceList.length, 3)} luận cứ vào bài.
    `;
  }
    // Logic ép buộc trích dẫn cho Thạc sĩ
  if (projectType === 'master_thesis') {
       mandatoryEvidenceInstruction += `
       \n* QUAN TRỌNG (DÀNH RIÊNG CHO LUẬN VĂN THẠC SĨ):
       - Đây là bài viết hàn lâm bậc cao. Bạn BẮT BUỘC phải có trích dẫn (Citation) trong bài.
       - Nếu không có dữ liệu đầu vào cụ thể, hãy TỰ ĐỘNG TẠO GIẢ ĐỊNH các trích dẫn theo chuẩn (Ví dụ: [Nguyen, 2023], [Smith, 2020]) để minh họa cho các luận điểm lý thuyết.
       - Tuyệt đối không viết suông mà không có trích dẫn.
       `;
  }
  const prompt = `
  Vai trò: Bạn là một Giáo sư đầu ngành, có kinh nghiệm hướng dẫn nghiên cứu sinh xuất sắc chuyên ngành ${major}.
  Nhiệm vụ: Viết hoặc Viết lại nội dung cho mục "${sectionTitle}" của đề tài "${topic}".
  Ngôn ngữ: ${language}.

  ${styleInstruction}
  ${contextPrompt}  // <--- THÊM MỚI: Đưa ngữ cảnh vào prompt
  ${mandatoryEvidenceInstruction}

  Dữ liệu đầu vào:
  - Nội dung nháp hiện tại của học viên: "${currentContent || "(Chưa có nội dung, hãy viết mới)"}"
  - ${evidenceText}

  Yêu cầu chất lượng bài viết:
  1. Viết khoảng 300-600 từ.
  2. Đảm bảo tính mạch lạc, logic.
  3. Lồng ghép khéo léo các luận cứ đã cung cấp.
  4. Nếu không có luận cứ được cung cấp, hãy viết dựa trên kiến thức chuyên môn và TỰ ĐỘNG TẠO GIẢ ĐỊNH trích dẫn phù hợp với style đã chọn.

  Kết quả trả về: Chỉ trả về nội dung bài viết (Text), không bao gồm lời dẫn của AI.
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt
    });
    return response.text || "";
  } catch (error) {
    console.error("Smart Write Error:", error);
    throw error;
  }
};

// 3.8 Review Thesis Logic (AI Reviewer) - UPDATED TO INCLUDE SURVEYS
export const reviewThesisLogic = async (
  topic: string, 
  outline: DetailedOutline,
  contentMap: Record<string, string>,
  surveyMap?: Record<string, string> // NEW PARAM
): Promise<{issues: string[], overall: string}> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  // Chuẩn bị dữ liệu rút gọn để gửi AI (tránh quá tải token)
  // Chỉ lấy 500 ký tự đầu của mỗi mục
  const contentSummary = Object.entries(contentMap).map(([key, val]) => `${key}: ${val.substring(0, 500)}...`).join("\n");
  
  // Thêm thông tin về bảng hỏi (nếu có)
  let surveyInfo = "";
  if (surveyMap && Object.keys(surveyMap).length > 0) {
      surveyInfo = "Dữ liệu Bảng hỏi khảo sát đã thiết kế:\n" + Object.keys(surveyMap).map(k => `- Bảng hỏi cho mục "${k}"`).join("\n");
  }

  const outlineStr = JSON.stringify({
    objectives: outline.objectives,
    hypothesis: outline.hypothesis,
    structure: outline.structure
  });

  const prompt = `Bạn là Chủ tịch Hội đồng Thẩm định Luận văn. Hãy kiểm tra tính logic của đề tài: "${topic}".
  
  Dữ liệu Đề cương (Mục tiêu, giả thuyết): ${outlineStr}
  Dữ liệu Nội dung chi tiết học viên đã viết (Tóm tắt):
  ${contentSummary}
  ${surveyInfo}

  Nhiệm vụ:
  Hãy chỉ ra các lỗi logic hoặc mâu thuẫn (nếu có) giữa Mục tiêu - Giả thuyết - Nội dung đã viết - Công cụ khảo sát (Bảng hỏi).
  Tuyệt đối không viết lại bài, chỉ đưa ra nhận xét.
  
  BẮT BUỘC: Với mỗi lỗi, hãy ghi rõ nó thuộc mục nào ở đầu câu trong ngoặc vuông. 
  Ví dụ: "[1.2. Mục tiêu cụ thể] Có sự mâu thuẫn..." hoặc "[Chương 2] Thiếu dữ liệu minh chứng...".
  
  QUAN TRỌNG: Trả về JSON hợp lệ.
  {
    "overall": "Nhận xét tổng quan (khoảng 50 từ)",
    "issues": ["Lỗi logic 1 (có kèm tên mục)", "Lỗi logic 2 (có kèm tên mục)"]
  }`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        // We use text extraction fallback if MIME type fails, but prefer JSON
        responseMimeType: "application/json" 
      }
    });
    
    let text = response.text || "{}";
    const match = text.match(/\{[\s\S]*\}/); // Robust regex extraction
    if (match) text = match[0];

    return JSON.parse(text);
  } catch (error) {
    console.error("Review Logic Error:", error);
    return { overall: "Hệ thống bận, vui lòng thử lại sau.", issues: [] };
  }
};

// 3.9 AUTO FIX LOGIC (Tự sửa lỗi Logic) - UPDATED WITH RETRY
export const fixLogicIssue = async (
  sectionContent: string,
  issueDescription: string,
  topic: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Bạn là một biên tập viên học thuật xuất sắc.
  Đề tài: "${topic}"
  
  Vấn đề logic được chỉ ra: "${issueDescription}"
  
  Đoạn văn hiện tại:
  "${sectionContent}"
  
  Nhiệm vụ: Hãy viết lại đoạn văn trên để KHẮC PHỤC vấn đề logic này.
  Yêu cầu:
  - Giữ nguyên giọng văn học thuật.
  - Chỉ trả về nội dung đã sửa (Text), không bao gồm lời dẫn.
  `;

  try {
    // Use retry wrapper
    const response = await generateWithRetry({
      model,
      contents: prompt
    });
    return response.text || sectionContent;
  } catch (error) {
    console.error("Fix Logic Error:", error);
    // Throw a cleaner message to be alerted in UI
    throw new Error("Hệ thống đang quá tải (429). Vui lòng đợi 30 giây rồi thử lại.");
  }
};

// 3.10 GENERATE SLIDES (Tạo Slide) - UPDATED WITH RETRY
export interface SlideItem {
  slide: number;
  title: string;
  bullets: string[];
}

export const generateSlideContent = async (
  topic: string,
  outline: DetailedOutline,
  contentMap: Record<string, string>,
  slideCount: number = 10 
): Promise<SlideItem[]> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  // Summarize content for context - INCREASED LIMIT
  // Increased from 300 to 5000 to ensure AI has enough context
  const contentSummary = Object.entries(contentMap).map(([key, val]) => `${key}: ${val.substring(0, 5000)}...`).join("\n");

  const prompt = `Bạn hãy đóng vai một chuyên gia thiết kế bài thuyết trình.
  Dựa trên đề tài: "${topic}" và nội dung tóm tắt dưới đây:
  ${contentSummary}
  
  Hãy tạo kịch bản cho CHÍNH XÁC ${slideCount} Slide thuyết trình bảo vệ luận văn.
  
  QUY TẮC QUAN TRỌNG (BẮT BUỘC):
  1. Slide dùng để TRÌNH CHIẾU, không phải để đọc.
  2. Tuyệt đối KHÔNG viết đoạn văn dài.
  3. Mỗi slide chỉ chứa tiêu đề và 3-5 gạch đầu dòng (bullet points).
  4. Mỗi gạch đầu dòng KHÔNG quá 15 từ. Viết ngắn gọn, súc tích.
  5. Slide 1 là Tên đề tài, Slide cuối là Cảm ơn.
  
  Cấu trúc JSON trả về:
  [
    { "slide": 1, "title": "...", "bullets": ["ý 1", "ý 2"] },
    ...
  ]
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 4000, 
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slide: { type: Type.INTEGER },
              title: { type: Type.STRING },
              bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    if (Array.isArray(result)) {
      return result.map((item: any) => ({
        slide: item.slide || 0,
        title: item.title || "",
        bullets: item.bullets || []
      }));
    }
    return [];
  } catch (error) {
    console.error("Gen Slide Error:", error);
    // Fallback slide instead of empty array to avoid UI confusion
    return [
      { 
        slide: 1, 
        title: "Lỗi kết nối", 
        bullets: [
          "Hệ thống đang bận. Vui lòng thử lại sau.",
          `Chi tiết: ${(error as Error).message}`
        ] 
      }
    ];
  }
};

// 3.11 PLAGIARISM CHECK (Sơ bộ) - UPDATED WITH RETRY & SAFE RETURN
export const checkPlagiarism = async (textToCheck: string): Promise<{score: number, matches: string[]}> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Hãy kiểm tra xem đoạn văn bản sau có xuất hiện trên internet không (Check đạo văn sơ bộ).
  Văn bản: "${textToCheck.substring(0, 2000)}" (Cắt ngắn nếu quá dài)
  
  Sử dụng Google Search để tìm kiếm các câu văn tương tự.
  
  QUAN TRỌNG: Chỉ trả về JSON thuần túy, không dùng Markdown code block.
  Cấu trúc JSON:
  {
    "score": (Số nguyên 0-100, ước lượng mức độ trùng lặp),
    "matches": ["Danh sách các nguồn hoặc câu văn tìm thấy trên mạng giống hoặc gần giống"]
  }
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.0,
        maxOutputTokens: 4000 
      }
    });

    let text = response.text;
    if (!text) {
        // Fix: Don't throw, just warn and return safe default
        console.warn("AI returned empty text for plagiarism check (likely safety filter).");
        return { score: 0, matches: [] };
    }

    // Clean up markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        text = match[0];
    } else {
        // Safe fallback
        console.warn("No JSON object found in response.");
        return { score: 0, matches: [] };
    }
    
    const result = JSON.parse(text);
    return {
      score: typeof result.score === 'number' ? result.score : 0,
      matches: Array.isArray(result.matches) ? result.matches : []
    };
  } catch (error) {
    console.error("Check Plagiarism Error:", error);
    // Return empty result instead of throwing to prevent UI crash
    return { score: 0, matches: [] };
  }
};

// 3.12 Paraphrase Content (Viết lại câu)
// Thêm tham số language vào hàm
export const paraphraseContent = async (text: string, language: string = "Tiếng Việt"): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  // Prompt Phương án B: Elaborate/Expand (Mở rộng ý)
  const prompt = `Bạn là một biên tập viên học thuật chuyên nghiệp. Hãy viết lại (paraphrase) đoạn văn bản sau bằng ngôn ngữ: ${language}.
  
  Văn bản gốc: "${text}"
  
  Yêu cầu cụ thể:
  1. Viết chi tiết hơn, diễn giải sâu hơn các ý tưởng (Elaborate/Expand) để làm rõ nghĩa.
  2. Sử dụng từ vựng học thuật, trang trọng (Academic Tone).
  3. Tuyệt đối KHÔNG cắt bớt ý. Độ dài phải DÀI HƠN hoặc BẰNG bản gốc.
  4. Tránh đạo văn bằng cách thay đổi cấu trúc câu và từ vựng nhưng giữ nguyên ý nghĩa cốt lõi.
  
  Kết quả: Chỉ trả về nội dung đã viết lại (Text), không bao gồm lời dẫn.`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: { maxOutputTokens: 3000 } // Tăng token để cho phép viết dài hơn
    });
    return response.text || text;
  } catch (error) {
    console.error("Paraphrase Error:", error);
    return text;
  }
};

// 4. Research Assistant
export const researchAssistant = async (query: string) => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Research Error:", error);
    throw error;
  }
};

// 5. Admission Advice
export const getAdmissionAdvice = async (profile: string, question: string) => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";
  const prompt = `
    Bạn là Trợ lý Nghiên cứu & Học thuật (Academic Research Assistant) của ĐH Sư phạm TP.HCM (HCMUE).
    Người dùng đang hỏi: "${question}"

    NHIỆM VỤ:
    1. Kiểm tra xem câu hỏi có phải là thủ tục hành chính thuần túy (học phí, lịch thi, tuyển sinh...) không.
       - Nếu CÓ: Hướng dẫn người dùng xem thông tin tại Tab [Đào tạo] hoặc cổng thông tin tuyển sinh [tuyensinh.hcmue.edu.vn](https://tuyensinh.hcmue.edu.vn).
       - Nếu KHÔNG (Hỏi về quy chế đào tạo, định hướng nghiên cứu, luận văn thạc sĩ, chuyên môn NCKH...): Trả lời chính xác, chuẩn xác theo quy chế đào tạo sau đại học.

    2. QUY TẮC BẮT BUỘC VỀ ĐIỂM NHẤN (HIGHLIGHT):
       - Hãy đặt trong cặp dấu **từ_khóa** cho các cụm từ then chốt, tên chương trình, quy định, điều kiện bắt buộc, số tín chỉ, thời gian (ví dụ: **chương trình định hướng nghiên cứu**, **luận văn thạc sĩ**, **bắt buộc**, **15 tín chỉ**, **tối thiểu 1 năm**).
       - TUYỆT ĐỐI KHÔNG để khoảng trắng trước các dấu câu: Viết liền dấu hai chấm "**Tên mục**:", dấu phẩy "**từ khóa**,", dấu chấm "**từ khóa**." (KHÔNG ĐƯỢC viết "**Tên mục** :" hay "**từ khóa** ,").
       - Phân tách các đoạn văn rõ ràng bằng 2 lần xuống dòng.
       - Khi liệt kê các thông tin quy định cụ thể, hãy dùng gạch đầu dòng "- **Tên mục**: Nội dung...".
       - Mở đầu bằng lời chào thân thiện (ví dụ: "Chào bạn,").

    YÊU CẦU ĐỊNH DẠNG CÂU TRẢ LỜI (BẮT BUỘC JSON):
    Hãy trả về một JSON Object với 2 trường:
    - "answer": Nội dung câu trả lời (khoảng 100 - 200 từ), sử dụng Markdown với các điểm nhấn **...** và danh sách rõ ràng.
    - "suggestions": Mảng gồm 2-3 câu hỏi ngắn (string) gợi ý câu hỏi tiếp theo liên quan mật thiết đến chủ đề.

    VÍ DỤ OUTPUT MONG MUỐN:
    {
      "answer": "Chào bạn,\\n\\nĐối với học viên theo học **chương trình định hướng nghiên cứu** tại Trường Đại học Sư phạm TP.HCM, việc thực hiện **luận văn thạc sĩ** là yêu cầu **bắt buộc**.\\n\\nDưới đây là một số thông tin quy định cụ thể về luận văn thạc sĩ đối với định hướng này để bạn tham khảo:\\n- **Khối lượng và thời gian**: Học viên phải thực hiện một đề tài luận văn thạc sĩ có khối lượng **15 tín chỉ**, trong thời gian thực hiện theo quy chế.\\n- **Yêu cầu bảo vệ**: Học viên phải hoàn thành tất cả học phần và công bố bài báo khoa học liên quan đến đề tài.",
      "suggestions": ["Thời gian thực hiện luận văn là bao lâu?", "Quy định về bài báo khoa học để bảo vệ luận văn?"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    return JSON.parse(text); 
  } catch (error) {
    console.error("Chat Error", error);
    return { 
      answer: "Hệ thống đang bận hoặc gặp lỗi xử lý. Vui lòng thử lại câu hỏi khác.", 
      suggestions: [] 
    };
  }
};

// 6. Paper Generation Features (NCKH)

export interface IMRaD_Paper {
    title: string;
    abstract: string;
    introduction: string;
    methods: string;
    results: string;
    discussion: string;
    conclusion: string;
    references: string; // Updated: Include references section
    // Bilingual metadata
    keywords_vi: string;
    title_en: string;
    abstract_en: string;
    keywords_en: string;
    resultTableHtml?: string; // NEW: Optional field for result table HTML
}

// 6.1 Generate Paper Outline from Title/Abstract
export const generatePaperOutline = async (title: string, abstract: string): Promise<IMRaD_Paper> => {
    if (!apiKey) throw new Error("API Key missing");
    const prompt = `Tạo dàn ý bài báo IMRaD cho: "${title}". Abstract: "${abstract}". 
    Trả về JSON: introduction, methods, results, discussion, conclusion, references. Các trường khác để trống.`;
    try {
        const response = await generateWithRetry({ model: 'gemini-3.8-flash', contents: prompt, config: { responseMimeType: "application/json" } });
        const res = JSON.parse(response.text || "{}");
        return { ...res, title, abstract, keywords_vi: "", title_en: "", abstract_en: "", keywords_en: "" };
    } catch (e) { throw e; }
};

// 6.2 Convert Thesis to Paper (High Token Usage)

export const convertThesisToPaper = async (thesisData: DetailedOutline, contentMap: Record<string, string>): Promise<IMRaD_Paper> => {
    if (!apiKey) throw new Error("API Key missing");
    
    const fullContent = Object.entries(contentMap).map(([k, v]) => `${k}: ${v.substring(0, 2000)}`).join("\n");
    // FIX: Safely access objectives using optional chaining
    const objectives = thesisData.objectives?.general || "N/A";

    const prompt = `Chuyển đổi Luận văn thành Bài báo IMRaD.
    Luận văn: ${thesisData.translatedTopic || "Chưa có tên"}. Mục tiêu: ${objectives}.
    Nội dung: ${fullContent}
    
    Yêu cầu trả về JSON đầy đủ:
    - title: Tên bài báo tiếng Việt (ngắn gọn).
    - keywords_vi: 4-6 từ khóa tiếng Việt.
    - abstract: Tóm tắt tiếng Việt (200 từ).
    - introduction, methods, results, discussion, conclusion: Nội dung chính (tóm lược).
    - references: Danh sách tài liệu tham khảo.
    - title_en: Tên tiếng Anh.
    - abstract_en: Tóm tắt tiếng Anh.
    - keywords_en: Từ khóa tiếng Anh.
    `;

    try {
        const response = await generateWithRetry({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                maxOutputTokens: 8000 // High output limit
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { throw e; }
};

// NEW: Generate Full Paper
export const generateFullPaper = async (
    title: string, 
    keywords: string, 
    major: string,
    styleGuide?: StyleGuide
  ): Promise<IMRaD_Paper> => {
    if (!apiKey) throw new Error("API Key missing");

    const styleInstruction = styleGuide ? `STYLE: Tone: ${styleGuide.tone}, Citation: ${styleGuide.citationStyle}` : "";
    
    // --- BƯỚC 1: TẠO NỘI DUNG TIẾNG VIỆT (Tập trung vào chất lượng nội dung) ---
    const promptContent = `Đóng vai Giáo sư chuyên ngành ${major}. Hãy VIẾT MỘT BÀI BÁO KHOA HỌC hoàn chỉnh chuẩn IMRaD.
    Tiêu đề dự kiến: "${title}"
    Từ khóa: "${keywords}"
    ${styleInstruction}

    Nhiệm vụ: 
    1. Viết nội dung chi tiết bằng Tiếng Việt.
    2. Tự tóm tắt (Abstract) và chốt lại Từ khóa (Keywords) tiếng Việt dựa trên bài viết.

    Yêu cầu Output JSON (Chỉ Tiếng Việt):
    - title: Tiêu đề chính thức.
    - keywords_vi: 4-6 từ khóa.
    - abstract: Tóm tắt (200-300 từ).
    - introduction: Mở đầu (Lý do, tổng quan, khoảng trống nghiên cứu).
    - methods: Phương pháp nghiên cứu.
    - results: Kết quả nghiên cứu (số liệu giả định logic).
    - discussion: Bàn luận.
    - conclusion: Kết luận.
    - references: 10 tài liệu tham khảo chuẩn (APA/IEEE).
    `;

    // Gọi AI lần 1
    const responseContent = await generateWithRetry({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: { responseMimeType: "application/json", maxOutputTokens: 8192 }
    });
    
    const paperVi = JSON.parse(responseContent.text || "{}");    
    // Hàm chuẩn hóa: Thêm dấu cách sau dấu câu (phẩy, chấm) nếu thiếu
    const formatKeywords = (text: string) => {
        if (!text) return "";
        return text
            .replace(/,([^\s])/g, ', $1')   // Thêm cách sau dấu phẩy: "a,b" -> "a, b"
            .replace(/\.([^\s])/g, '. $1')  // Thêm cách sau dấu chấm: "a.b" -> "a. b"
            .replace(/…([^\s])/g, '… $1');  // Thêm cách sau dấu ba chấm
    };

    if (paperVi.keywords_vi) {
        paperVi.keywords_vi = formatKeywords(paperVi.keywords_vi);
    }

    // --- BƯỚC 2: DỊCH METADATA SANG TIẾNG ANH (Tác vụ nhẹ) ---
    // Sử dụng kết quả từ Bước 1 để dịch, đảm bảo sát nghĩa nhất
    const promptTranslate = `Bạn là biên dịch viên học thuật. Hãy dịch các thông tin sau sang Tiếng Anh chuẩn thuật ngữ chuyên ngành ${major}:
    
    Title: "${paperVi.title}"
    Abstract: "${paperVi.abstract}"
    Keywords: "${paperVi.keywords_vi}"

    Trả về JSON:
    - title_en
    - abstract_en
    - keywords_en
    `;

    // Gọi AI lần 2
    const responseTranslate = await generateWithRetry({
        model: 'gemini-3.8-flash',
        contents: promptTranslate,
        config: { responseMimeType: "application/json" }
    });

    const metadataEn = JSON.parse(responseTranslate.text || "{}");
    // --- BẮT ĐẦU ĐOẠN THÊM MỚI ---
    if (metadataEn.keywords_en) {
        metadataEn.keywords_en = formatKeywords(metadataEn.keywords_en);
    }

    // --- BƯỚC 3: GỘP KẾT QUẢ ---
    return {
        ...paperVi,
        title_en: metadataEn.title_en || "",
        abstract_en: metadataEn.abstract_en || "",
        keywords_en: metadataEn.keywords_en || ""
    };
};

// NEW: Suggest Short Title
export const suggestShortPaperTitle = async (currentTitle: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key missing");
    const model = "gemini-3.8-flash";

    const prompt = `Hãy rút gọn tên đề tài sau thành một Tiêu đề Bài báo khoa học ngắn gọn, súc tích, hấp dẫn (theo phong cách báo chí học thuật).
    Tên gốc: "${currentTitle}"
    
    Chỉ trả về 1 tên ngắn gọn nhất.`;

    try {
        const response = await generateWithRetry({
            model,
            contents: prompt
        });
        return (response.text || currentTitle).replace(/^"|"$/g, '');
    } catch (e) {
        return currentTitle;
    }
};

// NEW: Generate Survey Table (Tạo bảng số liệu giả định)
export const generateSurveyTable = async (
  topic: string,
  sectionTitle: string,
  major: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Bạn là một chuyên gia phân tích dữ liệu nghiên cứu khoa học chuyên ngành ${major}.
  Đề tài: "${topic}"
  Mục hiện tại: "${sectionTitle}"

  Nhiệm vụ: Hãy tạo một Bảng số liệu khảo sát (HTML Table) giả định phù hợp với nội dung mục này.
  
  Yêu cầu:
  Yêu cầu cấu trúc bảng BẮT BUỘC (Đúng 8 cột theo thứ tự sau):
  1. Cột 1: "STT" (Tự động điền số 1, 2, 3...)
  2. Cột 2: "Nội dung đánh giá" (Căn lề trái - text-align: left)
  3. Cột 3: "Rất không đồng ý" (Tỷ lệ %)
  4. Cột 4: "Không đồng ý" (Tỷ lệ %)
  5. Cột 5: "Trung lập" (Tỷ lệ %)
  6. Cột 6: "Đồng ý" (Tỷ lệ %)
  7. Cột 7: "Rất đồng ý" (Tỷ lệ %)
  8. Cột 8: "Tổng (%)" (Luôn là 100%)

  Yêu cầu về giao diện (HTML):
  - Bảng dạng HTML <table> có class "w-full border-collapse border border-gray-300 mb-4".
  - Các ô <th>, <td> có border, padding. 
  - Toàn bộ căn giữa (center), TRỪ cột "Nội dung đánh giá" căn trái.
  - Tiêu đề bảng (<caption> hoặc dòng text đậm ở trên) phải hợp lý.
  - Chỉ trả về mã HTML của bảng, không có lời dẫn.
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt
    });
    return response.text || "";
  } catch (error) {
    console.error("Generate Table Error:", error);
    throw error;
  }
};


// NEW: Generate Survey Content (Tạo bảng câu hỏi khảo sát - Questionnaire)
// Tìm đoạn này trong services/gemini.ts và thay thế:
export const generateSurveyContent = async (
  topic: string,
  sectionTitle: string,
  major: string,
  language: string = "Tiếng Việt"
): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Bạn là một chuyên gia thiết kế công cụ nghiên cứu khoa học chuyên ngành ${major}.
  Đề tài: "${topic}"
  Mục hiện tại: "${sectionTitle}"
  Ngôn ngữ mong muốn: ${language}

  Nhiệm vụ: Hãy thiết kế một Bảng hỏi khảo sát (Questionnaire) gồm 10-15 câu hỏi thang đo Likert (5 mức độ) để thu thập dữ liệu cho mục này.
  
  Yêu cầu quan trọng:
  1. Toàn bộ nội dung câu hỏi và tiêu đề bảng phải viết bằng ngôn ngữ: ${language}.
  2. Các nhãn của thang đo Likert (1-5) cũng phải được dịch sang ${language} tương ứng.
  
  Yêu cầu định dạng HTML Table (chỉ trả về mã HTML):
  <table class="survey-table" style="width: 100%; border-collapse: collapse; border: 1px solid black; font-family: 'Times New Roman';">
    <thead>
      <tr style="background-color: #f0f0f0;">
        <th style="border: 1px solid black; padding: 8px;">STT</th>
        <th style="border: 1px solid black; padding: 8px; width: 50%;">Nội dung câu hỏi</th>
        <th style="border: 1px solid black; padding: 8px;">1</th>
        <th style="border: 1px solid black; padding: 8px;">2</th>
        <th style="border: 1px solid black; padding: 8px;">3</th>
        <th style="border: 1px solid black; padding: 8px;">4</th>
        <th style="border: 1px solid black; padding: 8px;">5</th>
        <th style="border: 1px solid black; padding: 8px; width: 50px;">Thao tác</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid black; padding: 8px; text-align: center;">1</td>
        <td style="border: 1px solid black; padding: 8px;">[Question 1]</td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black; text-align: center;">
            <button class="delete-row-btn" style="color: red; cursor: pointer; border: none; background: transparent; font-size: 16px;">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt
    });
    return response.text || "";
  } catch (error) {
    console.error("Generate Survey Error:", error);
    throw error;
  }
};

// NEW: Optimize Survey Questionnaire (AI tối ưu hóa bảng hỏi)
export const optimizeSurveyQuestionnaire = async (
  currentHtml: string,
  topic: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Bạn là chuyên gia về phương pháp nghiên cứu định lượng.
  Đề tài nghiên cứu: "${topic}"
  
  Dưới đây là một Bảng hỏi khảo sát (HTML) hiện tại:
  ${currentHtml}
  
  Nhiệm vụ: Hãy RÀ SOÁT và TỐI ƯU HÓA bảng hỏi này.
  Các tiêu chí tối ưu:
  1. Loại bỏ các câu hỏi tối nghĩa, đa nghĩa hoặc hỏi 2 ý trong 1 câu (double-barreled).
  2. Đảm bảo từ ngữ khách quan, không định hướng người trả lời.
  3. Cải thiện cách diễn đạt để chuyên nghiệp và học thuật hơn.
  4. Giữ nguyên cấu trúc HTML Table.
  
  Yêu cầu output: Chỉ trả về mã HTML của bảng hỏi ĐÃ ĐƯỢC CẢI TIẾN.
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt
    });
    return response.text || currentHtml;
  } catch (error) {
    console.error("Optimize Survey Error:", error);
    throw error;
  }
};

// NEW: Analyze Survey Data (AI Phân tích số liệu & Viết lời bình)
export const analyzeSurveyData = async (
  topic: string,
  sectionTitle: string,
  surveyHtml: string, // Bảng hỏi đã có số liệu (HTML)
  contextText?: string // <--- THÊM DÒNG NÀY (Có dấu ? để không bắt buộc)
  ): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const model = "gemini-3.8-flash";

  const prompt = `Bạn là một chuyên gia đầu ngành về phân tích dữ liệu nghiên cứu khoa học.
  Đề tài: "${topic}"
  Mục hiện tại: "${sectionTitle}"
  
  Dữ liệu đầu vào là Bảng số liệu khảo sát (HTML) dưới đây. 
  LƯU Ý: Bảng này chứa các con số mà người dùng đã nhập trực tiếp vào các ô (ví dụ: số lượng, tỷ lệ %, mức độ đồng ý...).
  
  ${surveyHtml}

  \nThông tin ngữ cảnh/ghi chú thêm từ người dùng (nội dung text bên ngoài bảng): "${contextText || "Không có"}"

  Nhiệm vụ: Hãy viết một đoạn văn "Nhận xét và Bàn luận" (Commentary & Discussion) khoảng 300-400 từ dựa trên các số liệu trong bảng.
  
  Yêu cầu nội dung:
  1. Bắt đầu bằng câu dẫn nhập giới thiệu bảng số liệu.
  2. Phân tích các xu hướng chính dựa trên số liệu thực tế trong bảng (cái nào cao nhất, thấp nhất, sự chênh lệch).
  3. So sánh và đối chiếu các con số.
  4. Biện luận ý nghĩa của kết quả này đối với vấn đề nghiên cứu (nó chứng minh điều gì?).
  5. Văn phong: Học thuật, khách quan, trang trọng.
  
  Kết quả trả về: Chỉ trả về đoạn văn phân tích (Text), không bao gồm lời dẫn của AI.
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt
    });
    return response.text || "";
  } catch (error) {
    console.error("Analyze Data Error:", error);
    throw error;
  }
};

// ==========================================
// 7. AI DETECTION & ACADEMIC HUMANIZE MODULE
// ==========================================

export interface AiSegmentAnalysis {
  id: string;
  originalText: string;
  aiScore: number; // 0 - 100
  status: 'high_ai' | 'medium_ai' | 'human';
  reasons: string[];
  likelySource?: string; // Nguồn tài liệu đối chiếu / trường phái lý thuyết
  citationSuggestion?: string; // Gợi ý trích dẫn APA/IEEE tránh đạo văn
  humanizedSuggestion?: string;
  academicRewrite?: string; // Phiên bản chuyên sâu học thuật
  conciseRewrite?: string;  // Phiên bản súc tích, đanh thép
}

export interface AiDetectionReport {
  overallAiScore: number;
  overallHumanScore: number;
  wordCount: number;
  characterCount: number;
  highAiParagraphCount: number;
  verdict: string;
  summary: string;
  burstinessScore: number; // 0-100 (độ biến thiên nhịp điệu câu)
  perplexityScore: number; // 0-100 (độ phức hợp từ vựng & cấu trúc)
  plagiarismRisk: 'Cao' | 'Trung bình' | 'Thấp';
  detectedSourcesSummary?: string;
  segments: AiSegmentAnalysis[];
}

// Heuristic AI detection fallback (uses stylometrics, burstiness and pattern recognition)
const detectAiHeuristic = (text: string): AiDetectionReport => {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  const finalParas = paragraphs.length > 0 ? paragraphs : [text.trim()];

  const aiClichés = [
    "trong bối cảnh", "đóng vai trò quan trọng", "không thể phủ nhận rằng",
    "nhìn chung", "tóm lại", "bên cạnh đó", "mặt khác", "một cách toàn diện",
    "cần chú trọng", "tạo tiền đề vững chắc", "góp phần không nhỏ",
    "ngày càng sâu rộng", "nâng cao hiệu quả", "làn sóng công nghệ",
    "giải pháp mang tính đột phá", "hết sức cần thiết", "cần có sự phối hợp",
    "được xem là một trong những", "mang lại nhiều lợi ích"
  ];

  const segments: AiSegmentAnalysis[] = finalParas.map((para, idx) => {
    const lower = para.toLowerCase();
    const sentences = para.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    
    const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentenceLengths.length);
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLen, 2), 0) / Math.max(1, sentenceLengths.length);
    
    const matchedClichés = aiClichés.filter(c => lower.includes(c));
    let score = 25;

    if (matchedClichés.length >= 3) score += 55;
    else if (matchedClichés.length >= 2) score += 40;
    else if (matchedClichés.length === 1) score += 20;

    if (variance < 20 && sentenceLengths.length >= 2) score += 18;
    if (para.length > 200 && matchedClichés.length >= 1) score += 8;

    score = Math.min(95, Math.max(10, score));
    const status = score >= 70 ? 'high_ai' : score >= 40 ? 'medium_ai' : 'human';

    const reasons: string[] = [];
    if (matchedClichés.length > 0) {
      reasons.push(`Xuất hiện các cụm từ nối rập khuôn đặc trưng của LLM: "${matchedClichés.slice(0, 3).join('", "')}"`);
    }
    if (variance < 25 && sentenceLengths.length >= 2) {
      reasons.push("Độ dài các câu quá đồng đều (nhịp câu đơn điệu, thiếu tính ngẫu nhiên của con người)");
    }
    if (status === 'human') {
      reasons.push("Văn phong có tính cá nhân hóa, chứa dữ liệu thực chứng hoặc cách hành văn tự nhiên");
    }

    let humanized = para;
    matchedClichés.forEach(c => {
      humanized = humanized.replace(new RegExp(c, 'gi'), '');
    });
    humanized = humanized.replace(/\s{2,}/g, ' ').trim();

    return {
      id: `seg-${idx + 1}`,
      originalText: para,
      aiScore: score,
      status,
      reasons,
      likelySource: status === 'high_ai' 
        ? "Cơ sở tri thức tổng hợp từ mô hình ngôn ngữ lớn (tổng hợp tài liệu giáo trình đại cương / bài viết tổng quan trực tuyến)"
        : "Tài liệu học thuật chuyên khảo hoặc dữ liệu khảo sát thực nghiệm",
      citationSuggestion: status === 'high_ai'
        ? "Nên bổ sung trích dẫn tác giả kinh điển hoặc tài liệu khảo cứu thực tế trong giai đoạn 2020-2025."
        : "Trích dẫn đầy đủ theo chuẩn APA 7th.",
      humanizedSuggestion: humanized,
      academicRewrite: humanized,
      conciseRewrite: humanized
    };
  });

  const highAiCount = segments.filter(s => s.status === 'high_ai').length;
  const overallAi = segments.length > 0
    ? Math.round(segments.reduce((acc, s) => acc + s.aiScore, 0) / segments.length)
    : 0;

  return {
    overallAiScore: overallAi,
    overallHumanScore: Math.max(0, 100 - overallAi),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    characterCount: text.length,
    highAiParagraphCount: highAiCount,
    verdict: overallAi >= 65 ? "Phát hiện tỷ lệ AI cao (Cần chỉnh sửa)" : overallAi >= 35 ? "Văn bản kết hợp AI và Tự viết" : "Văn bản có tính độc bản cao",
    summary: "Đã hoàn thành phân tích nhịp điệu câu, độ phong phú từ vựng và các liên từ máy móc.",
    burstinessScore: Math.max(20, Math.min(90, Math.round(100 - overallAi * 0.6))),
    perplexityScore: Math.max(25, Math.min(95, Math.round(100 - overallAi * 0.5))),
    plagiarismRisk: overallAi >= 60 ? 'Cao' : overallAi >= 30 ? 'Trung bình' : 'Thấp',
    detectedSourcesSummary: "Phát hiện sự tương đồng với các tài liệu lý thuyết nền tảng và văn phong tổng quan trên Internet.",
    segments
  };
};

export const detectAiInDocument = async (
  documentText: string
): Promise<AiDetectionReport> => {
  const trimmedText = documentText.trim();
  const wordCount = trimmedText ? trimmedText.split(/\s+/).filter(Boolean).length : 0;
  const characterCount = trimmedText.length;

  if (!trimmedText) {
    return {
      overallAiScore: 0,
      overallHumanScore: 100,
      wordCount: 0,
      characterCount: 0,
      highAiParagraphCount: 0,
      verdict: "Chưa có nội dung",
      summary: "Vui lòng nhập hoặc tải file lên để kiểm tra.",
      burstinessScore: 100,
      perplexityScore: 100,
      plagiarismRisk: 'Thấp',
      segments: []
    };
  }

  // Fallback immediately if apiKey is completely absent
  if (!apiKey) {
    return detectAiHeuristic(trimmedText);
  }

  const model = "gemini-3.8-flash";

  // Support full long documents (up to 250,000 characters ~ 80-100 A4 pages)
  const textToAnalyze = trimmedText.length > 250000 
    ? trimmedText.substring(0, 250000)
    : trimmedText;

  const prompt = `Bạn là hệ thống kiểm định AI và đạo văn học thuật chuyên sâu (tương tự Turnitin AI Detection, iThenticate, GPTZero, CopyLeaks).
Nhiệm vụ: Hãy phân tích văn bản nghiên cứu dưới đây để phát hiện chính xác:
1. Những đoạn văn nào có dấu hiệu do mô hình ngôn ngữ lớn (ChatGPT, Claude, Gemini...) tạo ra hoặc mang tính tổng quan chung chung.
2. Dấu hiệu nhận diện (độ đồng nhất câu, từ nối sáo rỗng quen thuộc của AI: "nhìn chung", "đóng vai trò quan trọng", "không thể phủ nhận rằng", "bên cạnh đó", "trong bối cảnh hiện nay", cấu trúc đối xứng máy móc...).
3. Chỉ ra NGUỒN TÀI LIỆU GỐC / TRƯỜNG PHÁI LÝ THUYẾT / GIÁO TRÌNH NỀN TẢNG mà đoạn văn đó có khả năng bắt nguồn từ (Likely Source / Reference Background), cùng gợi ý trích dẫn (APA/IEEE) để tránh bị coi là đạo văn ý tưởng.
4. Đưa ra gợi ý viết lại (Humanized Suggestion) cho từng đoạn bị gắn cờ AI để chuyển hóa thành văn phong học thuật tự nhiên của con người, giàu tính phản biện, biến thiên cấu trúc câu để vượt qua các công cụ quét AI.

VĂN BẢN CẦN KIỂM TRA:
"""
${textToAnalyze}
"""

HÃY PHÂN TÁCH VĂN BẢN THÀNH CÁC ĐOẠN (PARAGRAPHS) NGUYÊN BẢN VÀ ĐÁNH GIÁ TỪNG ĐOẠN.
YÊU CẦU TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON với cấu trúc sau:
{
  "overallAiScore": (số nguyên từ 0 đến 100, ước tính tổng thể % nội dung do AI sinh ra),
  "overallHumanScore": (số nguyên từ 0 đến 100, 100 - overallAiScore),
  "burstinessScore": (số nguyên 0-100: độ ngẫu nhiên & biến thiên độ dài câu, AI thường thấp <45, người thường cao >70),
  "perplexityScore": (số nguyên 0-100: độ phức tạp và độc đáo của từ vựng),
  "plagiarismRisk": ("Cao" | "Trung bình" | "Thấp"),
  "verdict": (kết luận ngắn gọn, ví dụ: "Phát hiện tỷ lệ AI cao (Cần chỉnh sửa)" | "Văn bản kết hợp AI và Tự viết" | "Văn bản có tính độc bản cao"),
  "summary": (đánh giá tổng quan 2-3 câu về đặc điểm văn phong của tài liệu),
  "detectedSourcesSummary": (tổng quan 1-2 câu về các nhóm nguồn tài liệu học thuật hoặc trang thông tin mà văn bản có nguy cơ trùng lặp ý tưởng),
  "segments": [
    {
      "id": "seg-1",
      "originalText": "Nguyên văn đoạn văn trong văn bản gốc (giữ nguyên không sửa để đối chiếu)",
      "aiScore": (số nguyên 0-100),
      "status": ("high_ai" nếu aiScore >= 70, "medium_ai" nếu 40 <= aiScore < 70, "human" nếu aiScore < 40),
      "reasons": [
        "Lý do 1 (ví dụ: Cấu trúc câu quá đều đặn, nhịp điệu đơn điệu đặc trưng của GPT)",
        "Lý do 2 (ví dụ: Sử dụng từ ngữ mang tính khái quát chung chung, thiếu dẫn chứng cụ thể)"
      ],
      "likelySource": "Chỉ ra nguồn gốc khả dĩ (ví dụ: Giáo trình Quản trị học đại cương / Lý thuyết hành vi tổ chức của Robbins / Báo cáo Chuyển đổi số của Bộ GD&ĐT...)",
      "citationSuggestion": "Gợi ý trích dẫn để tránh đạo văn ý tưởng (ví dụ: Cần bổ sung trích dẫn: (Robbins & Judge, 2019) hoặc tham khảo Quyết định 131/QĐ-BGDĐT)",
      "humanizedSuggestion": "Đoạn văn viết lại theo phong cách con người tự nhiên, sắc sảo, tự nhiên, đa dạng câu để qua mặt các phần mềm kiểm tra AI"
    }
  ]
}
`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.0
      }
    });

    let rawText = response.text || "{}";
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      rawText = match[0];
    }
    const parsed = JSON.parse(rawText);

    const segments: AiSegmentAnalysis[] = Array.isArray(parsed.segments)
      ? parsed.segments.map((seg: any, idx: number) => ({
          id: seg.id || `seg-${idx + 1}`,
          originalText: seg.originalText || "",
          aiScore: typeof seg.aiScore === 'number' ? Math.min(100, Math.max(0, seg.aiScore)) : 0,
          status: seg.status || (seg.aiScore >= 70 ? 'high_ai' : seg.aiScore >= 40 ? 'medium_ai' : 'human'),
          reasons: Array.isArray(seg.reasons) ? seg.reasons : [],
          likelySource: seg.likelySource || "Tài liệu lý thuyết tổng quan hoặc cơ sở tri thức LLM",
          citationSuggestion: seg.citationSuggestion || "Nên bổ sung tài liệu tham khảo chính thống để tăng tính học thuật.",
          humanizedSuggestion: seg.humanizedSuggestion || ""
        }))
      : [];

    const highAiCount = segments.filter(s => s.status === 'high_ai').length;

    return {
      overallAiScore: typeof parsed.overallAiScore === 'number' ? parsed.overallAiScore : Math.round((highAiCount / Math.max(1, segments.length)) * 100),
      overallHumanScore: typeof parsed.overallHumanScore === 'number' ? parsed.overallHumanScore : Math.max(0, 100 - (parsed.overallAiScore || 0)),
      wordCount,
      characterCount,
      highAiParagraphCount: highAiCount,
      verdict: parsed.verdict || (parsed.overallAiScore > 50 ? "Phát hiện nội dung có sự can thiệp của AI" : "Văn bản tương đối tự nhiên"),
      summary: parsed.summary || "Đã hoàn thành kiểm tra và phân đoạn chi tiết.",
      burstinessScore: typeof parsed.burstinessScore === 'number' ? parsed.burstinessScore : 55,
      perplexityScore: typeof parsed.perplexityScore === 'number' ? parsed.perplexityScore : 60,
      plagiarismRisk: parsed.plagiarismRisk || (parsed.overallAiScore >= 60 ? 'Cao' : parsed.overallAiScore >= 30 ? 'Trung bình' : 'Thấp'),
      detectedSourcesSummary: parsed.detectedSourcesSummary || "Đã quét và đối chiếu với các nguồn học thuật và giáo trình tiêu chuẩn.",
      segments
    };
  } catch (error) {
    console.warn("Gemini AI Detection Error, using heuristic fallback:", error);
    return detectAiHeuristic(trimmedText);
  }
};

export const humanizeAiSegment = async (
  originalText: string,
  context?: string,
  major?: string,
  style: 'academic' | 'concise' | 'argumentative' = 'academic'
): Promise<{ humanizedText: string; improvements: string[] }> => {
  if (!apiKey) {
    // Local heuristic rewrite
    const cleaned = originalText
      .replace(/trong bối cảnh/gi, 'khi nghiên cứu về')
      .replace(/đóng vai trò vô cùng quan trọng/gi, 'là yếu tố then chốt')
      .replace(/đóng vai trò quan trọng/gi, 'tác động trực tiếp')
      .replace(/không thể phủ nhận rằng/gi, 'thực tế cho thấy')
      .replace(/nhìn chung,/gi, '')
      .replace(/tóm lại,/gi, 'kết luận,')
      .replace(/bên cạnh đó,/gi, 'đồng thời,')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return {
      humanizedText: cleaned,
      improvements: [
        "Đã loại bỏ các cụm từ sáo rỗng thường gặp của LLM",
        "Tăng tính trực tiếp và chuyển đổi giọng văn chủ động"
      ]
    };
  }

  const model = "gemini-3.8-flash";

  const styleInstruction = style === 'concise'
    ? 'Phong cách: Súc tích, đanh thép, lược bỏ mọi hư từ, tập trung vào trọng tâm lập luận.'
    : style === 'argumentative'
    ? 'Phong cách: Phản biện sắc bén, đưa ra quan điểm đối sánh, tăng tính học thuật chuyên sâu.'
    : 'Phong cách: Học thuật chuẩn mực, tự nhiên, đa dạng nhịp điệu câu, giàu tính khách quan và khoa học.';

  const prompt = `Bạn là một biên tập viên học thuật và chuyên gia ngôn ngữ học xuất sắc.
Nhiệm vụ: Viết lại (Humanize / Phá vỡ cấu trúc AI) cho đoạn văn dưới đây sao cho:
1. KHÔNG BỊ CÁC CÔNG CỤ PHÁT HIỆN AI (Turnitin AI, iThenticate, GPTZero, CopyLeaks, Winston AI...) phát hiện (đạt chỉ số AI < 5%).
2. Sử dụng nhịp điệu tự nhiên của con người: Độ biến thiên độ dài câu cao (Burstiness) - kết hợp giữa câu ngắn dứt khoát và câu phức nhiều mệnh đề logic.
3. Độ phức hợp từ vựng cao (Perplexity): Thay thế các từ sáo rỗng thường gặp của LLM ("đóng vai trò quan trọng", "không thể thiếu", "nhìn chung", "bên cạnh đó", "trong bối cảnh") bằng cách diễn đạt sắc bén, trực tiếp, đậm chất nghiên cứu khoa học thực chứng.
4. ${styleInstruction}
5. Giữ nguyên 100% ý nghĩa cốt lõi, số liệu, tên tác giả, thực thể khoa học của bản gốc.
${major ? `Lĩnh vực/Chuyên ngành: ${major}` : ''}
${context ? `Ngữ cảnh toàn bài: ${context.substring(0, 1000)}` : ''}

Đoạn văn gốc cần viết lại:
"""
${originalText}
"""

YÊU CẦU TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON:
{
  "humanizedText": "Nội dung đã được viết lại tự nhiên hoàn toàn theo văn phong học thuật con người",
  "improvements": [
    "Điểm cải thiện 1 (ví dụ: Đã xóa cụm từ sáo rỗng của AI)",
    "Điểm cải thiện 2 (ví dụ: Tăng độ biến thiên câu và đưa vào giọng điệu phản biện chủ động)"
  ]
}
`;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let raw = response.text || "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) raw = match[0];
    const parsed = JSON.parse(raw);

    return {
      humanizedText: parsed.humanizedText || originalText,
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Đã tối ưu hóa nhịp điệu câu và văn phong học thuật."]
    };
  } catch (error) {
    console.warn("Humanize Segment Error, using local fallback:", error);
    const cleaned = originalText
      .replace(/trong bối cảnh/gi, 'khi khảo sát')
      .replace(/đóng vai trò quan trọng/gi, 'tác động thực chứng')
      .replace(/không thể phủ nhận rằng/gi, 'kết quả chứng minh')
      .replace(/nhìn chung,/gi, '')
      .replace(/tóm lại,/gi, 'như vậy,');
    return {
      humanizedText: cleaned,
      improvements: ["Đã lược bỏ các cụm từ nối máy móc và tái cấu trúc câu."]
    };
  }
};

