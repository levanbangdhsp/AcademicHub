import React, { useState } from 'react';
import { GraduationCap, PenTool, Database, ShieldAlert, Lock } from 'lucide-react';

import { Navigation } from './components/Navigation';
import { ChatBox } from './components/ChatBox';
import { ResearchBuilder } from './components/ResearchBuilder';
import { ThesisBuilder } from './components/ThesisBuilder';
import { TopicChecker } from './components/TopicChecker';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { TrainingModule } from './components/TrainingModule';
import { AdminDashboard } from './components/AdminDashboard';
import { TutorialsView } from './components/TutorialsView';
import { HomeView } from './components/HomeView'; // Import HomeView
import { AiDetector } from './components/AiDetector';
import { filterProjectsForUser } from './services/thesisSheetService';
import { AiAccessDeniedModal } from './components/AiAccessDeniedModal';
import { User, isAiCheckAdmin, ADMIN_EMAIL } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('academichub_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('academichub_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const savedTab = localStorage.getItem('academichub_activeTab');
        if (savedTab && savedTab !== 'landing') return savedTab;
        return u.role === 'admin' ? 'admin' : 'home';
      }
      return 'landing';
    } catch {
      return 'landing';
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAiDeniedModal, setShowAiDeniedModal] = useState(false);

  // --- GLOBAL STATE FOR PERSISTENCE ---
  // Lưu trữ danh sách đề tài và mã học viên ở cấp App để không bị mất khi chuyển tab
  const [cachedProjects, setCachedProjects] = useState<any[]>([]);
  const [cachedStudentId, setCachedStudentId] = useState<string>('');

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('academichub_activeTab', tab);
    } catch {}
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setShowAuthModal(false);
    const targetTab = userData.role === 'admin' ? 'admin' : 'home';
    changeTab(targetTab);
    try {
      localStorage.setItem('academichub_user', JSON.stringify(userData));
    } catch {}
  };

  const handleLogout = () => {
    setUser(null);
    setCachedProjects([]); // Clear cache on logout
    setCachedStudentId('');
    changeTab('landing');
    try {
      localStorage.removeItem('academichub_user');
      localStorage.removeItem('academichub_activeTab');
    } catch {}
  };

  // Hàm xử lý nút "Quay lại" từ trang Hướng dẫn
  const handleBackFromGuides = () => {
    if (user) {
      changeTab('home');
    } else {
      changeTab('landing');
    }
  };

  // Callback để ThesisBuilder cập nhật dữ liệu lên App
  const handleCacheUpdate = (projects: any[], studentId: string) => {
      setCachedProjects(projects);
      setCachedStudentId(studentId);
  };

  // Calculate counts for HomeView filtered by user permissions
  const userProjects = filterProjectsForUser(cachedProjects, user, '');
  const paperCount = userProjects.filter(p => p.projectType === 'scientific_paper').length;
  const thesisCount = userProjects.length - paperCount;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={changeTab} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        onAiAccessDenied={() => setShowAiDeniedModal(true)}
      />

      {/* Remove top padding on landing page for banner flush fit */}
      {/* UPDATE: Removed max-w-7xl and mx-auto to make it full width */}
      <main className={`w-full px-4 pb-32 flex-grow ${!user && activeTab === 'landing' ? 'pt-0' : 'py-8'}`}>
        
        {/* Guest Views */}
        {!user && (activeTab === 'landing' || activeTab === 'ai-check') && (
          <LandingPage onOpenAuth={() => setShowAuthModal(true)} />
        )}
        {!user && activeTab === 'guides' && <TutorialsView onBack={handleBackFromGuides} />}
        
        {/* Logged In Views */}
        {user && (
          <>
            {activeTab === 'home' && (
              <HomeView 
                setActiveTab={changeTab} 
                user={user} 
                thesisCount={thesisCount}
                paperCount={paperCount}
                cachedStudentId={cachedStudentId}
                onAiAccessDenied={() => setShowAiDeniedModal(true)}
              />
            )}
            {/* UPDATED: Pass user prop to TrainingModule */}
            {activeTab === 'training' && <TrainingModule user={user} />} 
            
            {activeTab === 'research' && (
                <ResearchBuilder 
                    user={user} // Pass full user object for permission check
                    cachedProjects={cachedProjects} // Pass cached projects for conversion feature
                    initialStudentId={cachedStudentId} // Pass ID for saving
                    onCacheUpdate={handleCacheUpdate} // Allow updating cache
                />
            )}
            {activeTab === 'thesis' && (
                <ThesisBuilder 
                    user={user} // Pass full user object for permission check
                    initialProjects={cachedProjects}
                    initialStudentId={cachedStudentId}
                    onCacheUpdate={handleCacheUpdate}
                />
            )}
            {activeTab === 'ai-check' && (
              isAiCheckAdmin(user) ? (
                <AiDetector user={user} onOpenAuth={() => setShowAuthModal(true)} />
              ) : (
                <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl shadow-xl border border-red-100 p-8 sm:p-12 text-center animate-fade-in">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner border border-red-100">
                    <ShieldAlert size={40} />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 mb-3">
                    <Lock size={13}/> Quyền hạn Quản trị viên
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Tính năng giới hạn quyền truy cập</h2>
                  <p className="text-gray-600 mb-4 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
                    Công cụ <strong>Kiểm tra AI & Đối chiếu Đạo văn</strong> yêu cầu quyền truy cập đặc quyền và chỉ dành riêng cho tài khoản Quản trị viên toàn quyền:
                  </p>
                  <div className="bg-red-50/70 border border-red-200 rounded-2xl px-4 py-2.5 mb-6 inline-block font-mono font-bold text-red-700 text-base">
                    {ADMIN_EMAIL}
                  </div>
                  <p className="text-xs text-gray-500 mb-8 max-w-md mx-auto">
                    Tài khoản hiện tại của bạn: <strong>{user.email}</strong> ({user.role === 'admin' ? 'Quản trị viên' : 'Học viên / Thành viên'}). Vui lòng liên hệ Thầy Quản trị nếu có nhu cầu kiểm tra văn bản.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button
                      onClick={() => setActiveTab('home')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-blue-200 transition"
                    >
                      Trở về Trang chủ
                    </button>
                    <button
                      onClick={() => setShowAiDeniedModal(true)}
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-full font-bold transition shadow-sm"
                    >
                      Xem thông báo chi tiết
                    </button>
                  </div>
                </div>
              )
            )}
            {activeTab === 'check' && <TopicChecker />}
            {activeTab === 'guides' && <TutorialsView onBack={handleBackFromGuides} />}
            {activeTab === 'admin' && user.role === 'admin' && <AdminDashboard />}
          </>
        )}
      </main>

      <footer className="bg-blue-50 border-t border-blue-100 py-8 text-center text-gray-500 text-sm mt-auto">
        <p>© 2024 AcademicHub System. All rights reserved.</p>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLoginSuccess} />
      <AiAccessDeniedModal 
        isOpen={showAiDeniedModal} 
        onClose={() => setShowAiDeniedModal(false)} 
        currentUserEmail={user?.email} 
        currentRole={user?.role} 
      />
      <ChatBox />
    </div>
  );
};

export default App;