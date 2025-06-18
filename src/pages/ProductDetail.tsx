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
import ProductListSelector from '../components/product/ProductListSelector';
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
  
  // Get the list that contains this product
  const productList = lists.find(list => list.id === product?.listId);
  
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

      {/* Product Actions Shelf */}
      <div className="relative mb-8">
        {/* Shelf Shadow/Base */}
        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-b from-transparent to-primary-100 rounded-b-lg"></div>
        
        {/* Main Shelf */}
        <div className="bg-white border border-primary-200 rounded-lg shadow-card p-6 relative">
          {/* Shelf Edge Effect */}
          <div className="absolute inset-x-0 -bottom-1 h-1 bg-primary-200 rounded-b-lg"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="accent"
                className="flex items-center gap-1"
                onClick={() => setShowListSelector(true)}
              >
                <Plus size={16} />
                <span>Manage List</span>
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
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