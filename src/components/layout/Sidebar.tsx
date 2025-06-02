import { X, Grid, List, FolderOpen, Share2, Star, Trash2, Settings, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { Menu } from '@headlessui/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:sticky top-0 w-64 bg-white border-r border-primary-200 z-30 transition-transform duration-300 ease-in-out h-screen md:h-[calc(100vh-4rem)]",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "flex flex-col"
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
        
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            <li>
              <NavLink 
                to="/" 
                end
                className={({ isActive }) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                <Grid size={18} />
                <span>All Products</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/starred" 
                className={({ isActive }) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                <Star size={18} />
                <span>Starred</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/shared" 
                className={({ isActive }) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                <Share2 size={18} />
                <span>Shared with me</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/trash" 
                className={({ isActive }) => 
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                <Trash2 size={18} />
                <span>Trash</span>
              </NavLink>
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
                      >
                        <List size={16} />
                        <span>New List</span>
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </div>
            
            <ul className="space-y-1">
              {/* Home Decor Folder */}
              <li>
                <button 
                  className="nav-link w-full"
                  onClick={() => toggleFolder('1')}
                >
                  <FolderOpen size={18} />
                  <span className="flex-1">Home Decor</span>
                  {expandedFolders.includes('1') ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                
                {expandedFolders.includes('1') && (
                  <ul className="ml-6 mt-1 space-y-1">
                    <li>
                      <NavLink 
                        to="/list/3" 
                        className={({ isActive }) => 
                          cn("nav-link text-sm py-1.5", isActive && "nav-link-active")
                        }
                      >
                        <List size={16} />
                        <span>Living Room</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/list/4" 
                        className={({ isActive }) => 
                          cn("nav-link text-sm py-1.5", isActive && "nav-link-active")
                        }
                      >
                        <List size={16} />
                        <span>Kitchen</span>
                      </NavLink>
                    </li>
                    <li>
                      <button className="nav-link text-sm py-1.5 text-accent-600 hover:text-accent-700 w-full">
                        <Plus size={16} />
                        <span>New List</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>
              
              {/* Tech Gadgets Folder */}
              <li>
                <button 
                  className="nav-link w-full"
                  onClick={() => toggleFolder('2')}
                >
                  <FolderOpen size={18} />
                  <span className="flex-1">Tech Gadgets</span>
                  {expandedFolders.includes('2') ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                
                {expandedFolders.includes('2') && (
                  <ul className="ml-6 mt-1 space-y-1">
                    <li>
                      <NavLink 
                        to="/list/5" 
                        className={({ isActive }) => 
                          cn("nav-link text-sm py-1.5", isActive && "nav-link-active")
                        }
                      >
                        <List size={16} />
                        <span>Wishlist</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/list/6" 
                        className={({ isActive }) => 
                          cn("nav-link text-sm py-1.5", isActive && "nav-link-active")
                        }
                      >
                        <List size={16} />
                        <span>Reviews</span>
                      </NavLink>
                    </li>
                    <li>
                      <button className="nav-link text-sm py-1.5 text-accent-600 hover:text-accent-700 w-full">
                        <Plus size={16} />
                        <span>New List</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>
              
              {/* Uncategorized Lists */}
              <li>
                <NavLink 
                  to="/list/1" 
                  className={({ isActive }) => 
                    cn("nav-link", isActive && "nav-link-active")
                  }
                >
                  <List size={18} />
                  <span>Shopping List</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/list/2" 
                  className={({ isActive }) => 
                    cn("nav-link", isActive && "nav-link-active")
                  }
                >
                  <List size={18} />
                  <span>Gift Ideas</span>
                </NavLink>
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
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;