import { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommentStore } from '../../store/commentStore';
import { useProductStore } from '../../store/productStore';
import CommentSection from './CommentSection';

interface GlobalCommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productTitle?: string;
}

const GlobalCommentsSidebar = ({ 
  isOpen, 
  onClose, 
  productId, 
  productTitle 
}: GlobalCommentsSidebarProps) => {
  const { comments } = useCommentStore();
  const { products } = useProductStore();
  const [commentsCount, setCommentsCount] = useState(0);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);

  // Find the product to get its image
  useEffect(() => {
    if (productId) {
      const product = products.find(p => p.id === productId);
      setProductImageUrl(product?.imageUrl || null);
    } else {
      setProductImageUrl(null);
    }
  }, [productId, products]);

  // Fetch main comments count (excluding replies) for the current product
  useEffect(() => {
    const fetchCommentsCount = async () => {
      if (!productId) return;
      
      try {
        const { supabase } = await import('../../lib/supabase');
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'product')
          .eq('entity_id', productId)
          .is('parent_id', null); // Only count main comments, not replies

        if (error) throw error;
        setCommentsCount(count || 0);
      } catch (error) {
        console.error('Error fetching comments count:', error);
        setCommentsCount(0);
      }
    };

    fetchCommentsCount();
  }, [productId]);

  // Update comments count when comments change (when sidebar is open)
  useEffect(() => {
    if (comments.length > 0) {
      const mainCommentsCount = comments.filter(comment => !comment.parentId).length;
      setCommentsCount(mainCommentsCount);
    }
  }, [comments]);

  if (!productId) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Desktop backdrop without blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary-900/10 z-40 hidden lg:block"
            onClick={onClose}
          />
          
          {/* Sidebar - positioned between header and any floating elements */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-16 right-0 w-full max-w-sm lg:max-w-md xl:max-w-lg bg-white border-l border-primary-200 shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{ bottom: '0px' }}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-200 bg-primary-50">
              <div className="flex items-center gap-3">
                {/* Product thumbnail */}
                {productImageUrl ? (
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-primary-200">
                    <img 
                      src={productImageUrl} 
                      alt={productTitle || 'Product'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-md bg-primary-200 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={16} className="text-primary-500" />
                  </div>
                )}
                
                <div className="flex flex-col">
                  <h2 className="text-lg font-medium text-primary-900">
                    Comments ({commentsCount})
                  </h2>
                  {productTitle && (
                    <p className="text-sm text-primary-600 truncate max-w-xs">
                      {productTitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-primary-500 hover:text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden p-4">
              <CommentSection 
                entityType="product"
                entityId={productId}
                hideTitle={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalCommentsSidebar;