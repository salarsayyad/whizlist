import { Menu, Bell, Search, Plus, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddProductModal from '../product/AddProductModal';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation of search functionality would go here
    console.log('Searching for:', searchQuery);
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-primary-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="flex items-center">
          <button 
            onClick={onMenuToggle}
            className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 focus:outline-none md:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <Zap size={24} className="text-accent-500" />
            <span className="ml-2 text-xl font-medium text-primary-800">Whizlist</span>
          </div>
        </div>
        
        <div className="hidden md:block flex-1 max-w-lg mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-primary-400" />
            </div>
            <input
              type="text"
              placeholder="Search products and lists..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="btn-accent flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Product</span>
          </button>
          
          <button className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
          </button>
          
          <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-medium">
            JS
          </div>
        </div>
      </div>
      
      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-primary-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
    </header>
  );
};

export default Header;