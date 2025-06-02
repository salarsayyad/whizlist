import { X, Grid, List as ListIcon, FolderOpen, Share2, Star, Trash2, Settings, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import { useFolderStore } from '../../store/folderStore';
import { useListStore } from '../../store/listStore';
import CreateFolderModal from '../folder/CreateFolderModal';
import CreateListModal from '../list/CreateListModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const { folders, fetchFolders } = useFolderStore();
  const { lists, fetchLists } = useListStore();
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchFolders();
    fetchLists();
  }, []);
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  
  const getFolderLists = (folderId: string) => {
    return lists.filter(list => list.folder_id === folderId);
  };
  
  const getUnorganizedLists = () => {
    return lists.filter(list => !list.folder_id);
  };
  
  const handleCreateFolder = () => {
    setShowCreateFolder(true);
  };
  
  const handleCreateList = (folderId?: string) => {
    setSelectedFolderId(folderId || null);
    setShowCreateList(true);
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
                to="/dashboard" 
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
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <FolderOpen size={18} />
                    <span className="flex-1">{folder.name}</span>
                    {expandedFolders.includes(folder.id) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  
                  {expandedFolders.includes(folder.id) && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {getFolderLists(folder.id).map(list => (
                        <li key={list.id}>
                          <NavLink 
                            to={`/list/${list.id}`}
                            className={({ isActive }) => 
                              cn("nav-link text-sm py-1.5", isActive && "nav-link-active")
                            }
                          >
                            <ListIcon size={16} />
                            <span>{list.name}</span>
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
                      cn("nav-link", isActive && "nav-link-active")
                    }
                  >
                    <ListIcon size={18} />
                    <span>{list.name}</span>
                  </NavLink>
                </li>
              ))}
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