import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Share2, MoreVertical, Pin, Trash2, ExternalLink, MessageSquare, List } from 'lucide-react';
import { Product } from '../../types';
import { useProductStore } from '../../store/productStore';
import { truncateText } from '../../lib/utils';
import Button from '../ui/Button';
import ListSelectorModal from '../list/ListSelectorModal';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { togglePin, removeProduct } = useProductStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  
  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };
  
  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(product.id);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeProduct(product.id);
  };
  
  const handleOpenListSelector = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowListSelector(true);
  };
  
  const handleOpenExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <motion.div 
      className="card cursor-pointer overflow-hidden flex flex-col h-full"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      <div className="relative">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-primary-200 flex items-center justify-center">
            <span className="text-primary-500">No image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button 
            className={`p-1.5 rounded-full ${product.isPinned ? 'bg-primary-800 text-white' : 'bg-white text-primary-800'}`}
            onClick={handleTogglePin}
          >
            <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
          </button>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-primary-900 line-clamp-1">{product.title}</h3>
          <div className="relative">
            <button
              className="p-1 rounded-md hover:bg-primary-100 text-primary-500"
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
                  <span>Add to list</span>
                </button>
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-primary-50"
                  onClick={handleOpenExternalLink}
                >
                  <ExternalLink size={16} />
                  <span>Open original</span>
                </button>
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-primary-50"
                  onClick={handleRemove}
                >
                  <Trash2 size={16} />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {product.price && (
          <p className="text-primary-800 font-medium mt-1">{product.price}</p>
        )}
        
        <p className="text-primary-600 text-sm mt-2 line-clamp-2">
          {truncateText(product.description, 120)}
        </p>
        
        <div className="mt-3 flex flex-wrap gap-1">
          {product.tags.map((tag) => (
            <span 
              key={tag} 
              className="badge-primary"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between text-primary-500 text-sm">
          <div className="flex items-center gap-2">
            <button className="p-1 rounded-full hover:bg-primary-100">
              <MessageSquare size={16} />
            </button>
            <button className="p-1 rounded-full hover:bg-primary-100">
              <Share2 size={16} />
            </button>
          </div>
          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      {showListSelector && (
        <ListSelectorModal 
          productId={product.id}
          onClose={() => setShowListSelector(false)}
        />
      )}
    </motion.div>
  );
};

export default ProductCard;