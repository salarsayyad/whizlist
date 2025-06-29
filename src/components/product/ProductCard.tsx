import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Share2, MoreVertical, Pin, Trash2, ExternalLink, MessageSquare, List, RefreshCw } from 'lucide-react';
import { Product } from '../../types';
import { useProductStore } from '../../store/productStore';
import { truncateText } from '../../lib/utils';
import Button from '../ui/Button';
import ProductListSelector from './ProductListSelector';
import ConfirmationModal from '../ui/ConfirmationModal';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  showPin?: boolean; // New prop to control pin visibility
}

const ProductCard = ({ product, showPin = false }: ProductCardProps) => {
  const navigate = useNavigate();
  const { togglePin, deleteProduct, extractingProducts } = useProductStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isExtracting = extractingProducts.includes(product.id);
  
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
    navigate(`/product/${product.id}`);
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
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-medium text-primary-900 line-clamp-1 flex-1">{product.title}</h3>
          </div>
          
          {product.price && (
            <p className="text-primary-800 font-medium mb-2">{product.price}</p>
          )}
          
          <p className="text-primary-600 text-sm mb-3 line-clamp-2 flex-1">
            {truncateText(product.description, 120)}
          </p>
          
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
        </div>

        {/* Grey bottom section - URL on left, buttons on right */}
        <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
          <div className="flex items-center justify-between">
            {/* Clickable base URL with external link icon on the left */}
            <button 
              className="interactive-element flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors"
              onClick={handleUrlClick}
              title="Open original link"
            >
              <span>{new URL(product.productUrl).hostname}</span>
              <ExternalLink size={12} />
            </button>
            
            {/* Comment and share buttons on the right */}
            <div className="flex items-center gap-3">
              <button 
                className="interactive-element flex items-center gap-1 text-primary-500 hover:text-primary-700 transition-colors"
                onClick={handleCommentClick}
                title="View comments"
              >
                <MessageSquare size={14} />
                <span className="text-xs">0</span>
              </button>
              <button 
                className="interactive-element text-primary-500 hover:text-primary-700 transition-colors"
                onClick={handleShareClick}
                title="Share product"
              >
                <Share2 size={14} />
              </button>
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
      
      {showListSelector && (
        <ProductListSelector 
          productId={product.id}
          currentListId={product.listId}
          onClose={() => setShowListSelector(false)}
        />
      )}
    </>
  );
};

export default ProductCard;