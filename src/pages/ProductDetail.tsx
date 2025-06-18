import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Pin, ExternalLink, Trash2, Edit2, 
  Plus, List as ListIcon, X, ChevronRight, FolderOpen
} from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useListStore } from '../store/listStore';
import { useFolderStore } from '../store/folderStore';
import Button from '../components/ui/Button';
import { formatDate } from '../lib/utils';
import ProductListSelector from '../components/product/ProductListSelector';
import AddTagModal from '../components/product/AddTagModal';
import CommentSection from '../components/comment/CommentSection';
import { motion } from 'framer-motion';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, togglePin, deleteProduct, updateProduct } = useProductStore();
  const { lists } = useListStore();
  const { folders } = useFolderStore();
  const product = products.find(p => p.id === id);
  
  const [showListSelector, setShowListSelector] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  
  // Get the list that contains this product
  const productList = lists.find(list => list.id === product?.listId);
  
  // Get the folder that contains the list (if applicable)
  const parentFolder = productList?.folderId ? folders.find(folder => folder.id === productList.folderId) : null;

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
    deleteProduct(product.id);
    navigate('/dashboard');
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
  
  return (
    <div className="pb-24"> {/* Add bottom padding to prevent content from being hidden behind floating menu */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-600 hover:text-primary-800 mb-4"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      {/* Product Header Section - Image on Right, Content on Left */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Product Info */}
          <div className="lg:w-2/3 flex flex-col">
            {/* Breadcrumb Navigation */}
            {(parentFolder || productList) && (
              <div className="mb-3">
                <nav className="flex items-center text-sm text-primary-600">
                  {parentFolder && (
                    <>
                      <button
                        onClick={handleFolderClick}
                        className="flex items-center gap-1 hover:text-primary-800 transition-colors group"
                      >
                        <FolderOpen size={14} className="group-hover:text-primary-700" />
                        <span className="group-hover:underline">{parentFolder.name}</span>
                      </button>
                      <ChevronRight size={14} className="mx-1 text-primary-400" />
                    </>
                  )}
                  
                  {productList && (
                    <button
                      onClick={handleListClick}
                      className="flex items-center gap-1 hover:text-primary-800 transition-colors group"
                    >
                      <ListIcon size={14} className="group-hover:text-primary-700" />
                      <span className="group-hover:underline">{productList.name}</span>
                    </button>
                  )}
                </nav>
              </div>
            )}

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

      {/* Fixed Floating Actions Menu - Positioned at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Layout container that matches the page structure */}
        <div className="flex">
          {/* Sidebar spacer - matches the sidebar width */}
          <div className="hidden md:block w-64 flex-shrink-0"></div>
          
          {/* Main content area container */}
          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="bg-white border border-primary-200 shadow-elevated"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="p-3">
                  {/* Mobile: Scrollable horizontal layout */}
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:hidden">
                    <Button
                      variant="accent"
                      className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                      onClick={() => setShowListSelector(true)}
                    >
                      <Plus size={16} />
                      <span>List</span>
                    </Button>
                    
                    <Button
                      variant={product.isPinned ? 'primary' : 'secondary'}
                      className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                      onClick={() => togglePin(product.id)}
                    >
                      <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
                      <span>Pin</span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                    >
                      <Share2 size={16} />
                      <span>Share</span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                      onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink size={16} />
                      <span>Visit</span>
                    </Button>
                    
                    <Button
                      variant="error"
                      className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                      onClick={handleRemove}
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </Button>
                  </div>

                  {/* Desktop: Grid layout */}
                  <div className="hidden sm:grid grid-cols-5 gap-3">
                    <Button
                      variant="accent"
                      className="flex items-center justify-center gap-2 w-full"
                      onClick={() => setShowListSelector(true)}
                    >
                      <Plus size={16} />
                      <span>Manage List</span>
                    </Button>
                    
                    <Button
                      variant={product.isPinned ? 'primary' : 'secondary'}
                      className="flex items-center justify-center gap-2 w-full"
                      onClick={() => togglePin(product.id)}
                    >
                      <Pin size={16} className={product.isPinned ? 'fill-white' : ''} />
                      <span>{product.isPinned ? 'Pinned' : 'Pin'}</span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      className="flex items-center justify-center gap-2 w-full"
                    >
                      <Share2 size={16} />
                      <span>Share</span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      className="flex items-center justify-center gap-2 w-full"
                      onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink size={16} />
                      <span>Visit</span>
                    </Button>
                    
                    <Button
                      variant="error"
                      className="flex items-center justify-center gap-2 w-full"
                      onClick={handleRemove}
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
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