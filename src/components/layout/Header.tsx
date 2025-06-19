import { Menu, Bell, Search, Plus, Zap, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AddProductModal from '../product/AddProductModal';
import SearchResults from '../search/SearchResults';
import { useAuthStore } from '../../store/authStore';
import { useClickOutside } from '../../hooks/useClickOutside';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Close search results when clicking outside
  useClickOutside(searchRef, () => {
    setShowSearchResults(false);
  });

  // Show/hide search results based on query
  useEffect(() => {
    setShowSearchResults(searchQuery.trim().length > 0);
  }, [searchQuery]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is handled in real-time, but we can add additional logic here if needed
  };

  const handleSearchResultClick = () => {
    setShowSearchResults(false);
    setSearchQuery('');
  };
  
  const handleLogoClick = () => {
    navigate(user ? '/dashboard' : '/');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-primary-200 sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 flex items-center h-16">
        {/* Left Section - Logo and Mobile Menu */}
        <div className="flex items-center flex-shrink-0">
          <button 
            onClick={onMenuToggle}
            className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 focus:outline-none md:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
            <Zap size={24} className="text-accent-500" />
            <span className="ml-2 text-xl font-medium text-primary-800">Whizlist</span>
          </div>
        </div>
        
        {/* Center Section - Search Bar and Add Product (Desktop Only) */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-center px-8">
          <div className="w-full max-w-lg relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-primary-400" />
              </div>
              <input
                type="text"
                placeholder="Search products, lists, folders, and tags..."
                className="input pl-10 pr-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-400 hover:text-primary-600"
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <SearchResults 
                query={searchQuery} 
                onResultClick={handleSearchResultClick}
              />
            )}
          </div>
          
          <button 
            className="btn-accent flex items-center gap-2 flex-shrink-0"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
        
        {/* Right Section - Notifications and Profile */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <button className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
          </button>
          
          <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-medium">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span className="text-sm">
                {getInitials(user?.user_metadata?.full_name)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile search bar with Add Product button */}
      <div className="md:hidden px-4 pb-3" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-primary-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="input pl-10 pr-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-400 hover:text-primary-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Add Product Button - Right side of search */}
          <button 
            type="button"
            className="btn-accent flex items-center justify-center px-3 flex-shrink-0"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
          </button>
        </form>

        {/* Mobile Search Results */}
        {showSearchResults && (
          <div className="mt-2">
            <SearchResults 
              query={searchQuery} 
              onResultClick={handleSearchResultClick}
            />
          </div>
        )}
      </div>
      
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
    </header>
  );
};

export default Header;