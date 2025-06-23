import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Share2, Users, Trash2, 
  Lock, Globe, Plus, List as ListIcon, FolderOpen, MessageSquare, X 
} from 'lucide-react';
import { useFolderStore } from '../store/folderStore';
import { useListStore } from '../store/listStore';
import { useCommentStore } from '../store/commentStore';
import Button from '../components/ui/Button';
import CreateListModal from '../components/list/CreateListModal';
import EditFolderModal from '../components/folder/EditFolderModal';
import CommentSection from '../components/comment/CommentSection';
import { motion, AnimatePresence } from 'framer-motion';

const FolderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { folders, deleteFolder } = useFolderStore();
  const { lists, fetchLists } = useListStore();
  const { comments } = useCommentStore();
  
  const folder = folders.find(f => f.id === id);
  const folderLists = lists.filter(list => list.folderId === id);
  
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);

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
    <div className="pb-24 relative"> {/* Add relative positioning for sidebar */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Folder and Privacy indicators moved above folder name */}
              <div className="mb-2">
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

              {/* Folder name without icon */}
              <div className="flex items-center">
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
                <p className="text-primary-600 text-sm mt-2">{folder.description}</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Main content area - adjust margin when sidebar is open */}
      <div className={`transition-all duration-300 ${showCommentsSidebar ? 'lg:mr-96' : ''}`}>
        <div>
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
                    {/* LIST indicator above list name */}
                    <div className="mb-2">
                      <span className="inline-block text-xs font-medium text-primary-500 uppercase tracking-wide">
                        LIST
                      </span>
                    </div>
                    
                    {/* List name without icon */}
                    <div className="mb-3">
                      <h3 className="font-medium text-primary-900 line-clamp-1">{list.name}</h3>
                    </div>
                    
                    {/* Description only - removed item count */}
                    {list.description && (
                      <p className="text-primary-600 text-sm mb-3 line-clamp-2 flex-1">
                        {list.description}
                      </p>
                    )}
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
                      <div className="text-xs text-primary-500 font-medium">
                        {list.productCount || 0} items
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Comments Sidebar */}
      <AnimatePresence>
        {showCommentsSidebar && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowCommentsSidebar(false)}
            />
            
            {/* Sidebar - positioned between header and floating menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 w-full max-w-sm lg:max-w-md xl:max-w-lg bg-white border-l border-primary-200 shadow-2xl z-50 overflow-hidden flex flex-col"
              style={{ bottom: '96px' }} // 96px accounts for floating menu height + padding
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-primary-200 bg-primary-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare size={18} className="text-primary-700" />
                    <h2 className="text-lg font-medium text-primary-900">Comments</h2>
                  </div>
                  <p className="text-sm text-primary-600">({comments.length})</p>
                </div>
                <button
                  onClick={() => setShowCommentsSidebar(false)}
                  className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <CommentSection 
                  entityType="folder"
                  entityId={folder.id}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Floating Actions Menu - Lower z-index than mobile sidebar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
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
                    variant={showCommentsSidebar ? 'primary' : 'secondary'}
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                    title="Comments"
                  >
                    <MessageSquare size={20} />
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
                    variant={showCommentsSidebar ? 'primary' : 'secondary'}
                    className="flex items-center justify-center gap-2"
                    onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                  >
                    <MessageSquare size={16} />
                    <span>Comments</span>
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