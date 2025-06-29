import { useState, useEffect } from 'react';
import { Grid, List as ListIcon, Filter, Plus } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import ProductGrid from '../components/product/ProductGrid';
import ProductList from '../components/product/ProductList';
import Button from '../components/ui/Button';
import AddProductModal from '../components/product/AddProductModal';
import SkeletonProductCard from '../components/ui/SkeletonProductCard';
import SkeletonListItem from '../components/ui/SkeletonListItem';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { viewMode, setViewMode, products, fetchProducts, isLoading } = useProductStore();
  const [showAddModal, setShowAddModal] = useState(false);
  
  useEffect(() => {
    // Fetch all products for dashboard view
    fetchProducts();
  }, []);

  // Generate skeleton count based on typical grid layout
  const getSkeletonCount = () => {
    if (viewMode === 'grid') {
      // Show 8 skeleton cards for grid view (2 rows of 4 on desktop)
      return 8;
    } else {
      // Show 6 skeleton items for list view
      return 6;
    }
  };
  
  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <motion.h1 
          className="text-2xl font-medium text-primary-900"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          All Products {!isLoading && `(${products.length})`}
        </motion.h1>
        
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
      
      {/* Divider line between header and content */}
      <div className="h-px bg-primary-200 mb-6 mt-4"></div>
      
      {/* Show skeleton loading state while products are being fetched */}
      {isLoading ? (
        <div className="pb-8">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: getSkeletonCount() }).map((_, index) => (
                <SkeletonProductCard key={index} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: getSkeletonCount() }).map((_, index) => (
                <SkeletonListItem key={index} index={index} />
              ))}
            </div>
          )}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium text-primary-700 mb-2">No products yet</h3>
          <p className="text-primary-600 mb-6">Start by adding your first product from around the web.</p>
          <Button 
            onClick={handleAddProduct}
            className="flex items-center gap-1 mx-auto"
          >
            <Plus size={16} />
            <span>Add Your First Product</span>
          </Button>
        </div>
      ) : (
        <div className="pb-8">
          {viewMode === 'grid' ? (
            <ProductGrid showPin={false} />
          ) : (
            <ProductList />
          )}
        </div>
      )}
      
      {showAddModal && (
        <AddProductModal onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Dashboard;