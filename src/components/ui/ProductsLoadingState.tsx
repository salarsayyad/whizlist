import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ProductsLoadingStateProps {
  message?: string;
  showIcon?: boolean;
}

const ProductsLoadingState = ({ 
  message = "Loading products...", 
  showIcon = true 
}: ProductsLoadingStateProps) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showIcon && (
        <div className="mb-4 p-4 rounded-full bg-primary-100">
          <Package size={32} className="text-primary-500" />
        </div>
      )}
      
      <LoadingSpinner size="lg" className="mb-4" />
      
      <h3 className="text-lg font-medium text-primary-700 mb-2">
        {message}
      </h3>
      
      <p className="text-primary-500 text-sm text-center max-w-md">
        Please wait while we fetch your products...
      </p>
      
      {/* Animated dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ProductsLoadingState;