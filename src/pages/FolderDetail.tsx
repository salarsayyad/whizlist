import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Share2, Users, Trash2, 
  Lock, Globe, MoreHorizontal, Plus, List as ListIcon, FolderOpen 
} from 'lucide-react';
import { useFolderStore } from '../store/folderStore';
import { useListStore } from '../store/listStore';
import Button from '../components/ui/Button';
import CreateListModal from '../components/list/CreateListModal';
import EditFolderModal from '../components/folder/EditFolderModal';
import CommentSection from '../components/comment/CommentSection';
import { motion } from 'framer-motion';
import { formatDate } from '../lib/utils';

const FolderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { folders, deleteFolder } = useFolderStore();
  const { lists, fetchLists } = useListStore();
  
  const folder = folders.find(f => f.id === id);
  const folderLists = lists.filter(list => list.folderId === id);
  
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);
  
  if (!folder) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-primary-700 mb-2">Folder not found</h2>
        <p className="text-primary-600 mb-6">The folder you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => navigate('/dashboard')}
          variant="secondary"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to delete this folder? All lists in this folder will become unorganized.')) {
      try {
        await deleteFolder(folder.id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const handleListClick = (listId: string) => {
    navigate(`/list/${listId}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="pb-24"> {/* Add bottom padding to prevent content from being hidden behind floating menu */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center">
                <FolderOpen size={28} className="text-primary-600 mr-3" />
                <h1 className="text-2xl font-medium text-primary-900">{folder.name}</h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="ml-2 text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              
              {/* Description moved under title */}
              {folder.description && (
                <p className="text-primary-600 text-sm mt-2 ml-10">{folder.description}</p>
              )}
              
              {/* Privacy indicator moved under description */}
              <div className="ml-10 mt-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-200 text-primary-800">
                    <FolderOpen size={10} />
                    <span>Folder</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                    {folder.is_public ? (
                      <>
                        <Globe size={12} />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={12} />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-primary-900">
                Lists ({folderLists.length})
              </h2>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <MoreHorizontal size={16} />
                  <span>More</span>
                </Button>
              </div>
            </div>
            
            {folderLists.length === 0 ? (
              <div className="text-center py-16 card p-8">
                <ListIcon size={64} className="mx-auto mb-4 text-primary-300" />
                <h3 className="text-xl font-medium text-primary-700 mb-2">No lists in this folder yet</h3>
                <p className="text-primary-600 mb-6">Create your first list to start organizing your products.</p>
                <Button 
                  onClick={() => setShowCreateListModal(true)}
                  className="mx-auto flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create First List
                </Button>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {folderLists.map((list) => (
                  <motion.div 
                    key={list.id}
                    className="card cursor-pointer overflow-hidden flex flex-col h-full hover:shadow-elevated transition-shadow duration-300"
                    variants={item}
                    whileHover={{ y: -4 }}
                    onClick={() => handleListClick(list.id)}
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ListIcon size={20} className="text-primary-600 flex-shrink-0" />
                          <h3 className="font-medium text-primary-900 line-clamp-1">{list.name}</h3>
                        </div>
                      </div>
                      
                      {list.description && (
                        <p className="text-primary-600 text-sm mb-3 line-clamp-2 flex-1">
                          {list.description}
                        </p>
                      )}
                      
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-sm text-primary-500">
                          <span>{list.productCount || 0} item{(list.productCount || 0) === 1 ? '' : 's'}</span>
                          <span>{formatDate(list.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 py-3 bg-primary-50 border-t border-primary-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                          {list.isPublic ? (
                            <>
                              <Globe size={10} />
                              <span>Public</span>
                            </>
                          ) : (
                            <>
                              <Lock size={10} />
                              <span>Private</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                          <span className="text-xs text-primary-500">Active</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6">
            <CommentSection 
              entityType="folder"
              entityId={folder.id}
              title={`Folder Comments (${0})`}
            />
          </div>
        </div>
      </div>

      {/* Fixed Floating Actions Menu - Positioned at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* Main content area container - positioned to match main content */}
        <div className="md:ml-64 p-4 md:p-6 pointer-events-auto">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="bg-white border border-primary-200 shadow-elevated"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="p-3">
                {/* Mobile: Scrollable horizontal layout with icons only */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:hidden">
                  <Button
                    variant="accent"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    onClick={() => setShowCreateListModal(true)}
                    title="New List"
                  >
                    <Plus size={20} />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    title="Share"
                  >
                    <Users size={20} />
                  </Button>
                  
                  {/* Spacer to push delete button to the right */}
                  <div className="flex-1"></div>
                  
                  <Button
                    variant="error"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-10 h-12 p-0"
                    onClick={handleRemove}
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>

                {/* Desktop: Grid layout with text */}
                <div className="hidden sm:flex gap-3">
                  <Button
                    variant="accent"
                    className="flex items-center justify-center gap-2"
                    onClick={() => setShowCreateListModal(true)}
                  >
                    <Plus size={16} />
                    <span>New List</span>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center gap-2"
                  >
                    <Users size={16} />
                    <span>Share</span>
                  </Button>
                  
                  {/* Spacer to push delete button to the right */}
                  <div className="flex-1"></div>
                  
                  <Button
                    variant="error"
                    className="flex items-center justify-center w-12 h-9"
                    onClick={handleRemove}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {showCreateListModal && (
        <CreateListModal 
          folderId={folder.id}
          onClose={() => setShowCreateListModal(false)} 
        />
      )}

      {showEditModal && (
        <EditFolderModal
          folder={folder}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default FolderDetail;