import { X, Grid, List as ListIcon, FolderOpen, Share2, Star, Trash2, Settings, Plus, ChevronDown, ChevronRight, Package, TrendingUp, Pin } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import { useFolderStore } from '../../store/folderStore';
import { useListStore } from '../../store/listStore';
import { useProductStore } from '../../store/productStore';
import CreateFolderModal from '../folder/CreateFolderModal';
import CreateListModal from '../list/CreateListModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const { folders, fetchFolders } = useFolderStore();
  const { lists, fetchLists, togglePin } = useListStore();
  const { fetchProducts } = useProductStore();
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  useEffect(() => {
    fetchFolders();
    fetchLists();
    
    // Fetch all products separately for sidebar calculations
    fetchAllProductsForSidebar();
  }, []);

  // Separate function to fetch all products for sidebar calculations
  const fetchAllProductsForSidebar = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database products to UI products
      const mappedProducts = (data || []).map((dbProduct: any) => ({
        id: dbProduct.id,
        title: dbProduct.title,
        description: dbProduct.description,
        price: dbProduct.price,
        imageUrl: dbProduct.image_url,
        productUrl: dbProduct.product_url,
        isPinned: dbProduct.is_pinned || false,
        tags: dbProduct.tags || [],
        listId: dbProduct.list_id,
        ownerId: dbProduct.owner_id,
        createdAt: dbProduct.created_at,
        updatedAt: dbProduct.updated_at
      }));
      
      setAllProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products for sidebar:', error);
    }
  };

  // Refresh products when location changes to ensure count is always accurate
  useEffect(() => {
    fetchAllProductsForSidebar();
  }, [location.pathname]);
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleFolderClick = (folderId: string) => {
    // Check if we're currently on this folder's detail page
    const isCurrentFolder = location.pathname === `/folder/${folderId}`;
    
    if (isCurrentFolder) {
      // If we're on the folder page, just toggle expansion
      toggleFolder(folderId);
    } else {
      // If we're not on the folder page, expand and navigate
      if (!expandedFolders.includes(folderId)) {
        setExpandedFolders(prev => [...prev, folderId]);
      }
      
      // Navigate to the folder page
      navigate(`/folder/${folderId}`);
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleChevronClick = (e: React.MouseEvent, folderId: string) => {
    // Stop event propagation to prevent folder navigation
    e.stopPropagation();
    // Only toggle the folder expansion
    toggleFolder(folderId);
  };

  const handleListPin = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation(); // Prevent navigation to list detail
    e.preventDefault(); // Prevent any default behavior
    
    try {
      console.log('Toggling pin for list:', listId); // Debug log
      await togglePin(listId);
      console.log('Pin toggle completed'); // Debug log
    } catch (error) {
      console.error('Error toggling list pin:', error);
    }
  };
  
  const getFolderLists = (folderId: string) => {
    const folderLists = lists.filter(list => list.folderId === folderId);
    // Sort lists with pinned first, then by creation date
    return folderLists.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };
  
  const getUnorganizedLists = () => {
    const unorganizedLists = lists.filter(list => !list.folderId);
    // Sort lists with pinned first, then by creation date
    return unorganizedLists.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Get count of unassigned products (products without a list_id) using allProducts
  const getUnassignedProductCount = () => {
    return allProducts.filter(product => !product.listId).length;
  };
  
  const handleCreateFolder = () => {
    setShowCreateFolder(true);
  };
  
  const handleCreateList = (folderId?: string) => {
    setSelectedFolderId(folderId || null);
    setShowCreateList(true);
  };

  const handleNavLinkClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleUnassignedClick = () => {
    navigate('/unassigned');
    handleNavLinkClick();
  };

  const handleUnderConstructionClick = () => {
    navigate('/under-construction');
    handleNavLinkClick();
  };
  
  return (
    <>
      {/* Mobile backdrop - Higher z-index */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}
      
      {/* Sidebar - Highest z-index on mobile */}
      <aside 
        className={cn(
          "fixed top-0 w-64 bg-white border-r border-primary-200 transition-transform duration-300 ease-in-out h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "flex flex-col",
          // Different z-index for mobile vs desktop
          "z-50 md:z-30"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <h2 className="text-lg font-medium text-primary-800">Menu</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Add top padding on desktop to account for fixed header */}
        <div className="hidden md:block h-16 flex-shrink-0"></div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            <li>
              <NavLink 
                to="/discover" 
                end
                className={({ isActive }) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
                onClick={handleNavLinkClick}
              >
                <TrendingUp size={18} />
                <span>Discover</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/dashboard" 
                end
                className={({ isActive }) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
                onClick={handleNavLinkClick}
              >
                <Grid size={18} />
                <span>All Products</span>
              </NavLink>
            </li>
            <li>
              <button 
                className="nav-link w-full text-left"
                onClick={handleUnderConstructionClick}
              >
                <Star size={18} />
                <span>Starred</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-link w-full text-left"
                onClick={handleUnderConstructionClick}
              >
                <Share2 size={18} />
                <span>Shared with me</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-link w-full text-left"
                onClick={handleUnderConstructionClick}
              >
                <Trash2 size={18} />
                <span>Trash</span>
              </button>
            </li>
          </ul>
          
          <div className="mt-8">
            <div className="px-3 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-primary-500">COLLECTIONS</h3>
              <Menu as="div" className="relative">
                <Menu.Button className="text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100">
                  <Plus size={16} />
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-elevated py-1 z-50">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 text-sm",
                          active ? "bg-primary-50 text-primary-900" : "text-primary-700"
                        )}
                        onClick={handleCreateFolder}
                      >
                        <FolderOpen size={16} />
                        <span>New Folder</span>
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 text-sm",
                          active ? "bg-primary-50 text-primary-900" : "text-primary-700"
                        )}
                        onClick={() => handleCreateList()}
                      >
                        <ListIcon size={16} />
                        <span>New List</span>
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </div>
            
            <ul className="space-y-1">
              {/* Folders and their lists */}
              {folders.map(folder => (
                <li key={folder.id}>
                  <button 
                    className="nav-link w-full"
                    onClick={() => handleFolderClick(folder.id)}
                  >
                    <FolderOpen size={18} />
                    <span className="flex-1 text-left">{folder.name}</span>
                    <span className="text-xs text-primary-500 mr-2">
                      {getFolderLists(folder.id).length}
                    </span>
                    <button
                      onClick={(e) => handleChevronClick(e, folder.id)}
                      className="p-1 hover:bg-primary-200 rounded transition-colors"
                    >
                      {expandedFolders.includes(folder.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  </button>
                  
                  {expandedFolders.includes(folder.id) && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {getFolderLists(folder.id).map(list => (
                        <li key={list.id}>
                          <NavLink 
                            to={`/list/${list.id}`}
                            className={({ isActive }) => 
                              cn("nav-link text-sm py-1.5 group", isActive && "nav-link-active")
                            }
                            onClick={handleNavLinkClick}
                          >
                            {/* Use Pin icon if list is pinned, otherwise use List icon */}
                            {list.isPinned ? (
                              <Pin size={16} className="fill-current" />
                            ) : (
                              <ListIcon size={16} />
                            )}
                            <span className="flex-1">{list.name}</span>
                            <span className="text-xs text-primary-500 mr-2">
                              {list.productCount}
                            </span>
                            {/* Pin/Unpin button - only visible on hover */}
                            <button
                              onClick={(e) => handleListPin(e, list.id)}
                              className={cn(
                                "opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200",
                                list.isPinned 
                                  ? "text-primary-700 hover:bg-primary-200" 
                                  : "text-primary-500 hover:bg-primary-200"
                              )}
                              title={list.isPinned ? "Unpin list" : "Pin list"}
                            >
                              <Pin size={12} className={list.isPinned ? "fill-current" : ""} />
                            </button>
                          </NavLink>
                        </li>
                      ))}
                      <li>
                        <button 
                          className="nav-link text-sm py-1.5 text-accent-600 hover:text-accent-700 w-full"
                          onClick={() => handleCreateList(folder.id)}
                        >
                          <Plus size={16} />
                          <span>New List</span>
                        </button>
                      </li>
                    </ul>
                  )}
                </li>
              ))}
              
              {/* Unorganized Lists */}
              {getUnorganizedLists().map(list => (
                <li key={list.id}>
                  <NavLink 
                    to={`/list/${list.id}`}
                    className={({ isActive }) => 
                      cn("nav-link group", isActive && "nav-link-active")
                    }
                    onClick={handleNavLinkClick}
                  >
                    {/* Use Pin icon if list is pinned, otherwise use List icon */}
                    {list.isPinned ? (
                      <Pin size={18} className="fill-current" />
                    ) : (
                      <ListIcon size={18} />
                    )}
                    <span className="flex-1">{list.name}</span>
                    <span className="text-xs text-primary-500 mr-2">
                      {list.productCount}
                    </span>
                    {/* Pin/Unpin button - only visible on hover */}
                    <button
                      onClick={(e) => handleListPin(e, list.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200",
                        list.isPinned 
                          ? "text-primary-700 hover:bg-primary-200" 
                          : "text-primary-500 hover:bg-primary-200"
                      )}
                      title={list.isPinned ? "Unpin list" : "Pin list"}
                    >
                      <Pin size={12} className={list.isPinned ? "fill-current" : ""} />
                    </button>
                  </NavLink>
                </li>
              ))}

              {/* Unassigned Products - Always at the bottom */}
              <li className="pt-2 border-t border-primary-200">
                <button
                  className={cn(
                    "nav-link w-full",
                    location.pathname === '/unassigned' && "nav-link-active"
                  )}
                  onClick={handleUnassignedClick}
                >
                  <Package size={18} />
                  <span className="flex-1 text-left">Unassigned</span>
                  <span className="text-xs text-primary-500">
                    {getUnassignedProductCount()}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
        
        <div className="border-t border-primary-200 p-4">
          <NavLink 
            to="/settings"
            className={({ isActive }) => 
              cn("nav-link", isActive && "nav-link-active")
            }
            onClick={handleNavLinkClick}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>

      {showCreateFolder && (
        <CreateFolderModal onClose={() => setShowCreateFolder(false)} />
      )}
      
      {showCreateList && (
        <CreateListModal 
          folderId={selectedFolderId || undefined}
          onClose={() => setShowCreateList(false)} 
        />
      )}
    </>
  );
};

export default Sidebar;