import { useProductStore } from '../../store/productStore';
import { useNavigate } from 'react-router-dom';
import { Share2, Trash2, ExternalLink, List, MessageSquare, FolderOpen, ChevronRight } from 'lucide-react';
import { formatDate, truncateText } from '../../lib/utils';
import { useListStore } from '../../store/listStore';
import { useFolderStore } from '../../store/folderStore';
import { useGlobalCommentsStore } from '../../store/globalCommentsStore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ProductListProps {
  showBreadcrumbs?: boolean; // New prop to control breadcrumbs visibility
}

const ProductList = ({ showBreadcrumbs = false }: ProductListProps) => {
  const { products, deleteProduct } = useProductStore();
  const { lists } = useListStore();
  const { folders } = useFolderStore();
  const { openComments } = useGlobalCommentsStore();
  const navigate = useNavigate();
  
  // Sort products with pinned first, then by date
  const sortedProducts = [...products].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleFolderClick = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    navigate(`/folder/${folderId}`);
  };

  const handleListClick = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    navigate(`/list/${listId}`);
  };

  const handleCommentClick = (e: React.MouseEvent, productId: string, productTitle: string) => {
    e.stopPropagation();
    openComments(productId, productTitle);
  };
  
  return (
    <motion.div 
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {sortedProducts.map((product) => {
        // Get the list that contains this product
        const productList = lists.find(list => list.id === product.listId);
        
        // Get the folder that contains the list (if applicable)
        const parentFolder = productList?.folderId ? folders.find(folder => folder.id === productList.folderId) : null;

        return (
          <motion.div 
            key={product.id}
            className="card p-4 flex gap-4 hover:bg-primary-50 transition-colors duration-200"
            variants={item}
          >
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
              {/* Breadcrumbs - only show if showBreadcrumbs is true and product has a list or folder */}
              {showBreadcrumbs && (productList || parentFolder) && (
                <div className="mb-1 flex items-center text-xs text-primary-500">
                  {parentFolder && (
                    <>
                      <button 
                        className="flex items-center hover:text-primary-700 transition-colors"
                        onClick={(e) => handleFolderClick(e, parentFolder.id)}
                      >
                        <FolderOpen size={12} className="mr-1" />
                        <span className="truncate max-w-[80px]">{parentFolder.name}</span>
                      </button>
                      
                      {productList && (
                        <>
                          <ChevronRight size={12} className="mx-1" />
                          <button 
                            className="flex items-center hover:text-primary-700 transition-colors"
                            onClick={(e) => handleListClick(e, productList.id)}
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
                      className="flex items-center hover:text-primary-700 transition-colors"
                      onClick={(e) => handleListClick(e, productList.id)}
                    >
                      <List size={12} className="mr-1" />
                      <span className="truncate max-w-[120px]">{productList.name}</span>
                    </button>
                  )}
                </div>
              )}

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
                  <span 
                    key={tag} 
                    className="badge-primary text-xs cursor-pointer hover:bg-primary-200 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tag/${encodeURIComponent(tag)}`);
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col justify-between items-end">
              <div className="flex items-center gap-1">
                <button 
                  className="p-1.5 rounded-full bg-primary-100 text-primary-800 hover:bg-primary-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommentClick(e, product.id, product.title);
                  }}
                  title="View comments"
                >
                  <MessageSquare size={16} />
                </button>
                <button 
                  className="p-1.5 rounded-full bg-primary-100 text-primary-800 hover:bg-primary-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
                  }}
                  title="Open original link"
                >
                  <ExternalLink size={16} />
                </button>
                <button 
                  className="p-1.5 rounded-full bg-primary-100 text-error-600 hover:bg-error-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirmDelete = window.confirm(`Are you sure you want to delete "${product.title}"?`);
                    if (confirmDelete) {
                      deleteProduct(product.id);
                    }
                  }}
                  title="Delete product"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-3 text-primary-500 text-xs mt-2">
                <span>{formatDate(product.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default ProductList;