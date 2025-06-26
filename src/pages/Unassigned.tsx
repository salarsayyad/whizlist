import { useState, useEffect } from 'react';
import { Grid, List as ListIcon, Filter, Package } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import ProductGrid from '../components/product/ProductGrid';
import ProductList from '../components/product/ProductList';
import Button from '../components/ui/Button';
import AddProductModal from '../components/product/AddProductModal';
import { motion } from 'framer-motion';

const Unassigned = () => {
  const { viewMode, setViewMode, products, fetchProducts, isLoading } = useProductStore();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Filter products to only show unassigned ones (products without a list_id)
  const unassignedProducts = products.filter(product => !product.listId);
  
  useEffect(() => {
    // Fetch all products to get unassigned ones
    fetchProducts();
  }, []);
  
  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-medium text-primary-900">
            Unassigned Products ({unassignedProducts.length})
          </h1>
          <p className="text-primary-600 text-sm mt-1">
            Products that haven't been added to any list
          </p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary"
            className="flex items-center gap-1"
          >
            <Filter size={16} />
            <span>Filter</span>
          </Button>

          <div className="flex bg-primary-100 rounded-md p-1">
            <button
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden mb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <h1 className="text-2xl font-medium text-primary-900">
            Unassigned Products ({unassignedProducts.length})
          </h1>
          <p className="text-primary-600 text-sm mt-1">
            Products that haven't been added to any list
          </p>
        </motion.div>
        
        {/* Controls with Filter centered and Grid/List toggle on the right */}
        <div className="flex items-center justify-between">
          {/* Empty div for spacing */}
          <div></div>
          
          {/* Centered Filter button */}
          <Button 
            variant="secondary"
            className="flex items-center gap-1"
          >
            <Filter size={16} />
            <span>Filter</span>
          </Button>

          {/* Grid/List toggle on the right */}
          <div className="flex bg-primary-100 rounded-md p-1">
            <button
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {unassignedProducts.length === 0 ? (
        <div className="text-center py-16 card p-8">
          <Package size={64} className="mx-auto mb-4 text-primary-300" />
          <h3 className="text-xl font-medium text-primary-700 mb-2">No unassigned products</h3>
          <p className="text-primary-600 mb-6">
            All your products are organized in lists. Add a new product or move existing products here.
          </p>
          <Button 
            onClick={handleAddProduct}
            className="flex items-center gap-1 mx-auto"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </Button>
        </div>
      ) : (
        <div className="pb-8">
          {/* Create a temporary store state with only unassigned products */}
          <UnassignedProductDisplay 
            products={unassignedProducts} 
            viewMode={viewMode} 
          />
        </div>
      )}
      
      {showAddModal && (
        <AddProductModal onClose={handleCloseModal} />
      )}
    </div>
  );
};

// Component to display unassigned products using existing grid/list components
const UnassignedProductDisplay = ({ products, viewMode }: { products: any[], viewMode: 'grid' | 'list' }) => {
  // Temporarily override the product store to show only unassigned products
  const { products: originalProducts, ...productStore } = useProductStore();
  
  // Create a temporary store state
  const tempStore = {
    ...productStore,
    products: products
  };
  
  // Sort products with pinned first, then by date
  const sortedProducts = [...products].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  if (viewMode === 'grid') {
    return (
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {sortedProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProductCard 
              product={product} 
              showPin={false} // Don't show pin in Unassigned page
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {sortedProducts.map((product) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <UnassignedProductListItem product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
};

// Import ProductCard component
import ProductCard from '../components/product/ProductCard';

// Simple list item component for unassigned products
const UnassignedProductListItem = ({ product }: { product: any }) => {
  const { togglePin, deleteProduct } = useProductStore();
  const navigate = useNavigate();
  
  return (
    <div className="card p-4 flex gap-4 hover:bg-primary-50 transition-colors duration-200">
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
              onClick={() => navigate(`/tag/${encodeURIComponent(tag)}`)}
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
          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

// Import missing components
import { useNavigate } from 'react-router-dom';
import { Pin, ExternalLink, Trash2, Plus } from 'lucide-react';

export default Unassigned;