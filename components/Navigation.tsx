import React from 'react';
import { 
  Monitor, 
  GraduationCap, 
  PenTool, 
  FileText, 
  Menu, 
  X,
  Database,
  User as UserIcon,
  LogOut,
  Shield,
  Info
} from 'lucide-react';
import { NavigationProps } from '../types';

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  user,
  onLogout,
  onOpenAuth
}) => {
  
  const navItems = user 
    ? [
        { id: 'home', label: 'Trang chủ', icon: <Monitor size={18}/> },
        { id: 'training', label: 'Đào tạo', icon: <GraduationCap size={18}/> },
        { id: 'research', label: 'NCKH', icon: <PenTool size={18}/> },
        { id: 'thesis', label: 'Dự án Học thuật', icon: <FileText size={18}/> },
        { id: 'check', label: 'Tra cứu', icon: <Database size={18}/> },
        ...(user.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: <Shield size={18}/> }] : [])
      ] 
    : [];

  return (
    <nav className="bg-blue-50 shadow-sm sticky top-0 z-40 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-20 items-center">
            {/* Logo & Brand */}
            <div className="flex items-center cursor-pointer" onClick={() => setActiveTab(user ? 'home' : 'landing')}>
              <div className="bg-blue-900 text-white p-2 rounded-lg mr-3">
                <GraduationCap size={24} />
              </div>
              <div className="flex flex-col">
                 <span className="font-bold text-xl text-blue-900 leading-none">AcademicHub</span>
                 <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Research Ecosystem</span>
              </div>
            </div>

            {/* Desktop Menu - User items only */}
            <div className="hidden md:flex space-x-1 items-center">
              {user && navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    activeTab === item.id ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  {item.icon} <span className="ml-2">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Auth & Info Buttons */}
            <div className="flex items-center gap-3">
              {/* Public Button: Giới thiệu - Placed next to Login */}
              <button
                  onClick={() => setActiveTab('guides')}
                  className={`flex items-center px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
                    activeTab === 'guides' 
                    ? 'bg-blue-700 text-white shadow-blue-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  <Info size={18} className="mr-2" /> Giới thiệu
              </button>

              {user ? (
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                   <div className="text-right hidden sm:block">
                     <p className="text-xs font-bold text-gray-800">{user.name}</p>
                     <p className="text-xs text-gray-500">{user.email}</p>
                   </div>
                   <button onClick={onLogout} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition" title="Đăng xuất">
                     <LogOut size={16} />
                   </button>
                </div>
              ) : (
                <button 
                  onClick={onOpenAuth} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold shadow-md shadow-blue-200 transition flex items-center"
                >
                  <UserIcon size={18} className="mr-2"/> Đăng nhập
                </button>
              )}
              
              {/* Mobile Menu Toggle */}
              <button className="md:hidden text-gray-600 ml-2" onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X/> : <Menu/>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-50 border-t border-blue-100 p-4 space-y-2">
             <button onClick={()=>{setActiveTab('guides'); setMobileMenuOpen(false)}} className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/50 flex items-center font-medium text-gray-700">
                 <Info size={18} /> <span className="ml-3">Giới thiệu</span>
             </button>

            {user && navItems.map(item => (
               <button key={item.id} onClick={()=>{setActiveTab(item.id); setMobileMenuOpen(false)}} className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/50 flex items-center font-medium text-gray-700">
                 {item.icon} <span className="ml-3">{item.label}</span>
               </button>
            ))}
          </div>
        )}
    </nav>
  );
};