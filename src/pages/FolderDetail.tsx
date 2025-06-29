import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Share2, Users, Trash2, 
  Lock, Globe, Plus, List as ListIcon, FolderOpen, MessageSquare, X, Pin 
} from 'lucide-react';
import { useFolderStore } from '../store/folderStore';
import { useListStore } from '../store/listStore';
import { useCommentStore } from '../store/commentStore';
import Button from '../components/ui/Button';
import CreateListModal from '../components/list/CreateListModal';
import EditFolderModal from '../components/folder/EditFolderModal';
import CommentSection from '../components/comment/CommentSection';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import SkeletonFolderCard from '../components/ui/SkeletonFolderCard';
import { motion, AnimatePresence } from 'framer-motion';

const FolderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { folders, deleteFolder } = useFolderStore();
  const { lists, fetchLists, togglePin, isLoading: listsLoading } = useListStore();
  const { comments } = useCommentStore();
  
  const folder = folders.find(f => f.id === id);
  const folderLists = lists.filter(list => list.folderId === id);
  
  // Sort lists with pinned first, then by creation date
  const sortedFolderLists = [...folderLists].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // Fetch main comments count (excluding replies) independently for the floating menu
  useEffect(() => {
    const fetchCommentsCount = async () => {
      if (!id) return;
      
      try {
        const { supabase } = await import('../lib/supabase');
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'folder')
          .eq('entity_id', id)
          .is('parent_id', null); // Only count main comments, not replies

        if (error) throw error;
        setCommentsCount(count || 0);
      } catch (error) {
        console.error('Error fetching comments count:', error);
        setCommentsCount(0);
      }
    };

    fetchCommentsCount();
  }, [id]);

  // Update comments count when comments change (when sidebar is open)
  // Count only main comments, not replies
  useEffect(() => {
    if (comments.length > 0) {
      const mainCommentsCount = comments.filter(comment => !comment.parentId).length;
      setCommentsCount(mainCommentsCount);
    }
  }, [comments]);

  useEffect(() => {
    fetchLists();
  }, []);

  // Generate skeleton count based on expected lists or default
  const getSkeletonCount = () => {
    // If we know how many lists to expect, show that many skeletons
    // Otherwise, show a reasonable default
    return 4; // Default to 4 skeleton cards for folders
  };
  
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
  
  const handleRemove = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFolder(folder.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleListClick = (listId: string) => {
    navigate(`/list/${listId}`);
  };

  const handleToggleListPin = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation(); // Prevent navigation to list detail
    try {
      await togglePin(listId);
    } catch (error) {
      console.error('Error toggling list pin:', error);
    }
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
      <div className="mb-4">
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
      
      {/* Divider line between header and content */}
      <div className="h-px bg-primary-200 mb-6 mt-4"></div>
      
      {/* Main content area - adjust margin when sidebar is open */}
      <div className={`transition-all duration-300 ${showCommentsSidebar ? 'lg:mr-96' : ''}`}>
        <div>
          {/* Show skeleton loading state while lists are being fetched */}
          {listsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: getSkeletonCount() }).map((_, index) => (
                <SkeletonFolderCard key={index} index={index} />
              ))}
            </div>
          ) : sortedFolderLists.length === 0 ? (
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
              {sortedFolderLists.map((list) => (
                <motion.div 
                  key={list.id}
                  className="card cursor-pointer overflow-hidden flex flex-col h-full hover:shadow-elevated transition-shadow duration-300 relative"
                  variants={item}
                  whileHover={{ y: -4 }}
                  onClick={() => handleListClick(list.id)}
                >
                  {/* Pin button in top-left corner */}
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      className={`p-1.5 rounded-full transition-colors ${
                        list.isPinned 
                          ? 'bg-primary-800 text-white' 
                          : 'bg-white text-primary-800 hover:bg-primary-100'
                      }`}
                      onClick={(e) => handleToggleListPin(e, list.id)}
                      title={list.isPinned ? 'Unpin list' : 'Pin list'}
                    >
                      <Pin size={14} className={list.isPinned ? 'fill-white' : ''} />
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col pt-12"> {/* Add top padding to account for pin button */}
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
                        {list.productCount} items
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
            {/* Mobile backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowCommentsSidebar(false)}
            />
            
            {/* Desktop backdrop without blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-900/10 z-40 hidden lg:block"
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
                <div className="flex items-center gap-3">
                  {/* Folder thumbnail/icon */}
                  <div className="w-10 h-10 rounded-md bg-primary-200 flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={18} className="text-primary-600" />
                  </div>
                  
                  <div className="flex flex-col">
                    <h2 className="text-lg font-medium text-primary-900">
                      Comments ({commentsCount})
                    </h2>
                    <p className="text-sm text-primary-600 truncate max-w-xs">
                      {folder.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCommentsSidebar(false)}
                  className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden p-4">
                <CommentSection 
                  entityType="folder"
                  entityId={folder.id}
                  hideTitle={true}
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
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0 relative"
                    onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                    title="Comments"
                  >
                    <MessageSquare size={20} />
                    {commentsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                        {commentsCount}
                      </span>
                    )}
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

                {/* Desktop: Grid layout with text and badge */}
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
                    className="flex items-center justify-center gap-2 relative"
                    onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                  >
                    <MessageSquare size={16} />
                    <span>Comments</span>
                    {commentsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                        {commentsCount}
                      </span>
                    )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Folder"
        message={
          <div>
            <p className="mb-3">
              Are you sure you want to delete the folder <strong>"{folder.name}"</strong>?
            </p>
            <p className="text-sm text-primary-500">
              All lists in this folder will become unorganized. This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete Folder"
        isLoading={isDeleting}
        variant="danger"
      />

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