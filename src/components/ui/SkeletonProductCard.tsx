import { motion } from 'framer-motion';

interface SkeletonProductCardProps {
  index?: number;
}

const SkeletonProductCard = ({ index = 0 }: SkeletonProductCardProps) => {
  return (
    <motion.div 
      className="card overflow-hidden flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gradient-to-r from-primary-200 via-primary-100 to-primary-200 animate-pulse">
        <div className="w-full h-full bg-primary-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
               style={{
                 background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                 transform: 'translateX(-100%)',
                 animation: 'shimmer 2s infinite'
               }} />
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        {/* Title skeleton */}
        <div className="h-6 bg-primary-200 rounded animate-pulse mb-2" />
        
        {/* Price skeleton */}
        <div className="h-4 bg-primary-150 rounded animate-pulse mb-3 w-20" />
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-3 flex-1">
          <div className="h-3 bg-primary-150 rounded animate-pulse" />
          <div className="h-3 bg-primary-150 rounded animate-pulse w-4/5" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-1 mb-3">
          <div className="h-5 bg-primary-150 rounded-full animate-pulse w-12" />
          <div className="h-5 bg-primary-150 rounded-full animate-pulse w-16" />
          <div className="h-5 bg-primary-150 rounded-full animate-pulse w-10" />
        </div>
      </div>

      {/* Bottom section skeleton */}
      <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-primary-200 rounded animate-pulse w-24" />
          <div className="flex items-center gap-3">
            <div className="h-4 bg-primary-200 rounded animate-pulse w-8" />
            <div className="h-4 bg-primary-200 rounded animate-pulse w-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SkeletonProductCard;