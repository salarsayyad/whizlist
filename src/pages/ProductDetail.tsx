import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Pin, ExternalLink, Trash2, Edit2, 
  Plus, List as ListIcon 
} from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useListStore } from '../store/listStore';
import Button from '../components/ui/Button';
import { formatDate } from '../lib/utils';
import ListSelectorModal from '../components/list/ListSelectorModal';
import AddTagModal from '../components/product/AddTagModal';
import CommentSection from '../components/comment/CommentSection';
import { motion } from 'framer-motion';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, togglePin, deleteProduct } = useProductStore();
  const { lists } = useListStore();
  const product = products.find(p => p.id === id);
  
  const [showListSelector, setShowListSelector] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  
  // Get lists that contain this product
  const productLists = lists.filter(list => list.products.includes(id || ''));
  
  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-primary-700 mb-2">Product not found</h2>
        <p className="text-primary-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => navigate('/')}
          variant="secondary"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  const handleRemove = () => {
    deleteProduct(product.id);
    navigate('/');
  };

  const handleTagClick = (tag: string) => {
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };
  
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-600 hover:text-primary-800 mb-4"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back</span>
        </button>
        
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <motion.h1 
              className="text-2xl font-medium text-primary-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {product.title}
            </motion.h1>
            {product.price && (
              <p className="text-lg text-primary-800 mt-1">{product.price}</p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            <Button
              variant="secondary"
              className="flex items-center gap-1"
              onClick={() => setShowListSelector(true)}
            >
              <ListIcon size={16} />
              <span>Add to List</span>
            </Button>
            <Button
              variant={product.isPinned ? 'primary' : 'secondary'}
              className="flex items-center gap-1"
              onClick={() => togglePin(product.id)}
            >
              <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
              <span>{product.isPinned ? 'Pinned' : 'Pin'}</span>
            </Button>
            <Button
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Share2 size={16} />
              <span>Share</span>
            </Button>
            <Button
              variant="secondary"
              className="flex items-center gap-1"
              onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink size={16} />
              <span>Visit</span>
            </Button>
            <Button
              variant="error"
              className="flex items-center gap-1"
              onClick={handleRemove}
            >
              <Trash2 size={16} />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium text-primary-900">Details</h2>
              <button className="text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100">
                <Edit2 size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-primary-800">
                {product.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {product.tags.map((tag) => (
                  <button
                    key={tag} 
                    className="badge-primary hover:bg-primary-200 transition-colors"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
                <button 
                  className="badge bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center transition-colors"
                  onClick={() => setShowAddTagModal(true)}
                >
                  <Plus size={12} className="mr-1" />
                  Add Tag
                </button>
              </div>
              
              <div className="pt-2 border-t border-primary-100 flex justify-between text-sm text-primary-500">
                <span>Saved on {formatDate(product.createdAt)}</span>
                <a 
                  href={product.productUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent-600 hover:text-accent-700 hover:underline"
                >
                  {new URL(product.productUrl).hostname}
                </a>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <CommentSection productId={product.id} />
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="card overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-primary-200 flex items-center justify-center">
                <span className="text-primary-500">No image available</span>
              </div>
            )}
          </div>
          
          <div className="card p-4 mt-6">
            <h3 className="text-primary-900 font-medium mb-2">Lists</h3>
            {productLists.length > 0 ? (
              <div className="space-y-2">
                {productLists.map(list => (
                  <button
                    key={list.id}
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-primary-50 text-left"
                    onClick={() => navigate(`/list/${list.id}`)}
                  >
                    <ListIcon size={16} className="text-primary-500" />
                    <span className="text-primary-700">{list.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-primary-500 text-sm">Not added to any lists yet</p>
            )}
            <button 
              className="flex items-center gap-2 text-accent-600 hover:text-accent-700 w-full mt-2"
              onClick={() => setShowListSelector(true)}
            >
              <Plus size={16} />
              <span>Add to list</span>
            </button>
          </div>
        </div>
      </div>
      
      {showListSelector && (
        <ListSelectorModal 
          productId={product.id}
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