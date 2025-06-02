import { useProductStore } from '../../store/productStore';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

const ProductGrid = () => {
  const { products } = useProductStore();
  
  // Sort products with pinned first, then by date
  const sortedProducts = [...products].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {sortedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
};

export default ProductGrid;