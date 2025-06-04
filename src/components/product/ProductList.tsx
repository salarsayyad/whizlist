import { useProductStore } from '../../store/productStore';
import { useNavigate } from 'react-router-dom';
import { Share2, Pin, Trash2, ExternalLink, List, MessageSquare } from 'lucide-react';
import { formatDate, truncateText } from '../../lib/utils';
import { motion } from 'framer-motion';

const ProductList = () => {
  const { products, togglePin, deleteProduct } = useProductStore();
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
  
  return (
    <motion.div 
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {sortedProducts.map((product) => (
        <motion.div 
          key={product.id}
          className="card p-4 flex gap-4 hover:bg-primary-50 transition-colors duration-200"
          variants={item}
        >
          <div 
            className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            {product.image ? (
              <img 
                src={product.image} 
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
              <p className="text-primary-600 text-sm mt-1">
                {truncateText(product.description, 100)}
              </p>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="badge-primary text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col justify-between items-end">
            <div className="flex items-center gap-1">
              <button 
                className={`p-1.5 rounded-full ${product.isPinned ? 'bg-primary-800 text-white' : 'bg-primary-100 text-primary-800'}`}
                onClick={() => togglePin(product.id)}
              >
                <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
              </button>
              <button 
                className="p-1.5 rounded-full bg-primary-100 text-primary-800 hover:bg-primary-200"
                onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink size={16} />
              </button>
              <button 
                className="p-1.5 rounded-full bg-primary-100 text-primary-800 hover:bg-primary-200"
                onClick={() => deleteProduct(product.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 text-primary-500 text-xs mt-2">
              <div className="flex items-center gap-1">
                <MessageSquare size={14} />
                <span>0</span>
              </div>
              <span>{formatDate(product.createdAt)}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductList;