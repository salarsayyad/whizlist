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
          onClick={() => navigate('/dashboard')}
          variant="secondary"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  const handleRemove = () => {
    deleteProduct(product.id);
    navigate('/dashboard');
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
              Product Details
            </motion.h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
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

      {/* Product Header Section - Image, Title, Price, Tags, Description */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Product Image */}
          <div className="lg:w-1/3 flex-shrink-0">
            <div className="aspect-square rounded-lg overflow-hidden bg-primary-100">
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

          {/* Product Title, URL, Price, Tags, and Description */}
          <div className="lg:w-2/3 flex flex-col justify-start">
            {/* Product Title */}
            <h1 className="text-3xl font-bold text-primary-900 mb-2">{product.title}</h1>
            
            {/* Product URL */}
            <div className="mb-4">
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
            
            {/* Tags Section */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
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
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-primary-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List Actions Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-primary-900">Lists</h3>
          <Button
            variant="accent"
            className="flex items-center gap-1"
            onClick={() => setShowListSelector(true)}
          >
            <Plus size={16} />
            <span>Add to List</span>
          </Button>
        </div>
        
        {productLists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productLists.map(list => (
              <button
                key={list.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-primary-200 hover:border-primary-300 hover:bg-primary-50 text-left transition-colors"
                onClick={() => navigate(`/list/${list.id}`)}
              >
                <ListIcon size={18} className="text-primary-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-900 truncate">{list.name}</p>
                  <p className="text-sm text-primary-500">
                    {list.products.length} item{list.products.length === 1 ? '' : 's'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-primary-600">
            <ListIcon size={48} className="mx-auto mb-3 text-primary-300" />
            <p className="mb-4">This product isn't in any lists yet</p>
            <Button
              variant="secondary"
              onClick={() => setShowListSelector(true)}
              className="mx-auto"
            >
              Add to First List
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Details Section */}
          <div className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium text-primary-900">Details</h2>
              <button className="text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100">
                <Edit2 size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="pt-4 border-t border-primary-100 flex flex-col sm:flex-row justify-between text-sm text-primary-500 gap-2">
                <span>Saved on {formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="card p-6">
            <CommentSection 
              entityType="product"
              entityId={product.id}
            />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="card p-4">
            <h3 className="text-primary-900 font-medium mb-3">Product Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-primary-600">Source:</span>
                <a 
                  href={product.productUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-accent-600 hover:text-accent-700 hover:underline mt-1"
                >
                  {new URL(product.productUrl).hostname}
                </a>
              </div>
              
              {product.price && (
                <div>
                  <span className="text-primary-600">Price:</span>
                  <p className="text-primary-900 font-medium mt-1">{product.price}</p>
                </div>
              )}
              
              <div>
                <span className="text-primary-600">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.tags.length > 0 ? (
                    product.tags.map((tag) => (
                      <button
                        key={tag}
                        className="badge-primary text-xs hover:bg-primary-200 transition-colors"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <span className="text-primary-500 text-xs">No tags</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-primary-600">Added:</span>
                <p className="text-primary-900 mt-1">{formatDate(product.createdAt)}</p>
              </div>
            </div>
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