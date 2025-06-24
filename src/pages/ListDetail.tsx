import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Share2, Users, Trash2, 
  Lock, Globe, Grid, List as ListIcon, FolderOpen, Plus, MessageSquare, X, Folder 
} from 'lucide-react';
import { useListStore } from '../store/listStore';
import { useFolderStore } from '../store/folderStore';
import { useProductStore } from '../store/productStore';
import { useCommentStore } from '../store/commentStore';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import EditListModal from '../components/list/EditListModal';
import AddProductModal from '../components/product/AddProductModal';
import MoveListToFolderModal from '../components/list/MoveListToFolderModal';
import CommentSection from '../components/comment/CommentSection';
import { motion, AnimatePresence } from 'framer-motion';

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lists, deleteList, isLoading: listLoading } = useListStore();
  const { folders } = useFolderStore();
  const { fetchProductsByList, products, viewMode, setViewMode } = useProductStore();
  const { comments } = useCommentStore();
  
  const list = lists.find(l => l.id === id);
  
  // Find the folder this list belongs to
  const parentFolder = list?.folderId ? folders.find(f => f.id === list.folderId) : null;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
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
          .eq('entity_type', 'list')
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

  // Fetch products for this list
  useEffect(() => {
    if (id) {
      fetchProductsByList(id);
    }
  }, [id, fetchProductsByList]);
  
  if (!list) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-primary-700 mb-2">List not found</h2>
        <p className="text-primary-600 mb-6">The list you're looking for doesn't exist or has been removed.</p>
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
    if (window.confirm('Are you sure you want to delete this list? All products in this list will be moved to unassigned.')) {
      try {
        await deleteList(list.id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
  };

  const handleFolderClick = () => {
    if (parentFolder) {
      navigate(`/folder/${parentFolder.id}`);
    }
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
              {/* Folder Breadcrumb */}
              {parentFolder && (
                <div className="mb-2">
                  <button
                    onClick={handleFolderClick}
                    className="flex items-center text-primary-600 hover:text-primary-800 transition-colors group"
                  >
                    <FolderOpen size={16} className="mr-1 group-hover:text-primary-700" />
                    <span className="text-sm font-medium group-hover:underline">
                      {parentFolder.name}
                    </span>
                  </button>
                </div>
              )}

              {/* Desktop: List name with edit icon, indicators, and view toggle on the same line */}
              <div className="hidden md:flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-medium text-primary-900">{list.name}</h1>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100"
                    disabled={listLoading}
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  {/* List and Privacy indicators */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-200 text-primary-800">
                      <ListIcon size={10} />
                      <span>List</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                      {list.isPublic ? (
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

                {/* Grid/List toggle aligned to the right */}
                <div className="flex bg-primary-100 rounded-md p-1">
                  <button
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
              </div>

              {/* Mobile: List name with edit icon on first line */}
              <div className="md:hidden">
                <div className="flex items-center gap-2 mb-3">
                  <h1 className="text-2xl font-medium text-primary-900">{list.name}</h1>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100"
                    disabled={listLoading}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {/* Mobile: Indicators and view toggle on second line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-200 text-primary-800">
                      <ListIcon size={10} />
                      <span>List</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                      {list.isPublic ? (
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

                  {/* Grid/List toggle */}
                  <div className="flex bg-primary-100 rounded-md p-1">
                    <button
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
                      onClick={() => setViewMode('list')}
                      aria-label="List view"
                    >
                      <ListIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Description moved under title */}
              {list.description && (
                <p className="text-primary-600 text-sm mt-2">{list.description}</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Main content area - adjust margin when sidebar is open */}
      <div className={`transition-all duration-300 ${showCommentsSidebar ? 'lg:mr-96' : ''}`}>
        <div>
          {/* Removed the separate header with view toggle since it's now in the main header */}
          
          {products.length === 0 ? (
            <div className="text-center py-16 card p-8">
              <h3 className="text-xl font-medium text-primary-700 mb-2">No products in this list yet</h3>
              <p className="text-primary-600 mb-6">Add products to this list to start organizing.</p>
              <Button 
                onClick={() => setShowAddProductModal(true)}
                className="mx-auto flex items-center gap-2"
              >
                <Plus size={16} />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary-700" />
                  <h2 className="text-lg font-medium text-primary-900">
                    Comments ({commentsCount})
                  </h2>
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
                  entityType="list"
                  entityId={list.id}
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
                    variant="warning"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    onClick={() => setShowMoveToFolderModal(true)}
                    title="Move to Folder"
                  >
                    <Folder size={20} />
                  </Button>
                  
                  <Button
                    variant="accent"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    onClick={() => setShowAddProductModal(true)}
                    title="Add Product"
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
                    disabled={listLoading}
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>

                {/* Desktop: Grid layout with text and badge */}
                <div className="hidden sm:flex gap-3">
                  <Button
                    variant="warning"
                    className="flex items-center justify-center gap-2"
                    onClick={() => setShowMoveToFolderModal(true)}
                  >
                    <Folder size={16} />
                    <span>Move to Folder</span>
                  </Button>
                  
                  <Button
                    variant="accent"
                    className="flex items-center justify-center gap-2"
                    onClick={() => setShowAddProductModal(true)}
                  >
                    <Plus size={16} />
                    <span>Add Product</span>
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
                    disabled={listLoading}
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

      {showEditModal && (
        <EditListModal
          list={list}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showAddProductModal && (
        <AddProductModal onClose={() => setShowAddProductModal(false)} />
      )}

      {showMoveToFolderModal && (
        <MoveListToFolderModal
          listId={list.id}
          currentFolderId={list.folderId}
          onClose={() => setShowMoveToFolderModal(false)}
        />
      )}
    </div>
  );
};

export default ListDetail;