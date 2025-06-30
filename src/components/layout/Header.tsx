import { Menu, Search, Plus, Zap, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu as HeadlessMenu } from '@headlessui/react';
import AddProductModal from '../product/AddProductModal';
import SearchResults from '../search/SearchResults';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { fetchAllProducts } = useProductStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Close search results when clicking outside
  useClickOutside(searchRef, () => {
    setShowSearchResults(false);
    setSelectedSearchIndex(-1);
  });

  // Show/hide search results based on query
  useEffect(() => {
    const shouldShow = searchQuery.trim().length > 0;
    setShowSearchResults(shouldShow);
    
    // Reset selected index when query changes
    if (shouldShow) {
      setSelectedSearchIndex(-1);
    }
  }, [searchQuery]);

  // Ensure we have all products loaded for search when component mounts
  useEffect(() => {
    if (user) {
      fetchAllProducts();
    }
  }, [user, fetchAllProducts]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is handled in real-time, but we can add additional logic here if needed
  };

  const handleSearchResultClick = () => {
    setShowSearchResults(false);
    setSearchQuery('');
    setSelectedSearchIndex(-1);
    
    // Blur the search input to remove focus
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };
  
  const handleLogoClick = () => {
    navigate(user ? '/discover' : '/');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedSearchIndex(-1);
    
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchInputKeyDown = (e: React.KeyboardEvent) => {
    // Let SearchResults component handle navigation keys
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      // Don't prevent default here - let SearchResults handle it
      return;
    }
  };

  const handleSearchInputFocus = () => {
    if (searchQuery.trim().length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-primary-200 sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-16">
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
                ref={searchInputRef}
                type="text"
                placeholder="Search products, lists, folders, and tags..."
                className="input pl-10 pr-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchInputKeyDown}
                onFocus={handleSearchInputFocus}
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
                selectedIndex={selectedSearchIndex}
                onSelectedIndexChange={setSelectedSearchIndex}
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
        
        {/* Right Section - Bolt Logo and Profile */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Bolt Logo - Full height */}
          <img 
            src="/bolt_white_circle_360x360.png" 
            alt="Bolt Logo" 
            className="h-14 w-14"
          />
          
          {/* User Dropdown Menu */}
          <HeadlessMenu as="div" className="relative">
            <HeadlessMenu.Button className="flex items-center gap-1 p-1 rounded-md hover:bg-primary-100 transition-colors">
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
              <ChevronDown size={14} className="text-primary-500" />
            </HeadlessMenu.Button>

            <HeadlessMenu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-elevated border border-primary-200 py-1 z-50 focus:outline-none">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-primary-100">
                <p className="text-sm font-medium text-primary-900 truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-primary-500 truncate">
                  {user?.email}
                </p>
              </div>

              {/* Menu Items */}
              <HeadlessMenu.Item>
                {({ active }) => (
                  <button
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors",
                      active ? "bg-primary-50 text-primary-900" : "text-primary-700"
                    )}
                    onClick={() => navigate('/settings')}
                  >
                    <div className="w-4 h-4 rounded bg-primary-200 flex items-center justify-center">
                      <span className="text-xs">⚙️</span>
                    </div>
                    <span>Settings</span>
                  </button>
                )}
              </HeadlessMenu.Item>

              <HeadlessMenu.Item>
                {({ active }) => (
                  <button
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors",
                      active ? "bg-error-50 text-error-900" : "text-error-700"
                    )}
                    onClick={handleLogout}
                  >
                    <div className="w-4 h-4 rounded bg-error-100 flex items-center justify-center">
                      <span className="text-xs">🚪</span>
                    </div>
                    <span>Log out</span>
                  </button>
                )}
              </HeadlessMenu.Item>
            </HeadlessMenu.Items>
          </HeadlessMenu>
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
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              className="input pl-10 pr-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchInputKeyDown}
              onFocus={handleSearchInputFocus}
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
              selectedIndex={selectedSearchIndex}
              onSelectedIndexChange={setSelectedSearchIndex}
            />
          </div>
        )}
      </div>
      
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
    </header>
  );
};

export default Header;