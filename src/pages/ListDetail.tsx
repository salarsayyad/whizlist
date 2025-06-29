import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Share2, Users, Trash2, 
  Lock, Globe, Grid, List as ListIcon, FolderOpen, Plus, MessageSquare, X, Folder, Pin, ExternalLink 
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
import ConfirmationModal from '../components/ui/ConfirmationModal';
import SkeletonProductCard from '../components/ui/SkeletonProductCard';
import SkeletonListItem from '../components/ui/SkeletonListItem';
import { motion, AnimatePresence } from 'framer-motion';

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lists, deleteList, isLoading: listLoading } = useListStore();
  const { folders } = useFolderStore();
  const { fetchProductsByList, products, viewMode, setViewMode, isLoading: productsLoading } = useProductStore();
  const { comments } = useCommentStore();
  
  const list = lists.find(l => l.id === id);
  
  // Find the folder this list belongs to
  const parentFolder = list?.folderId ? folders.find(f => f.id === list.folderId) : null;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listCommentsCount, setListCommentsCount] = useState(0); // Separate state for list comments

  // Fetch list comments count independently from product comments
  const fetchListCommentsCount = async () => {
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
      setListCommentsCount(count || 0);
    } catch (error) {
      console.error('Error fetching list comments count:', error);
      setListCommentsCount(0);
    }
  };

  // Initial list comments count fetch
  useEffect(() => {
    fetchListCommentsCount();
  }, [id]);

  // Update list comments count when comments change AND sidebar is open for THIS list
  useEffect(() => {
    if (showCommentsSidebar && comments.length > 0) {
      // Only update if the comments are for this list (check by ensuring we're in list comment mode)
      // We can determine this by checking if the comment section is showing list comments
      const mainCommentsCount = comments.filter(comment => !comment.parentId).length;
      setListCommentsCount(mainCommentsCount);
    }
  }, [comments, showCommentsSidebar]);

  // Refresh list comments count when sidebar closes
  useEffect(() => {
    if (!showCommentsSidebar) {
      // When list comments sidebar closes, refresh the count from database
      const timeoutId = setTimeout(() => {
        fetchListCommentsCount();
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [showCommentsSidebar]);

  // Fetch products for this list
  useEffect(() => {
    if (id) {
      fetchProductsByList(id);
    }
  }, [id, fetchProductsByList]);

  // Sort products with pinned first, then by creation date
  const sortedProducts = [...products].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Generate skeleton count based on list's expected product count or default
  const getSkeletonCount = () => {
    if (list?.productCount && list.productCount > 0) {
      return Math.min(list.productCount, 12); // Cap at 12 for performance
    }
    // Default skeleton count if we don't know the expected count
    return viewMode === 'grid' ? 8 : 6;
  };
  
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
  
  const handleRemove = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteList(list.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting list:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleFolderClick = () => {
    if (parentFolder) {
      navigate(`/folder/${parentFolder.id}`);
    }
  };

  // Product List Item component for list view
  const ProductListItem = ({ product }: { product: any }) => {
    const { togglePin, deleteProduct } = useProductStore();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
      setIsDeleting(true);
      try {
        await deleteProduct(product.id);
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setIsDeleting(false);
        setShowDeleteConfirmation(false);
      }
    };

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
      e.stopPropagation();
      navigate(`/tag/${encodeURIComponent(tag)}`);
    };
    
    return (
      <>
        <div className="card p-4 flex gap-4 hover:bg-primary-50 transition-colors duration-200">
          <div 
            className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-200 flex items-center justify-center">
                <span className="text-primary-500 text-xs">No image</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div 
              className="cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <h3 className="font-medium text-primary-900">{product.title}</h3>
              {product.price && (
                <p className="text-primary-800 text-sm">{product.price}</p>
              )}
              <p className="text-primary-600 text-sm mt-1 line-clamp-2">
                {product.description}
              </p>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-1">
              {product.tags?.map((tag: string) => (
                <button
                  key={tag} 
                  className="badge-primary text-xs cursor-pointer hover:bg-primary-200 transition-colors"
                  onClick={(e) => handleTagClick(e, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col justify-between items-end">
            <div className="flex items-center gap-1">
              <button 
                className={`p-1.5 rounded-full ${product.isPinned ? 'bg-primary-800 text-white' : 'bg-primary-100 text-primary-800'} hover:bg-primary-200`}
                onClick={() => togglePin(product.id)}
                title={product.isPinned ? 'Unpin product' : 'Pin product'}
              >
                <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
              </button>
              <button 
                className="p-1.5 rounded-full bg-primary-100 text-primary-800 hover:bg-primary-200"
                onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
                title="Open original link"
              >
                <ExternalLink size={16} />
              </button>
              <button 
                className="p-1.5 rounded-full bg-primary-100 text-error-600 hover:bg-error-50"
                onClick={() => setShowDeleteConfirmation(true)}
                title="Delete product"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 text-primary-500 text-xs mt-2">
              <span>{new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Product"
          message={
            <div>
              <p className="mb-3">
                Are you sure you want to delete <strong>"{product.title}"</strong>?
              </p>
              <p className="text-sm text-primary-500">
                This action cannot be undone.
              </p>
            </div>
          }
          confirmText="Delete Product"
          isLoading={isDeleting}
          variant="danger"
        />
      </>
    );
  };
  
  return (
    <div className="pb-24 relative"> {/* Add relative positioning for sidebar */}
      <div className="mb-4">
        {/* Folder Breadcrumb and List Name in a more compact layout */}
        <div className="flex flex-col space-y-1">
          {/* Folder Breadcrumb */}
          {parentFolder && (
            <button
              onClick={handleFolderClick}
              className="flex items-center text-primary-600 hover:text-primary-800 transition-colors group"
            >
              <FolderOpen size={16} className="mr-1 group-hover:text-primary-700" />
              <span className="text-sm font-medium group-hover:underline">
                {parentFolder.name}
              </span>
            </button>
          )}

          {/* List Name and Edit Button */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-primary-900">{list.name}</h1>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100"
              disabled={listLoading}
            >
              <Edit2 size={16} />
            </button>
          </div>
        </div>

        {/* List Description */}
        {list.description && (
          <p className="text-primary-600 text-sm mt-2">{list.description}</p>
        )}

        {/* List Metadata and View Toggle */}
        <div className="flex flex-wrap items-center justify-between mt-3">
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
          <div className="flex bg-primary-100 rounded-md p-1 mt-2 sm:mt-0">
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
      
      {/* Main content area - adjust margin when sidebar is open */}
      <div className={`transition-all duration-300 ${showCommentsSidebar ? 'lg:mr-96' : ''}`}>
        <div>
          {/* Show skeleton loading state while products are being fetched */}
          {productsLoading ? (
            <div className="pb-8">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: getSkeletonCount() }).map((_, index) => (
                    <SkeletonProductCard key={index} index={index} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: getSkeletonCount() }).map((_, index) => (
                    <SkeletonListItem key={index} index={index} />
                  ))}
                </div>
              )}
            </div>
          ) : sortedProducts.length === 0 ? (
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
            <div className="pb-8">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      showPin={true} // Show pin button since we're in a list detail page
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedProducts.map((product) => (
                    <ProductListItem 
                      key={product.id} 
                      product={product} 
                    />
                  ))}
                </div>
              )}
            </div>
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
                  {/* List thumbnail/icon */}
                  <div className="w-10 h-10 rounded-md bg-primary-100 flex items-center justify-center flex-shrink-0 border border-primary-200">
                    <ListIcon size={18} className="text-primary-600" />
                  </div>
                  
                  <div className="flex flex-col">
                    <h2 className="text-lg font-medium text-primary-900">
                      Comments ({listCommentsCount})
                    </h2>
                    <p className="text-sm text-primary-600 truncate max-w-xs">
                      {list.name}
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
                    {listCommentsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                        {listCommentsCount}
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
                    {listCommentsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                        {listCommentsCount}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleConfirmDelete}
        title="Delete List"
        message={
          <div>
            <p className="mb-3">
              Are you sure you want to delete the list <strong>"{list.name}"</strong>?
            </p>
            <p className="text-sm text-primary-500">
              All products in this list will be moved to unassigned. This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete List"
        isLoading={isDeleting}
        variant="danger"
      />

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