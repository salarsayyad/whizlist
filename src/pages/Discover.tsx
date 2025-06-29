import { useState, useEffect } from 'react';
import { Grid, List as ListIcon, Filter, TrendingUp, Calendar, Clock, Award, Eye } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

const Discover = () => {
  const { products, fetchProducts, viewMode, setViewMode, isLoading } = useProductStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('week');
  
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products based on time range
  const getFilteredProducts = (timeRange: TimeRange) => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeRange) {
      case 'day':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    return products
      .filter(product => new Date(product.createdAt) >= cutoffDate)
      .sort((a, b) => {
        // Sort by pinned first, then by creation date (newest first)
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  };

  const filteredProducts = getFilteredProducts(selectedTimeRange);

  // Create a set of product URLs that are already in the user's collection
  const userProductUrls = new Set(products.map(product => product.productUrl));

  // For demo purposes, we'll simulate some "discovered" products that aren't in the user's collection
  // In a real app, these would come from a different API endpoint or be marked differently
  const getDiscoveredProducts = () => {
    // For now, we'll treat all products as if they're in the user's collection
    // In the future, you can modify this logic to distinguish between user's products and discovered products
    return filteredProducts.map(product => ({
      ...product,
      isInUserCollection: true // Change this logic based on your app's needs
    }));
  };

  const discoveredProducts = getDiscoveredProducts();

  const timeRangeOptions = [
    { value: 'day' as TimeRange, label: 'Today', icon: Clock },
    { value: 'week' as TimeRange, label: 'This Week', icon: Calendar },
    { value: 'month' as TimeRange, label: 'This Month', icon: TrendingUp },
    { value: 'quarter' as TimeRange, label: 'This Quarter', icon: Award },
    { value: 'year' as TimeRange, label: 'This Year', icon: Eye },
  ];

  const getTimeRangeLabel = (range: TimeRange) => {
    const option = timeRangeOptions.find(opt => opt.value === range);
    return option?.label || 'This Week';
  };

  const getTimeRangeIcon = (range: TimeRange) => {
    const option = timeRangeOptions.find(opt => opt.value === range);
    return option?.icon || Calendar;
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
      {/* Header Section */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-900">Discover</h1>
              <p className="text-primary-600">Trending products from the community</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {timeRangeOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTimeRange === option.value
                    ? 'bg-accent-600 text-white shadow-md'
                    : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-200'
                }`}
              >
                <IconComponent size={16} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-lg font-medium text-primary-900">
              {getTimeRangeLabel(selectedTimeRange)} ({discoveredProducts.length} products)
            </h2>
          </motion.div>
        </div>
        
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

      {/* Products Grid */}
      {discoveredProducts.length === 0 ? (
        <motion.div 
          className="text-center py-16 card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {React.createElement(getTimeRangeIcon(selectedTimeRange), { 
            size: 64, 
            className: "mx-auto mb-4 text-primary-300" 
          })}
          <h3 className="text-xl font-medium text-primary-700 mb-2">
            No products found for {getTimeRangeLabel(selectedTimeRange).toLowerCase()}
          </h3>
          <p className="text-primary-600 mb-6">
            Try selecting a different time range or check back later for new discoveries.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {timeRangeOptions
              .filter(option => option.value !== selectedTimeRange)
              .slice(0, 3)
              .map((option) => (
                <Button
                  key={option.value}
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedTimeRange(option.value)}
                  className="flex items-center gap-1"
                >
                  <option.icon size={14} />
                  {option.label}
                </Button>
              ))}
          </div>
        </motion.div>
      ) : (
        <div className="pb-8">
          {viewMode === 'grid' ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {discoveredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProductCard 
                    product={product} 
                    showPin={false} // Don't show pin in Discover page
                    showTags={false} // Don't show tags in Discover page
                    showActions={false} // Don't show comment/share buttons in Discover page
                    showAddToList={true} // Show "Add to List" button for products not in collection
                    isInUserCollection={product.isInUserCollection}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {discoveredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <ProductListItem product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple list item component for list view
const ProductListItem = ({ product }: { product: any }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="card p-4 flex gap-4 hover:bg-primary-50 transition-colors duration-200 cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-primary-900 line-clamp-1">{product.title}</h3>
            {product.price && (
              <p className="text-primary-800 text-sm font-medium">{product.price}</p>
            )}
            <p className="text-primary-600 text-sm mt-1 line-clamp-2">
              {product.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {product.isPinned && (
              <div className="p-1 rounded-full bg-accent-100 text-accent-700">
                <Award size={14} />
              </div>
            )}
            <span className="text-primary-500 text-xs whitespace-nowrap">
              {new Date(product.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import React and useNavigate
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default Discover;