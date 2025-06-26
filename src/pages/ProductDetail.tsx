import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Share2, ExternalLink, Trash2, Edit2, 
  Plus, List as ListIcon, X, ChevronRight, FolderOpen, MessageSquare, Package
} from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useListStore } from '../store/listStore';
import { useFolderStore } from '../store/folderStore';
import { useCommentStore } from '../store/commentStore';
import Button from '../components/ui/Button';
import { formatDate } from '../lib/utils';
import ProductListSelector from '../components/product/ProductListSelector';
import AddTagModal from '../components/product/AddTagModal';
import CommentSection from '../components/comment/CommentSection';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, deleteProduct, updateProduct } = useProductStore();
  const { lists } = useListStore();
  const { folders } = useFolderStore();
  const { comments } = useCommentStore();
  const product = products.find(p => p.id === id);
  
  const [showListSelector, setShowListSelector] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  
  // Get the list that contains this product
  const productList = lists.find(list => list.id === product?.listId);
  
  // Get the folder that contains the list (if applicable)
  const parentFolder = productList?.folderId ? folders.find(folder => folder.id === productList.folderId) : null;

  // Check if this is an unassigned product
  const isUnassignedProduct = product && !product.listId;

  // Fetch main comments count (excluding replies) independently for the floating menu
  useEffect(() => {
    const fetchCommentsCount = async () => {
      if (!id) return;
      
      try {
        const { supabase } = await import('../lib/supabase');
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'product')
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

  // Fetch folders if not already loaded
  useEffect(() => {
    if (productList?.folderId && folders.length === 0) {
      // Import and call fetchFolders if needed
      import('../store/folderStore').then(({ useFolderStore }) => {
        useFolderStore.getState().fetchFolders();
      });
    }
  }, [productList?.folderId, folders.length]);
  
  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-primary-700 mb-2">Product not found</h2>
        <p className="text-primary-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
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
      await deleteProduct(product.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleTagClick = (tag: string) => {
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const updatedTags = product.tags.filter(tag => tag !== tagToRemove);
      await updateProduct(product.id, { tags: updatedTags });
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleFolderClick = () => {
    if (parentFolder) {
      navigate(`/folder/${parentFolder.id}`);
    }
  };

  const handleListClick = () => {
    if (productList) {
      navigate(`/list/${productList.id}`);
    }
  };

  const handleUnassignedClick = () => {
    navigate('/unassigned');
  };
  
  return (
    <div className="pb-24 relative"> {/* Add relative positioning for sidebar */}
      {/* Breadcrumb Navigation - Show for folder/list products OR unassigned products */}
      {(parentFolder || productList || isUnassignedProduct) && (
        <div className="mb-6">
          <nav className="flex items-center text-sm text-primary-600 mb-4">
            {/* Folder breadcrumb */}
            {parentFolder && (
              <>
                <button
                  onClick={handleFolderClick}
                  className="flex items-center gap-1 hover:text-primary-800 transition-colors group"
                >
                  <FolderOpen size={14} className="group-hover:text-primary-700" />
                  <span className="group-hover:underline">{parentFolder.name}</span>
                </button>
                
                {productList && (
                  <ChevronRight size={14} className="mx-2 text-primary-400" />
                )}
              </>
            )}
            
            {/* List breadcrumb */}
            {productList && (
              <button
                onClick={handleListClick}
                className="flex items-center gap-1 hover:text-primary-800 transition-colors group"
              >
                <ListIcon size={14} className="group-hover:text-primary-700" />
                <span className="group-hover:underline">{productList.name}</span>
              </button>
            )}

            {/* Unassigned breadcrumb */}
            {isUnassignedProduct && (
              <button
                onClick={handleUnassignedClick}
                className="flex items-center gap-1 hover:text-primary-800 transition-colors group"
              >
                <Package size={14} className="group-hover:text-primary-700" />
                <span className="group-hover:underline">Unassigned</span>
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Main content area - adjust margin when sidebar is open */}
      <div className={`transition-all duration-300 ${showCommentsSidebar ? 'lg:mr-96' : ''}`}>
        {/* Product Header Section - Image on Right, Content on Left */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side - Product Info */}
            <div className="lg:w-2/3 flex flex-col">
              {/* Product Title */}
              <h1 className="text-3xl font-bold text-primary-900 mb-3">{product.title}</h1>
              
              {/* Product URL */}
              <div className="mb-3">
                <a 
                  href={product.productUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent-600 hover:text-accent-700 hover:underline text-sm"
                >
                  {new URL(product.productUrl).hostname}
                </a>
              </div>
              
              {/* Product Price */}
              {product.price && (
                <p className="text-2xl font-semibold text-primary-800 mb-4">{product.price}</p>
              )}
              
              {/* Tags Section with Hover Delete */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <div
                      key={tag}
                      className="group relative inline-flex items-center"
                    >
                      <button
                        className="badge-primary hover:bg-primary-200 transition-all duration-200 pr-2 group-hover:pr-6"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </button>
                      <button
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded-full hover:bg-primary-300 text-primary-600 hover:text-primary-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag);
                        }}
                        title={`Remove ${tag} tag`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button 
                    className="badge bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center transition-colors"
                    onClick={() => setShowAddTagModal(true)}
                  >
                    <Plus size={12} className="mr-1" />
                    Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Product Image */}
            <div className="lg:w-1/3 flex-shrink-0">
              <div className="aspect-square rounded-lg overflow-hidden bg-primary-100 sticky top-6">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-500">
                    <span>No image available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description - Full Width Below */}
          {product.description && (
            <div className="mt-6 pt-6 border-t border-primary-200">
              <h3 className="text-lg font-medium text-primary-900 mb-3">Description</h3>
              <p className="text-primary-700 leading-relaxed">
                {product.description}
              </p>
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
                  entityType="product"
                  entityId={product.id}
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
                    onClick={() => setShowListSelector(true)}
                    title="Move to List"
                  >
                    <ListIcon size={20} />
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
                    <Share2 size={20} />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
                    title="Visit Original"
                  >
                    <ExternalLink size={20} />
                  </Button>
                  
                  {/* Spacer to push delete button to the right */}
                  <div className="flex-1"></div>
                  
                  <Button
                    variant="error"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-10 h-12 p-0"
                    onClick={handleRemove}
                    title="Remove"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>

                {/* Desktop: Grid layout with text and badge */}
                <div className="hidden sm:flex gap-3">
                  <Button
                    variant="warning"
                    className="flex items-center justify-center gap-2"
                    onClick={() => setShowListSelector(true)}
                  >
                    <ListIcon size={16} />
                    <span>Move to List</span>
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
                    <Share2 size={16} />
                    <span>Share</span>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center gap-2"
                    onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink size={16} />
                    <span>Visit</span>
                  </Button>
                  
                  {/* Spacer to push delete button to the right */}
                  <div className="flex-1"></div>
                  
                  <Button
                    variant="error"
                    className="flex items-center justify-center w-12 h-9"
                    onClick={handleRemove}
                    title="Remove"
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
      
      {showListSelector && (
        <ProductListSelector 
          productId={product.id}
          currentListId={product.listId}
          onClose={() => setShowListSelector(false)}
        />
      )}
      
      {showAddTagModal && (
        <AddTagModal
          productId={product.id}
          currentTags={product.tags}
          onClose={() => setShowAddTagModal(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;