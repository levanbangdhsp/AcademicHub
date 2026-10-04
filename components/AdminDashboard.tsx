
import React, { useState, useEffect } from 'react';
import { Shield, Trash2, RefreshCw, UserPlus, Users, CheckCircle, PauseCircle, Search, AlertCircle, X, Eye, EyeOff, Undo, Lock, Unlock, RotateCcw } from 'lucide-react';
import { User, Role } from '../types';
import { InputField, PasswordRequirements, validateEmail, checkStrength } from './AuthModal';

// URL API - UPDATED
//const GOOGLE_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbyBzTVOLAWbCGTUy1iz1wcnZNNQUYuhEf2K5HG8whG0lSW7OM3pCdg8uMVuQHGYLeuDzw/exec"; 
const GOOGLE_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbx7ZxXOlblXK3NiJFSBT2SrF2tte4ih0XjsiNJySHXJtxWlxVGdAYS5ZgHxHlpjMYjP1w/exec"; 

const SHEET_ID = "1mjZfKOJW_4C_jcadBFFECwa1squ90bj1q3nIVLRXlUM";
const ADMIN_EMAIL = 'banglv@hcmue.edu.vn';

const normalizeSearchText = (str: any): string => {
    if (str === null || str === undefined) return '';
    return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
};

const Alert = ({ type, message, onClose }: { type: 'success'|'error', message: string, onClose: ()=>void }) => (
  <div className={`p-4 rounded-lg mb-4 flex justify-between items-center ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
    <div className="flex items-center">
      {type === 'success' ? <CheckCircle size={20} className="mr-2"/> : <AlertCircle size={20} className="mr-2"/>}
      <span>{message}</span>
    </div>
    <button onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded"><X size={16}/></button>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'staff'>('users');
  
  const callAdminApi = async (payload: any) => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { success: false, message: "Lỗi Server HTML: " + text.substring(0, 100) };
      }
    } catch (e: any) {
      return { success: false, message: "Lỗi kết nối: " + e.message };
    }
  };

  // --- USER MANAGEMENT STATE ---
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userList, setUserList] = useState<User[]>([]);
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [userActionStatus, setUserActionStatus] = useState<Record<string, boolean>>({});
  
  // MODAL STATES
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [userToLock, setUserToLock] = useState<User | null>(null);
  const [userMessage, setUserMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });

  // Helper fetch data from Google Sheet using GViz first, gsx2json as fallback
  const fetchSheetData = async (sheetName: string): Promise<any[]> => {
    try {
      // 1. Try Google Sheet Gviz endpoint (Official Google endpoint)
      const gvizRes = await fetch(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
      ).catch(() => null);

      if (gvizRes && gvizRes.ok) {
        const rawGviz = await gvizRes.text();
        const jsonMatch = rawGviz.match(/setResponse\((.*)\);/s);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          const table = parsed?.table;
          if (table && Array.isArray(table.rows)) {
            const colLabels = (table.cols || []).map((c: any) => (c?.label || '').trim());
            const rows: any[] = [];
            for (let rIndex = 0; rIndex < table.rows.length; rIndex++) {
              const r = table.rows[rIndex];
              const cells = r.c || [];
              const rowObj: any = {};
              
              colLabels.forEach((label: string, cIndex: number) => {
                const val = cells[cIndex]?.v ?? cells[cIndex]?.f ?? '';
                if (label) {
                  rowObj[label] = val;
                  rowObj[label.toLowerCase()] = val;
                  rowObj[label.toLowerCase().replace(/\s+/g, '')] = val;
                }
                rowObj[`col_${cIndex}`] = val;
              });

              if (!rowObj.email && cells[1]?.v) rowObj.email = cells[1].v;
              if (!rowObj.hovaten && cells[0]?.v) rowObj.hovaten = cells[0].v;
              if (!rowObj.phone && cells[2]?.v) rowObj.phone = cells[2].v;
              
              rows.push(rowObj);
            }
            if (rows.length > 0) return rows;
          }
        }
      }
    } catch (e) {
      console.warn(`GViz fetch error for ${sheetName}:`, e);
    }

    // 2. Fallback to gsx2json
    try {
      const res = await fetch(`https://gsx2json.com/api?id=${SHEET_ID}&sheet=${encodeURIComponent(sheetName)}`).catch(() => null);
      if (res && res.ok) {
        const rawText = await res.text();
        let data: any = {};
        try { data = JSON.parse(rawText); } catch { data = { rows: [] }; }
        if (data && Array.isArray(data.rows) && data.rows.length > 0) {
          return data.rows;
        }
      }
    } catch (e) {
      console.warn(`gsx2json fetch error for ${sheetName}:`, e);
    }

    return [];
  };

  const fetchAndFilterUsers = async () => {
    setIsUserSearching(true);
    try {
        const rows = await fetchSheetData('UserName');
        if (rows && rows.length > 0) {
            const mappedUsers: User[] = rows.map((row: any, idx: number) => {
                const getVal = (keys: string[]) => {
                   for (const k of keys) {
                     if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
                   }
                   return undefined;
                };

                const emailVal = getVal(['email', 'Email', 'EMAIL', 'col_1']) || '';
                const nameVal = getVal(['hovaten', 'Hovaten', 'name', 'Name', 'Họ và tên', 'col_0']) || 'Người dùng';
                const phoneVal = getVal(['phone', 'sodienthoai', 'Sodienthoai', 'Điện thoại', 'col_2', 'col_3']) || '';
                const statusVal = getVal(['canedit', 'CanEdit', 'status', 'Status', 'trangthai', 'Trạng thái', 'col_4']) || 'Hoạt động';
                const canEditVal = getVal(['canedit', 'CanEdit', 'canEdit']) === true || String(getVal(['canedit', 'CanEdit', 'canEdit'])).toLowerCase() === 'true';

                return {
                  id: idx,
                  name: String(nameVal),
                  email: String(emailVal).trim().toLowerCase(), 
                  phone: phoneVal ? String(phoneVal).replace(/'/g, '') : '',
                  role: (String(row.role || '').toLowerCase() === 'admin' || String(emailVal).toLowerCase().includes('banglv') ? 'admin' : (String(row.role || '').toLowerCase() === 'sub-admin' ? 'sub-admin' : 'user')) as Role,
                  status: String(statusVal),
                  canEdit: canEditVal
                };
            }).filter(u => u.email.length > 0);
            
            const term = normalizeSearchText(userSearchTerm);
            const filtered = mappedUsers.filter(u => 
                normalizeSearchText(u.name).includes(term) || 
                normalizeSearchText(u.email).includes(term) ||
                normalizeSearchText(u.phone).includes(term)
            );
            setUserList(filtered);
        }
    } catch (error) {
        console.error("Fetch Users Error:", error);
    } finally {
        setIsUserSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') fetchAndFilterUsers();
    }, 600);
    return () => clearTimeout(timer);
  }, [userSearchTerm, activeTab]);

  // Handle User Actions (Open Modals)
  const handleUserAction = (user: User, action: 'reset' | 'lock' | 'delete') => {
    if (action === 'delete') setUserToDelete(user);
    else if (action === 'reset') setUserToReset(user);
    else if (action === 'lock') setUserToLock(user);
  };

  const performUserApi = async (user: User, action: 'reset' | 'lock' | 'delete', statusOverride?: string) => {
    const statusKey = `${user.email}-${action}`;
    setUserActionStatus(prev => ({ ...prev, [statusKey]: true }));
    setUserMessage({ text: '', type: 'success' });

    try {
        const apiAction = action === 'reset' ? 'adminResetPass' : 'adminUpdate';
        const finalStatus = statusOverride || 'Đã xóa';

        const res = await callAdminApi({ 
            action: apiAction, 
            email: user.email, 
            status: finalStatus 
        });

        if (res.success) {
            setUserMessage({ text: `Thành công: ${res.message || "Đã cập nhật trạng thái."}`, type: 'success' });
            if (action !== 'reset') {
                setUserList(prev => prev.map(u => u.email === user.email ? { ...u, status: finalStatus } : u));
            }
        } else {
            setUserMessage({ text: `Thất bại: ${res.message}`, type: 'error' });
        }
    } catch (error: any) {
        setUserMessage({ text: `Lỗi hệ thống: ${error.message}`, type: 'error' });
    } finally {
        setUserActionStatus(prev => ({ ...prev, [statusKey]: false }));
    }
  };

  const toggleUserPermission = async (user: User) => {
      const statusKey = `${user.email}-permission`;
      setUserActionStatus(prev => ({ ...prev, [statusKey]: true }));
      try {
          const newCanEdit = !user.canEdit;
          const res = await callAdminApi({
              action: 'adminUpdate',
              email: user.email,
              canEdit: newCanEdit
          });
          if (res.success) {
              setUserList(prev => prev.map(u => u.email === user.email ? { ...u, canEdit: newCanEdit } : u));
          } else {
              setUserMessage({ text: `Lỗi: ${res.message}`, type: 'error' });
          }
      } catch (e: any) {
          setUserMessage({ text: `Lỗi: ${e.message}`, type: 'error' });
      } finally {
          setUserActionStatus(prev => ({ ...prev, [statusKey]: false }));
      }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    await performUserApi(userToDelete, 'delete');
    setUserToDelete(null);
  };

  const confirmResetUser = async () => {
    if (!userToReset) return;
    await performUserApi(userToReset, 'reset');
    setUserToReset(null);
  };

  const confirmLockUser = async () => {
    if (!userToLock) return;
    const currentStatus = String(userToLock.status).toLowerCase();
    const isLockedOrDeleted = currentStatus === 'tạm dừng' || currentStatus === 'tam dung' || currentStatus === 'đã xóa' || currentStatus === 'da xoa';
    // Logic khôi phục: Nếu đang khóa/xóa -> Hoạt động
    const nextStatus = isLockedOrDeleted ? 'Hoạt động' : 'Tạm dừng';
    
    await performUserApi(userToLock, 'lock', nextStatus);
    setUserToLock(null);
  };

  // --- STAFF MANAGEMENT STATE ---
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffCanEdit, setNewStaffCanEdit] = useState(false);
  const [newStaffCanCheckAi, setNewStaffCanCheckAi] = useState(false);
  const [staffFormErrors, setStaffFormErrors] = useState({ fullName: '', email: '', password: '' });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffActionStatus, setStaffActionStatus] = useState<Record<string, Record<string, boolean>>>({});
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [staffMessage, setStaffMessage] = useState({ text: '', type: 'success' as 'success'|'error' });

  const fetchStaffList = async () => {
    setIsFetchingStaff(true);
    try {
      const rows = await fetchSheetData('StaffAccounts');
      if (rows && rows.length > 0) {
        const mapped = rows.map((row: any, idx: number) => {
          // Helper: Tìm giá trị không phân biệt hoa thường
          const getVal = (keys: string[]) => {
             for(const k of keys) if(row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
             return undefined;
          };

          const rawCanEdit = getVal(['canedit', 'CanEdit', 'canEdit', 'CANEDIT', 'col_4']);
          const rawCanCheckAi = getVal(['cancheckai', 'CanCheckAi', 'canCheckAi', 'CANCHECKAI', 'quyenai', 'QuyenAI', 'aipermission', 'AIPermission', 'quyenkiemtraai', 'col_8', 'col_5']);

          // Robust checking for boolean TRUE
          const isTrue = (val: any) => {
              if (val === true) return true;
              const str = String(val).trim().toLowerCase();
              return str === 'true' || str === '1' || str === 'yes';
          };

          const cleanEmail = String(getVal(['email', 'Email', 'EMAIL', 'col_1']) || '').trim().toLowerCase();
          
          let locallyGranted = false;
          try {
            const rawStored = localStorage.getItem('ai_granted_staff_emails');
            if (rawStored) {
              const list = JSON.parse(rawStored);
              if (Array.isArray(list) && list.some(e => String(e).trim().toLowerCase() === cleanEmail)) locallyGranted = true;
            }
          } catch(e) {}

          const canCheckAiVal = cleanEmail === ADMIN_EMAIL.toLowerCase() ? true : (isTrue(rawCanCheckAi) || locallyGranted);

          return {
            id: idx,
            name: getVal(['hovaten', 'Hovaten', 'name', 'Name', 'Họ và tên', 'col_0']) || 'Cán bộ',
            email: cleanEmail,
            role: getVal(['role', 'Role', 'col_3']) || 'sub-admin',
            status: getVal(['status', 'Status', 'trangthai', 'col_4']) || 'Hoạt động',
            canEdit: isTrue(rawCanEdit),
            canCheckAi: canCheckAiVal
          };
        }).filter((s: any) => s.email.length > 0);
        setStaffList(mapped);

        // Sync granted AI emails to localStorage for real-time appwide access
        const aiEmails = mapped.filter((s: any) => s.canCheckAi).map((s: any) => s.email.toLowerCase());
        if (!aiEmails.includes(ADMIN_EMAIL.toLowerCase())) aiEmails.push(ADMIN_EMAIL.toLowerCase());
        localStorage.setItem('ai_granted_staff_emails', JSON.stringify(aiEmails));
      }
    } catch (e) { console.error("Fetch Staff Error:", e); }
    finally { setIsFetchingStaff(false); }
  };

  useEffect(() => {
    if (activeTab === 'staff') fetchStaffList();
  }, [activeTab]);

  const handleStaffNameBlur = () => {
    if (!newStaffFullName) return;
    const normalized = newStaffFullName.trim().replace(/\s+/g, ' ').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    setNewStaffFullName(normalized);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMessage({ text: '', type: 'success' });
    const errors = { fullName: '', email: '', password: '' };
    let hasError = false;
    if (!newStaffFullName.trim()) { errors.fullName = 'Nhập họ tên'; hasError = true; }
    if (!validateEmail(newStaffEmail)) { errors.email = 'Email sai định dạng'; hasError = true; }
    const passCheck = checkStrength(newStaffPassword);
    if (!newStaffPassword || !passCheck.length) { errors.password = 'Mật khẩu yếu'; hasError = true; }
    setStaffFormErrors(errors);
    if (hasError) return;

    setIsAddingStaff(true);
    const cleanEmail = newStaffEmail.trim().toLowerCase();
    const res = await callAdminApi({ 
      action: 'addStaff', 
      fullName: newStaffFullName, 
      email: cleanEmail, 
      password: newStaffPassword, 
      canEdit: newStaffCanEdit,
      canCheckAi: newStaffCanCheckAi,
      CanCheckAi: newStaffCanCheckAi
    });

    if (res.success) {
        setStaffMessage({ text: 'Thêm cán bộ thành công!', type: 'success' });
        
        // Update local storage if granted AI
        if (newStaffCanCheckAi) {
          try {
            const raw = localStorage.getItem('ai_granted_staff_emails');
            const list: string[] = raw ? JSON.parse(raw) : [];
            if (!list.includes(cleanEmail)) {
              list.push(cleanEmail);
              localStorage.setItem('ai_granted_staff_emails', JSON.stringify(list));
            }
          } catch(e) {}
        }

        setNewStaffFullName(''); 
        setNewStaffEmail(''); 
        setNewStaffPassword(''); 
        setNewStaffCanEdit(false);
        setNewStaffCanCheckAi(false);
        fetchStaffList();
    } else {
        setStaffMessage({ text: res.message || 'Lỗi khi thêm', type: 'error' });
    }
    setIsAddingStaff(false);
  };

  const performStaffAction = async (email: string, actionName: string, payload: any = {}) => {
    const cleanEmail = email.trim().toLowerCase(); // Normalize Email
    setStaffActionStatus(prev => ({ ...prev, [cleanEmail]: { ...prev[cleanEmail], [actionName]: true } }));
    try {
        const res = await callAdminApi({ action: actionName, email: cleanEmail, ...payload });
        if (res.success) {
          fetchStaffList();
          setStaffMessage({ text: 'Thao tác thành công!', type: 'success' });
        } else {
          setStaffMessage({ text: res.message || 'Thao tác không thành công', type: 'error' });
        }
    } catch (e: any) { 
      setStaffMessage({ text: e.message || 'Lỗi kết nối', type: 'error' });
    }
    finally { setStaffActionStatus(prev => ({ ...prev, [cleanEmail]: { ...prev[cleanEmail], [actionName]: false } })); }
  };

  const toggleStaffAiPermission = async (staffEmail: string, currentVal: boolean) => {
    const cleanEmail = staffEmail.trim().toLowerCase();
    const newVal = !currentVal;

    // Instant local state update
    setStaffList(prev => prev.map(s => s.email === cleanEmail ? { ...s, canCheckAi: newVal } : s));

    // Update local storage for real-time permission sync
    try {
      const rawStored = localStorage.getItem('ai_granted_staff_emails');
      let list: string[] = rawStored ? JSON.parse(rawStored) : [];
      if (!Array.isArray(list)) list = [];
      if (newVal) {
        if (!list.includes(cleanEmail)) list.push(cleanEmail);
      } else {
        list = list.filter(e => e !== cleanEmail);
      }
      localStorage.setItem('ai_granted_staff_emails', JSON.stringify(list));
    } catch (e) {}

    // Call API backend
    await performStaffAction(cleanEmail, 'updateStaffCanCheckAi', { canCheckAi: newVal, CanCheckAi: newVal });
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    await performStaffAction(staffToDelete.email, 'deleteStaff');
    setStaffToDelete(null);
  };

  const passStrength = checkStrength(newStaffPassword);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 animate-fade-in border border-gray-100 min-h-[600px] max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4 md:mb-0">
          <Shield className="mr-2 text-red-600"/> Trang Quản Trị Hệ Thống
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition ${activeTab === 'users' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Users size={16} className="mr-2"/> Quản lý Người dùng
          </button>
          <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition ${activeTab === 'staff' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <UserPlus size={16} className="mr-2"/> Quản lý Cán bộ
          </button>
        </div>
      </div>

      {/* TAB: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="animate-fade-in space-y-8">
            {userMessage.text && <Alert type={userMessage.type} message={userMessage.text} onClose={()=>setUserMessage({text:'', type:'success'})}/>}

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center"><Search size={18} className="mr-2"/> Tra cứu Người dùng</h3>
                <div className="relative">
                    <input type="text" value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} placeholder="Nhập Họ tên, Email, SĐT... (Để trống để hiện tất cả)" className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-3 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"/>
                    {isUserSearching && <RefreshCw size={20} className="animate-spin text-blue-500 absolute right-3 top-3"/>}
                </div>
                <p className="text-xs text-gray-500 mt-2">* Hệ thống sẽ tự động tìm kiếm trong danh sách UserName.</p>
            </div>

            {userList.length > 0 ? (
                <div className="border rounded-xl overflow-hidden shadow-sm animate-fade-in">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                        <tr>
                            <th className="p-4">Thông tin tài khoản</th>
                            <th className="p-4">Vai trò</th>
                            <th className="p-4">Cấp quyền Ghi (Edit)</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-center">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {userList.map((u, idx) => {
                            if (u.email === ADMIN_EMAIL) return null;
                            const isLoadingAction = (action: string) => userActionStatus[`${u.email}-${action}`];
                            const statusLower = String(u.status).toLowerCase();
                            const isLockedOrDeleted = statusLower === 'tạm dừng' || statusLower === 'tam dung' || statusLower === 'đã xóa' || statusLower === 'da xoa';
                            const isDeleted = statusLower === 'đã xóa' || statusLower === 'da xoa';

                            return (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                    {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                                </td>
                                <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">{u.role}</span></td>
                                <td className="p-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={!!u.canEdit} 
                                            onChange={() => toggleUserPermission(u)}
                                            disabled={userActionStatus[`${u.email}-permission`]}
                                            className="h-4 w-4 text-blue-600 rounded disabled:opacity-50 cursor-pointer"
                                        />
                                        <span className={`ml-2 text-xs font-bold ${u.canEdit ? 'text-green-600' : 'text-gray-400'}`}>
                                            {userActionStatus[`${u.email}-permission`] ? '...' : (u.canEdit ? 'Được phép' : 'Chặn')}
                                        </span>
                                    </label>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.status==='Hoạt động' || u.status==='active' ? 'bg-green-100 text-green-700': u.status==='Đã xóa' || u.status==='Da xoa' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button onClick={()=>handleUserAction(u, 'reset')} disabled={isLoadingAction('reset')} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition disabled:opacity-50" title="Reset Pass">
                                        <RefreshCw size={16} className={isLoadingAction('reset') ? "animate-spin" : ""}/>
                                    </button>
                                    <button onClick={()=>handleUserAction(u, 'lock')} disabled={isLoadingAction('lock')} className={`p-2 rounded transition disabled:opacity-50 ${isLockedOrDeleted ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'}`} title={isLockedOrDeleted ? (isDeleted ? "Khôi phục tài khoản" : "Mở khóa") : "Tạm dừng"}>
                                        {isLoadingAction('lock') ? <RefreshCw size={16} className="animate-spin"/> : (isLockedOrDeleted ? (isDeleted ? <Undo size={16}/> : <Unlock size={16}/>) : <Lock size={16}/>)}
                                    </button>
                                    <button onClick={()=>handleUserAction(u, 'delete')} disabled={isLoadingAction('delete')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition disabled:opacity-50" title="Xóa">
                                        {isLoadingAction('delete') ? <RefreshCw size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                                    </button>
                                </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    {isUserSearching ? 'Đang tìm kiếm...' : 'Không có dữ liệu hiển thị.'}
                </div>
            )}
        </div>
      )}

      {/* TAB: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="animate-fade-in max-w-5xl mx-auto">
            {staffMessage.text && <Alert type={staffMessage.type} message={staffMessage.text} onClose={()=>setStaffMessage({text:'', type:'success'})}/>}
            
            <form onSubmit={handleAddStaff} className="mb-8 p-6 border rounded-xl bg-gray-50 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-blue-900">Thêm Cán bộ mới</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <InputField name="name" value={newStaffFullName} onChange={e=>setNewStaffFullName(e.target.value)} onBlur={handleStaffNameBlur} placeholder="Họ và tên" error={staffFormErrors.fullName} />
                    </div>
                    <div>
                        <InputField name="email" value={newStaffEmail} onChange={e=>setNewStaffEmail(e.target.value)} placeholder="Email" error={staffFormErrors.email} />
                    </div>
                    <div>
                        <InputField name="pass" type={showStaffPassword ? "text" : "password"} value={newStaffPassword} onChange={e=>setNewStaffPassword(e.target.value)} placeholder="Mật khẩu" error={staffFormErrors.password} showEye={showStaffPassword} onToggleEye={() => setShowStaffPassword(!showStaffPassword)} />
                    </div>
                </div>
                {newStaffPassword && <PasswordRequirements passStrength={passStrength} />}
                <div className="flex flex-wrap justify-between items-center gap-4 mt-4 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={newStaffCanEdit} onChange={e=>setNewStaffCanEdit(e.target.checked)} className="h-4 w-4 text-blue-600 rounded cursor-pointer" />
                            <span className="ml-2 text-sm text-gray-700 font-medium">Cấp quyền Ghi (Edit)</span>
                        </label>
                        <label className="flex items-center cursor-pointer bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 shadow-xs">
                            <input type="checkbox" checked={newStaffCanCheckAi} onChange={e=>setNewStaffCanCheckAi(e.target.checked)} className="h-4 w-4 text-purple-600 rounded cursor-pointer" />
                            <span className="ml-2 text-sm text-purple-900 font-bold">Cấp quyền Kiểm tra AI</span>
                        </label>
                    </div>
                    <button disabled={isAddingStaff} type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer shadow-sm">
                        {isAddingStaff ? 'Đang thêm...' : 'Thêm Cán bộ'}
                    </button>
                </div>
            </form>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm text-left">
                    <thead className="bg-blue-600 text-white font-semibold">
                        <tr>
                            <th className="p-3 text-center">STT</th>
                            <th className="p-3">Họ và tên</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Quyền hạn</th>
                            <th className="p-3">Cấp quyền AI</th>
                            <th className="p-3">Trạng thái</th>
                            <th className="p-3 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.filter(s => s.status !== 'Đã xóa').map((staff, index) => (
                            <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-3 text-center">{index+1}</td>
                                <td className="p-3 font-medium">{staff.name}</td>
                                <td className="p-3 text-gray-600 font-mono text-xs">{staff.email} {staff.email === ADMIN_EMAIL && <span className="text-blue-600 font-bold">(Admin)</span>}</td>
                                <td className="p-3">
                                    {staff.email === ADMIN_EMAIL ? <span className="font-bold text-blue-600">Toàn quyền</span> : (
                                        <label className="flex items-center cursor-pointer">
                                            <input type="checkbox" checked={staff.canEdit} onChange={e => performStaffAction(staff.email, 'updateStaffCanEdit', { canEdit: e.target.checked })} disabled={staffActionStatus[staff.email]?.['updateStaffCanEdit']} className="mr-2 h-4 w-4 text-blue-600 rounded disabled:opacity-50 cursor-pointer" />
                                            <span className={staff.canEdit ? 'text-green-600 font-medium' : 'text-gray-500'}>{staff.canEdit ? 'Đọc & Ghi' : 'Chỉ đọc'}</span>
                                        </label>
                                    )}
                                </td>
                                <td className="p-3">
                                    {staff.email === ADMIN_EMAIL ? (
                                        <span className="font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 inline-block text-xs">Toàn quyền</span>
                                    ) : (
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={!!staff.canCheckAi} 
                                                onChange={() => toggleStaffAiPermission(staff.email, !!staff.canCheckAi)} 
                                                disabled={staffActionStatus[staff.email]?.['updateStaffCanCheckAi']} 
                                                className="mr-2 h-4 w-4 text-purple-600 rounded disabled:opacity-50 cursor-pointer" 
                                            />
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${staff.canCheckAi ? 'text-purple-700 bg-purple-50 border-purple-300' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
                                                {staffActionStatus[staff.email]?.['updateStaffCanCheckAi'] ? '...' : (staff.canCheckAi ? '✓ Được phép' : 'Chưa cấp')}
                                            </span>
                                        </label>
                                    )}
                                </td>
                                <td className={`p-3 font-semibold ${staff.status==='Hoạt động'?'text-green-600':'text-orange-500'}`}>{staff.status}</td>
                                <td className="p-3 flex justify-center gap-2">
                                    {staff.email !== ADMIN_EMAIL && (
                                        <>
                                            <button onClick={() => performStaffAction(staff.email, 'updateStaffStatus', { status: staff.status==='Hoạt động'?'Tạm dừng':'Hoạt động' })} disabled={staffActionStatus[staff.email]?.['updateStaffStatus']} className="text-blue-600 hover:bg-blue-50 p-1 rounded cursor-pointer">
                                                {staffActionStatus[staff.email]?.['updateStaffStatus'] ? '...' : (staff.status==='Hoạt động'?'Tạm dừng':'Kích hoạt')}
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button onClick={() => setStaffToDelete(staff)} className="text-red-600 hover:bg-red-50 p-1 rounded cursor-pointer">Xóa</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* MODALS */}
      {staffToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-bold text-red-600 mb-2">Xác nhận Xóa Cán bộ</h3>
                <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa quyền truy cập của <strong>{staffToDelete.name}</strong> ({staffToDelete.email})?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={()=>setStaffToDelete(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                    <button onClick={confirmDeleteStaff} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xác nhận Xóa</button>
                </div>
            </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fade-in-up">
                <div className="flex items-center text-red-600 mb-4">
                    <Trash2 size={32} className="mr-3" />
                    <h3 className="text-xl font-bold">Xóa Tài khoản User</h3>
                </div>
                <p className="text-gray-600 mb-6">
                    Bạn có chắc chắn muốn xóa tài khoản <strong>{userToDelete.name}</strong> ({userToDelete.email})? 
                    <br/><span className="text-red-500 text-sm mt-2 block font-medium">Lưu ý: Người dùng sẽ không thể đăng nhập được nữa.</span>
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setUserToDelete(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">Hủy bỏ</button>
                    <button onClick={confirmDeleteUser} disabled={userActionStatus[`${userToDelete.email}-delete`]} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700">
                        {userActionStatus[`${userToDelete.email}-delete`] ? 'Đang xóa...' : 'Xác nhận Xóa'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {userToReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fade-in-up">
                <div className="flex items-center text-orange-600 mb-4">
                    <RefreshCw size={32} className="mr-3" />
                    <h3 className="text-xl font-bold">Reset Mật khẩu</h3>
                </div>
                <p className="text-gray-600 mb-6">
                    Bạn muốn đặt lại mật khẩu cho <strong>{userToReset.email}</strong> về mặc định là <code>Hcmue@123</code>?
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setUserToReset(null)} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Hủy bỏ</button>
                    <button onClick={confirmResetUser} disabled={userActionStatus[`${userToReset.email}-reset`]} className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600">
                        {userActionStatus[`${userToReset.email}-reset`] ? 'Đang xử lý...' : 'Xác nhận Reset'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {userToLock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fade-in-up">
                <div className="flex items-center text-blue-600 mb-4">
                    {String(userToLock.status).toLowerCase().includes('hoạt động') ? <PauseCircle size={32} className="mr-3"/> : <RotateCcw size={32} className="mr-3"/>}
                    <h3 className="text-xl font-bold">
                        {String(userToLock.status).toLowerCase().includes('hoạt động') ? 'Tạm dừng Tài khoản' : 'Khôi phục / Mở khóa'}
                    </h3>
                </div>
                <p className="text-gray-600 mb-6">
                    {String(userToLock.status).toLowerCase().includes('hoạt động') 
                        ? <>Bạn muốn tạm dừng tài khoản <strong>{userToLock.email}</strong>? Người dùng sẽ không thể đăng nhập.</>
                        : <>Bạn muốn khôi phục (mở khóa) tài khoản <strong>{userToLock.email}</strong> để họ có thể đăng nhập lại?</>
                    }
                </p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setUserToLock(null)} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Hủy bỏ</button>
                    <button onClick={confirmLockUser} disabled={userActionStatus[`${userToLock.email}-lock`]} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">
                        {userActionStatus[`${userToLock.email}-lock`] ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
