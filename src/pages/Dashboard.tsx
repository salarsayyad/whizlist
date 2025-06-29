import { useState, useEffect } from 'react';
import { Grid, List as ListIcon, Filter } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import ProductGrid from '../components/product/ProductGrid';
import ProductList from '../components/product/ProductList';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { viewMode, setViewMode, products, fetchProducts, isLoading } = useProductStore();
  
  useEffect(() => {
    // Fetch all products for dashboard view
    fetchProducts();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <motion.h1 
          className="text-2xl font-medium text-primary-900"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          All Products ({products.length})
        </motion.h1>
        
        <div className="flex items-center gap-3">
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
          
          <Button 
            variant="secondary"
            className="flex items-center gap-1"
          >
            <Filter size={16} />
            <span>Filter</span>
          </Button>
        </div>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium text-primary-700 mb-2">No products yet</h3>
          <p className="text-primary-600 mb-6">Start by adding your first product from around the web.</p>
          <p className="text-primary-500 text-sm">
            Use the + button in the header to add products to your collection.
          </p>
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
    </div>
  );
};

export default Dashboard;