import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Grid, List as ListIcon, Filter } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import ProductGrid from '../components/product/ProductGrid';
import ProductList from '../components/product/ProductList';
import Button from '../components/ui/Button';
import ProductsLoadingState from '../components/ui/ProductsLoadingState';
import { motion } from 'framer-motion';

const TagDetail = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const { products, viewMode, setViewMode, fetchProducts, isLoading } = useProductStore();
  
  // Decode the tag from URL
  const decodedTag = tag ? decodeURIComponent(tag) : '';
  
  // Filter products that have this tag
  const taggedProducts = products.filter(product => 
    product.tags.some(productTag => 
      productTag.toLowerCase() === decodedTag.toLowerCase()
    )
  );

  // Get related tags (tags that appear with this tag)
  const relatedTags = new Set<string>();
  taggedProducts.forEach(product => {
    product.tags.forEach(productTag => {
      if (productTag.toLowerCase() !== decodedTag.toLowerCase()) {
        relatedTags.add(productTag);
      }
    });
  });

  const relatedTagsArray = Array.from(relatedTags).slice(0, 10); // Limit to 10 related tags

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRelatedTagClick = (relatedTag: string) => {
    navigate(`/tag/${encodeURIComponent(relatedTag)}`);
  };

  if (!decodedTag) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-primary-700 mb-2">Invalid tag</h2>
        <p className="text-primary-600 mb-6">The tag you're looking for is not valid.</p>
        <Button 
          onClick={() => navigate('/dashboard')}
          variant="secondary"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

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
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-2">
                <Tag size={24} className="text-primary-600 mr-2" />
                <h1 className="text-2xl font-medium text-primary-900">#{decodedTag}</h1>
              </div>
              <p className="text-primary-600">
                {taggedProducts.length} product{taggedProducts.length === 1 ? '' : 's'} tagged with "{decodedTag}"
              </p>
            </motion.div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
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
      </div>

      {/* Related Tags */}
      {relatedTagsArray.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-primary-700 mb-3">Related Tags</h3>
          <div className="flex flex-wrap gap-2">
            {relatedTagsArray.map((relatedTag) => (
              <button
                key={relatedTag}
                onClick={() => handleRelatedTagClick(relatedTag)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 hover:bg-primary-200 transition-colors"
              >
                <Tag size={12} />
                {relatedTag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Show loading state while products are being fetched */}
      {isLoading ? (
        <ProductsLoadingState message={`Loading products tagged with "${decodedTag}"...`} />
      ) : taggedProducts.length === 0 ? (
        <div className="text-center py-16 card p-8">
          <Tag size={64} className="mx-auto mb-4 text-primary-300" />
          <h3 className="text-xl font-medium text-primary-700 mb-2">No products found</h3>
          <p className="text-primary-600 mb-6">
            There are no products tagged with "{decodedTag}" yet.
          </p>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="mx-auto"
          >
            Browse All Products
          </Button>
        </div>
      ) : (
        <div className="pb-8">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {taggedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="card cursor-pointer overflow-hidden flex flex-col h-full hover:shadow-elevated transition-shadow duration-300"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="relative">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.title} 
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-primary-200 flex items-center justify-center">
                          <span className="text-primary-500">No image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-medium text-primary-900 line-clamp-1 mb-2">{product.title}</h3>
                      
                      {product.price && (
                        <p className="text-primary-800 font-medium mb-2">{product.price}</p>
                      )}
                      
                      <p className="text-primary-600 text-sm mb-3 line-clamp-2 flex-1">
                        {product.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((productTag) => (
                          <span 
                            key={productTag} 
                            className={`badge-primary text-xs ${
                              productTag.toLowerCase() === decodedTag.toLowerCase() 
                                ? 'bg-accent-100 text-accent-800' 
                                : ''
                            }`}
                          >
                            {productTag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {taggedProducts.map((product) => (
                <motion.div 
                  key={product.id}
                  className="card p-4 flex gap-4 hover:bg-primary-50 transition-colors duration-200 cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
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
                    <h3 className="font-medium text-primary-900">{product.title}</h3>
                    {product.price && (
                      <p className="text-primary-800 text-sm">{product.price}</p>
                    )}
                    <p className="text-primary-600 text-sm mt-1 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.tags.map((productTag) => (
                        <span 
                          key={productTag} 
                          className={`badge-primary text-xs ${
                            productTag.toLowerCase() === decodedTag.toLowerCase() 
                              ? 'bg-accent-100 text-accent-800' 
                              : ''
                          }`}
                        >
                          {productTag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between items-end">
                    <span className="text-primary-500 text-xs">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagDetail;