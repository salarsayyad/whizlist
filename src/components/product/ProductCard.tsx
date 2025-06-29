import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Share2, MoreVertical, Pin, Trash2, ExternalLink, MessageSquare, List, RefreshCw, Plus, FolderOpen, ChevronRight, Package } from 'lucide-react';
import { Product } from '../../types';
import { useProductStore } from '../../store/productStore';
import { useGlobalCommentsStore } from '../../store/globalCommentsStore';
import { useCommentStore } from '../../store/commentStore';
import { useListStore } from '../../store/listStore';
import { useFolderStore } from '../../store/folderStore';
import { truncateText } from '../../lib/utils';
import Button from '../ui/Button';
import ProductListSelector from './ProductListSelector';
import ListSelectorModal from '../list/ListSelectorModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  showPin?: boolean; // New prop to control pin visibility
  showTags?: boolean; // New prop to control tags visibility
  showActions?: boolean; // New prop to control comment/share buttons visibility
  showAddToList?: boolean; // New prop to show "Add to List" button for products not in collection
  isInUserCollection?: boolean; // New prop to indicate if product is in user's collection
  showBreadcrumbs?: boolean; // New prop to control breadcrumbs visibility
}

const ProductCard = ({ 
  product, 
  showPin = false, 
  showTags = true, 
  showActions = true, 
  showAddToList = false,
  isInUserCollection = true,
  showBreadcrumbs = false
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { togglePin, deleteProduct, extractingProducts } = useProductStore();
  const { openComments, isOpen: isCommentsOpen, productId: activeProductId } = useGlobalCommentsStore();
  const { comments } = useCommentStore();
  const { lists } = useListStore();
  const { folders } = useFolderStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  
  const isExtracting = extractingProducts.includes(product.id);

  // Get the list that contains this product
  const productList = lists.find(list => list.id === product.listId);
  
  // Get the folder that contains the list (if applicable)
  const parentFolder = productList?.folderId ? folders.find(folder => folder.id === productList.folderId) : null;

  // Check if this is an unassigned product
  const isUnassignedProduct = !product.listId;

  // Fetch comment count for this product
  const fetchCommentCount = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'product')
        .eq('entity_id', product.id)
        .is('parent_id', null); // Only count main comments, not replies

      if (error) throw error;
      setCommentCount(count || 0);
    } catch (error) {
      console.error('Error fetching comment count:', error);
      setCommentCount(0);
    }
  };

  // Initial comment count fetch
  useEffect(() => {
    // Only fetch comment count if we're showing actions (comment button)
    if (showActions) {
      fetchCommentCount();
    }
  }, [product.id, showActions]);

  // Real-time comment count updates based on global comments store
  useEffect(() => {
    if (!showActions) return;

    // If this product is currently active in the sidebar, use the live comment count
    if (activeProductId === product.id && isCommentsOpen) {
      const mainCommentsCount = comments.filter(comment => !comment.parentId).length;
      setCommentCount(mainCommentsCount);
    } else {
      // For inactive products or when sidebar is closed, fetch from database
      // This ensures all cards stay in sync when comments are added/removed
      fetchCommentCount();
    }
  }, [comments, activeProductId, product.id, isCommentsOpen, showActions]);

  // Listen for comment store changes to update all product cards
  // This is crucial for keeping comment counts in sync across all cards
  useEffect(() => {
    if (!showActions) return;

    // Create a small delay to allow database operations to complete
    // before refetching comment counts for all cards
    const timeoutId = setTimeout(() => {
      // Only refetch if this product is not currently active in the sidebar
      // (active products get real-time updates from the comments array)
      if (activeProductId !== product.id) {
        fetchCommentCount();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [comments.length, showActions, activeProductId, product.id]);

  // Additional sync when sidebar closes to ensure all cards are updated
  useEffect(() => {
    if (!isCommentsOpen && showActions) {
      // When sidebar closes, refresh comment count for all cards
      // This catches any changes that might have been made
      const timeoutId = setTimeout(() => {
        fetchCommentCount();
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isCommentsOpen, showActions]);
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.interactive-element')) {
      return;
    }
    navigate(`/product/${product.id}`);
  };
  
  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(product.id);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirmation(true);
  };

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
  
  const handleOpenListSelector = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowListSelector(true);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddToListModal(true);
  };
  
  const handleOpenExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open global comments sidebar for this product
    openComments(product.id, product.title);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
    console.log('Share product:', product.title);
  };

  const handleUrlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (parentFolder) {
      navigate(`/folder/${parentFolder.id}`);
    }
  };

  const handleListClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productList) {
      navigate(`/list/${productList.id}`);
    }
  };

  const handleUnassignedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/unassigned');
  };
  
  return (
    <>
      <motion.div 
        className="card cursor-pointer overflow-hidden flex flex-col h-full"
        whileHover={{ y: -4 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleClick}
      >
        <div className="relative">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-primary-200 flex items-center justify-center">
              <span className="text-primary-500">No image</span>
            </div>
          )}
          {/* Only show pin button if showPin prop is true */}
          {showPin && (
            <div className="absolute top-2 left-2 flex gap-1">
              <button 
                className={`interactive-element p-1.5 rounded-full ${product.isPinned ? 'bg-primary-800 text-white' : 'bg-white text-primary-800'}`}
                onClick={handleTogglePin}
              >
                <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
              </button>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {isExtracting && (
              <div className="p-1.5 rounded-full bg-white text-primary-800">
                <RefreshCw size={16} className="animate-spin" />
              </div>
            )}
            {/* Only show options menu if product is in user's collection */}
            {isInUserCollection && (
              <div className="relative">
                <button
                  className="interactive-element p-1.5 rounded-full bg-white text-primary-800 hover:bg-primary-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(!showOptions);
                  }}
                >
                  <MoreVertical size={16} />
                </button>
                
                {showOptions && (
                  <div 
                    className="absolute right-0 top-full mt-1 bg-white shadow-elevated rounded-md py-1 z-10 w-40"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-primary-50"
                      onClick={handleOpenListSelector}
                    >
                      <List size={16} />
                      <span>Manage list</span>
                    </button>
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-primary-50"
                      onClick={handleOpenExternalLink}
                    >
                      <ExternalLink size={16} />
                      <span>Open original</span>
                    </button>
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-primary-50 text-error-600"
                      onClick={handleRemove}
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          {/* Breadcrumbs - only show if showBreadcrumbs is true */}
          {showBreadcrumbs && (
            <div className="mb-2 flex items-center text-xs text-primary-500">
              {parentFolder && (
                <>
                  <button 
                    className="interactive-element flex items-center hover:text-primary-700 transition-colors"
                    onClick={handleFolderClick}
                  >
                    <FolderOpen size={12} className="mr-1" />
                    <span className="truncate max-w-[80px]">{parentFolder.name}</span>
                  </button>
                  
                  {productList && (
                    <>
                      <ChevronRight size={12} className="mx-1" />
                      <button 
                        className="interactive-element flex items-center hover:text-primary-700 transition-colors"
                        onClick={handleListClick}
                      >
                        <List size={12} className="mr-1" />
                        <span className="truncate max-w-[80px]">{productList.name}</span>
                      </button>
                    </>
                  )}
                </>
              )}
              
              {!parentFolder && productList && (
                <button 
                  className="interactive-element flex items-center hover:text-primary-700 transition-colors"
                  onClick={handleListClick}
                >
                  <List size={12} className="mr-1" />
                  <span className="truncate max-w-[120px]">{productList.name}</span>
                </button>
              )}
              
              {/* Show "Unassigned" breadcrumb for unassigned products */}
              {isUnassignedProduct && (
                <button 
                  className="interactive-element flex items-center hover:text-primary-700 transition-colors"
                  onClick={handleUnassignedClick}
                >
                  <Package size={12} className="mr-1" />
                  <span className="truncate max-w-[120px]">Unassigned</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-medium text-primary-900 line-clamp-1 flex-1">{product.title}</h3>
          </div>
          
          {product.price && (
            <p className="text-primary-800 font-medium mb-2">{product.price}</p>
          )}
          
          <p className="text-primary-600 text-sm mb-3 line-clamp-2 flex-1">
            {truncateText(product.description, 120)}
          </p>
          
          {/* Only show tags if showTags prop is true */}
          {showTags && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.map((tag) => (
                <button
                  key={tag} 
                  className="interactive-element badge-primary hover:bg-primary-200 transition-colors"
                  onClick={(e) => handleTagClick(e, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grey bottom section - URL on left, buttons on right (conditionally) */}
        <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
          <div className="flex items-center justify-between">
            {/* Clickable URL - show only icon when comments sidebar is open, otherwise show hostname + icon */}
            <button 
              className="interactive-element flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors"
              onClick={handleUrlClick}
              title="Open original link"
            >
              {isCommentsOpen ? (
                // When comments sidebar is open, show only the external link icon
                <ExternalLink size={14} />
              ) : (
                // When comments sidebar is closed, show hostname + icon
                <>
                  <span>{new URL(product.productUrl).hostname}</span>
                  <ExternalLink size={12} />
                </>
              )}
            </button>
            
            {/* Right side buttons - conditional based on props */}
            <div className="flex items-center gap-3">
              {/* Show "Add to List" button if product is not in user's collection */}
              {showAddToList && !isInUserCollection && (
                <button 
                  className="interactive-element flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent-700 bg-accent-100 hover:bg-accent-200 rounded-md transition-colors"
                  onClick={handleAddToList}
                  title="Add to your lists"
                >
                  <Plus size={12} />
                  <span>Add to List</span>
                </button>
              )}

              {/* Comment and share buttons - only show if showActions is true */}
              {showActions && (
                <>
                  <button 
                    className={`interactive-element flex items-center gap-1 transition-colors ${
                      activeProductId === product.id 
                        ? 'text-primary-700 bg-primary-100 px-2 py-1 rounded-md' 
                        : 'text-primary-500 hover:text-primary-700'
                    }`}
                    onClick={handleCommentClick}
                    title="View comments"
                  >
                    <MessageSquare size={14} />
                    <span className="text-xs font-medium">{commentCount}</span>
                  </button>
                  <button 
                    className="interactive-element text-primary-500 hover:text-primary-700 transition-colors"
                    onClick={handleShareClick}
                    title="Share product"
                  >
                    <Share2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      
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
      
      {/* List Selector Modal for products in user's collection */}
      {showListSelector && (
        <ProductListSelector 
          productId={product.id}
          currentListId={product.listId}
          onClose={() => setShowListSelector(false)}
        />
      )}

      {/* Add to List Modal for products not in user's collection */}
      {showAddToListModal && (
        <ListSelectorModal 
          productId={product.id}
          onClose={() => setShowAddToListModal(false)}
        />
      )}
    </>
  );
};

export default ProductCard;