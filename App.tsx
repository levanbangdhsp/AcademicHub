import React, { useState } from 'react';
import { GraduationCap, PenTool, Database } from 'lucide-react';

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
import { User } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- GLOBAL STATE FOR PERSISTENCE ---
  // Lưu trữ danh sách đề tài và mã học viên ở cấp App để không bị mất khi chuyển tab
  const [cachedProjects, setCachedProjects] = useState<any[]>([]);
  const [cachedStudentId, setCachedStudentId] = useState<string>('');

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setShowAuthModal(false);
    setActiveTab(userData.role === 'admin' ? 'admin' : 'home');
  };

  const handleLogout = () => {
    setUser(null);
    setCachedProjects([]); // Clear cache on logout
    setCachedStudentId('');
    setActiveTab('landing');
  };

  // Hàm xử lý nút "Quay lại" từ trang Hướng dẫn
  const handleBackFromGuides = () => {
    if (user) {
      setActiveTab('home');
    } else {
      setActiveTab('landing');
    }
  };

  // Callback để ThesisBuilder cập nhật dữ liệu lên App
  const handleCacheUpdate = (projects: any[], studentId: string) => {
      setCachedProjects(projects);
      setCachedStudentId(studentId);
  };

  // Calculate counts for HomeView
  const paperCount = cachedProjects.filter(p => p.projectType === 'scientific_paper').length;
  const thesisCount = cachedProjects.length - paperCount;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Remove top padding on landing page for banner flush fit */}
      <main className={`max-w-7xl mx-auto px-4 pb-32 flex-grow w-full ${!user && activeTab === 'landing' ? 'pt-0' : 'py-8'}`}>
        
        {/* Guest Views */}
        {!user && activeTab === 'landing' && <LandingPage onOpenAuth={() => setShowAuthModal(true)} />}
        {!user && activeTab === 'guides' && <TutorialsView onBack={handleBackFromGuides} />}
        
        {/* Logged In Views */}
        {user && (
          <>
            {activeTab === 'home' && (
              <HomeView 
                setActiveTab={setActiveTab} 
                user={user} 
                thesisCount={thesisCount}
                paperCount={paperCount}
                cachedStudentId={cachedStudentId}
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
      <ChatBox />
    </div>
  );
};

export default App;