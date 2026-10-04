// Dịch vụ đồng bộ và tra cứu trực tiếp dữ liệu từ Google Sheet tab ThesisOutlines
const SHEET_ID = "1mjZfKOJW_4C_jcadBFFECwa1squ90bj1q3nIVLRXlUM";

export interface OutlinesProjectRecord {
  id: string;
  topic: string;
  studentInfo: {
    name: string;
    id: string;
    major: string;
    supervisor: string;
  };
  driveFileId?: string;
  createdAt: string;
  status: string;
  projectType: string;
  outlineData: any;
}

const normalizeText = (str: any): string => {
  if (!str) return '';
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

export const fetchThesisOutlinesFromSheet = async (searchTerm?: string): Promise<OutlinesProjectRecord[]> => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=ThesisOutlines`;
    const res = await fetch(url).catch((err) => {
      console.warn("Lỗi mạng khi tải ThesisOutlines:", err?.message || err);
      return null;
    });
    if (!res || !res.ok) {
      console.warn("Không thể tải ThesisOutlines từ GViz, status:", res?.status);
      return [];
    }

    const rawText = await res.text();
    const match = rawText.match(/setResponse\((.*)\);/s);
    if (!match || !match[1]) return [];

    const parsed = JSON.parse(match[1]);
    const table = parsed?.table;
    if (!table || !Array.isArray(table.rows)) return [];

    const rows = table.rows;
    let startIndex = 0;
    if (rows.length > 0) {
      const firstCell = String(rows[0]?.c?.[0]?.v || '').toLowerCase();
      if (firstCell === 'id' || firstCell.includes('id')) {
        startIndex = 1; // Bỏ qua dòng tiêu đề
      }
    }

    const results: OutlinesProjectRecord[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const c = rows[i]?.c || [];
      const id = String(c[0]?.v ?? '').trim();
      if (!id) continue;

      const studentName = String(c[1]?.v ?? '').trim();
      const studentId = String(c[2]?.v ?? '').trim();
      const major = String(c[3]?.v ?? '').trim();
      const supervisor = String(c[4]?.v ?? '').trim();
      const topic = String(c[5]?.v ?? '').trim();
      const driveFileId = String(c[6]?.v ?? '').trim();
      const createdAt = String(c[7]?.v ?? '').trim();
      const status = String(c[8]?.v ?? 'Nháp').trim();
      const rawProjectType = String(c[9]?.v ?? 'master_thesis').trim().toLowerCase();
      
      // Chuẩn hóa loại dự án
      let projectType = rawProjectType;
      if (rawProjectType.includes('scientific') || rawProjectType.includes('paper') || rawProjectType.includes('bai_bao')) {
        projectType = 'scientific_paper';
      } else if (rawProjectType.includes('master') || rawProjectType.includes('thac_si')) {
        projectType = 'master_thesis';
      } else if (rawProjectType.includes('graduation') || rawProjectType.includes('tot_nghiep')) {
        projectType = 'graduation_project';
      } else if (rawProjectType.includes('course') || rawProjectType.includes('do_an')) {
        projectType = 'course_project';
      } else if (rawProjectType.includes('essay') || rawProjectType.includes('tieu_luan')) {
        projectType = 'essay';
      } else if (rawProjectType.includes('assignment')) {
        projectType = 'assignment';
      }

      let outlineData: any = null;
      const rawOutline = c[12]?.v || c[10]?.v;
      if (rawOutline) {
        try {
          const parsedObj = typeof rawOutline === 'string' ? JSON.parse(rawOutline) : rawOutline;
          outlineData = parsedObj?.outlineData || parsedObj;
        } catch {
          outlineData = null;
        }
      }

      results.push({
        id,
        topic: topic || "Chưa đặt tên đề tài",
        studentInfo: {
          name: studentName,
          id: studentId,
          major,
          supervisor
        },
        driveFileId,
        createdAt: createdAt || new Date().toISOString(),
        status: status || 'Nháp',
        projectType,
        outlineData: outlineData || {
          topic: topic || "Chưa đặt tên đề tài",
          projectType,
          studentInfo: {
            name: studentName,
            id: studentId,
            major,
            supervisor
          },
          sections: [],
          chapters: []
        }
      });
    }

    if (!searchTerm || !searchTerm.trim()) {
      return results;
    }

    const term = normalizeText(searchTerm);
    return results.filter(p => {
      const matchId = normalizeText(p.studentInfo.id).includes(term);
      const matchName = normalizeText(p.studentInfo.name).includes(term);
      const matchTopic = normalizeText(p.topic).includes(term);
      const matchMajor = normalizeText(p.studentInfo.major).includes(term);
      const matchUuid = normalizeText(p.id).includes(term);
      return matchId || matchName || matchTopic || matchMajor || matchUuid;
    });
  } catch (error) {
    console.error("Lỗi khi tải dự án từ Google Sheet ThesisOutlines:", error);
    return [];
  }
};

/**
 * Kiểm tra xem một dự án/bài báo có thuộc quyền sở hữu của người dùng hiện tại hay không.
 * - Admin tối cao (banglv@hcmue.edu.vn hoặc role='admin'): có quyền truy cập toàn bộ.
 * - Người dùng thông thường: chỉ có quyền truy cập dự án mang tên/email/mã của mình.
 */
export const isProjectOwnedByUser = (
  project: OutlinesProjectRecord,
  user: { name?: string; email?: string; role?: string } | null
): boolean => {
  if (!user) return false;
  
  const email = (user.email || '').trim().toLowerCase();
  // Admin tối cao có toàn quyền
  if (email === 'banglv@hcmue.edu.vn' || user.role === 'admin') {
    return true;
  }

  const projName = normalizeText(project.studentInfo?.name);
  const projStudentId = normalizeText(project.studentInfo?.id);
  const userName = normalizeText(user.name);
  const userPrefix = normalizeText(email.split('@')[0]);

  // 1. Trực tiếp khớp tên hiển thị của tài khoản
  if (userName && projName) {
    if (projName === userName || projName.includes(userName) || userName.includes(projName)) {
      return true;
    }
  }

  // 2. Khớp với username email (ví dụ: linhthuyle0901)
  if (userPrefix) {
    if (projStudentId === userPrefix || projName === userPrefix || projName.includes(userPrefix)) {
      return true;
    }
  }

  // 3. Bảng ánh xạ danh tính chính xác theo Email tài khoản
  const knownStaffNameMap: Record<string, string[]> = {
    'linhthuyle0901@gmail.com': ['le thuy linh', 'thuy linh', 'linhthuyle0901'],
    'levanbang9912@gmail.com': ['le van bang', 'van bang', 'levanbang9912'],
    'kalin9297@gmail.com': ['le khanh linh', 'khanh linh', 'kalin9297'],
    'levanbangdhsp@gmail.com': ['le van bang', 'van bang', 'levanbangdhsp'],
    'nguyenanhduc@gmail.com': ['nguyen anh duc', 'anh duc', 'qlgd837011']
  };

  const aliases = knownStaffNameMap[email];
  if (aliases && aliases.some(alias => projName.includes(alias) || projStudentId.includes(alias))) {
    return true;
  }

  return false;
};

/**
 * Lọc danh sách dự án theo phân quyền và từ khóa tìm kiếm:
 * - Admin: Xem được tất cả dự án trong ThesisOutlines.
 * - Người dùng khác: Chỉ xem được dự án của chính mình.
 */
export const filterProjectsForUser = (
  projects: OutlinesProjectRecord[],
  user: { name?: string; email?: string; role?: string } | null,
  searchTerm?: string
): OutlinesProjectRecord[] => {
  if (!user) return [];

  const email = (user.email || '').trim().toLowerCase();
  const isAdmin = email === 'banglv@hcmue.edu.vn' || user.role === 'admin';

  // 1. Lọc theo quyền sở hữu (Admin xem hết, User xem của mình)
  const accessible = isAdmin ? projects : projects.filter(p => isProjectOwnedByUser(p, user));

  // 2. Lọc theo từ khóa tìm kiếm
  if (!searchTerm || !searchTerm.trim()) {
    return accessible;
  }

  const term = normalizeText(searchTerm);
  return accessible.filter(p => {
    const matchId = normalizeText(p.studentInfo.id).includes(term);
    const matchName = normalizeText(p.studentInfo.name).includes(term);
    const matchTopic = normalizeText(p.topic).includes(term);
    const matchMajor = normalizeText(p.studentInfo.major).includes(term);
    const matchUuid = normalizeText(p.id).includes(term);
    return matchId || matchName || matchTopic || matchMajor || matchUuid;
  });
};
