import { motion } from 'framer-motion';

interface SkeletonListItemProps {
  index?: number;
}

const SkeletonListItem = ({ index = 0 }: SkeletonListItemProps) => {
  return (
    <motion.div 
      className="card p-4 flex gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      {/* Image skeleton */}
      <div className="w-16 h-16 flex-shrink-0 rounded-md bg-primary-200 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
             style={{
               background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
               transform: 'translateX(-100%)',
               animation: 'shimmer 2s infinite'
             }} />
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Title skeleton */}
        <div className="h-5 bg-primary-200 rounded animate-pulse mb-1 w-3/4" />
        
        {/* Price skeleton */}
        <div className="h-4 bg-primary-150 rounded animate-pulse mb-2 w-20" />
        
        {/* Description skeleton */}
        <div className="space-y-1 mb-2">
          <div className="h-3 bg-primary-150 rounded animate-pulse" />
          <div className="h-3 bg-primary-150 rounded animate-pulse w-4/5" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-1">
          <div className="h-4 bg-primary-150 rounded-full animate-pulse w-12" />
          <div className="h-4 bg-primary-150 rounded-full animate-pulse w-16" />
        </div>
      </div>
      
      <div className="flex flex-col justify-between items-end">
        {/* Action buttons skeleton */}
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 bg-primary-200 rounded-full animate-pulse" />
          <div className="w-7 h-7 bg-primary-200 rounded-full animate-pulse" />
          <div className="w-7 h-7 bg-primary-200 rounded-full animate-pulse" />
        </div>
        
        {/* Date skeleton */}
        <div className="h-3 bg-primary-150 rounded animate-pulse w-16 mt-2" />
      </div>
    </motion.div>
  );
};

export default SkeletonListItem;