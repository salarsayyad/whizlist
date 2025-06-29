import { motion } from 'framer-motion';

interface SkeletonFolderCardProps {
  index?: number;
}

const SkeletonFolderCard = ({ index = 0 }: SkeletonFolderCardProps) => {
  return (
    <motion.div 
      className="card overflow-hidden flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {/* Pin button skeleton */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-8 h-8 bg-primary-200 rounded-full animate-pulse" />
      </div>

      <div className="p-6 flex-1 flex flex-col pt-12">
        {/* LIST indicator skeleton */}
        <div className="mb-2">
          <div className="h-3 bg-primary-200 rounded animate-pulse w-8" />
        </div>
        
        {/* List name skeleton */}
        <div className="mb-3">
          <div className="h-5 bg-primary-200 rounded animate-pulse w-3/4" />
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-3 flex-1">
          <div className="h-3 bg-primary-150 rounded animate-pulse" />
          <div className="h-3 bg-primary-150 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-primary-150 rounded animate-pulse w-2/3" />
        </div>
      </div>
      
      {/* Bottom section skeleton */}
      <div className="px-6 py-3 bg-primary-50 border-t border-primary-100">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-primary-200 rounded animate-pulse w-16" />
          <div className="h-4 bg-primary-200 rounded animate-pulse w-12" />
        </div>
      </div>
    </motion.div>
  );
};

export default SkeletonFolderCard;