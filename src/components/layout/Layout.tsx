import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import GlobalCommentsSidebar from '../comment/GlobalCommentsSidebar';
import { useState } from 'react';
import { useGlobalCommentsStore } from '../../store/globalCommentsStore';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOpen, productId, productTitle, closeComments } = useGlobalCommentsStore();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main content with left margin to account for fixed sidebar on desktop */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 md:ml-64 transition-all duration-300 ${isOpen ? 'lg:mr-96' : ''}`}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Comments Sidebar */}
      <GlobalCommentsSidebar
        isOpen={isOpen}
        onClose={closeComments}
        productId={productId}
        productTitle={productTitle}
      />
    </div>
  );
};

export default Layout;