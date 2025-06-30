import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft, Hammer, Wrench, Cog } from 'lucide-react';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const UnderConstruction = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        className="text-center max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated Construction Icons */}
        <div className="relative mb-8">
          <motion.div
            className="inline-block p-6 rounded-full bg-warning-100"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Construction size={64} className="text-warning-600" />
          </motion.div>
          
          {/* Floating tools */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="p-2 rounded-full bg-warning-200">
              <Hammer size={20} className="text-warning-700" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute -bottom-2 -left-2"
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="p-2 rounded-full bg-warning-200">
              <Wrench size={20} className="text-warning-700" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute top-1/2 -left-8"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="p-1.5 rounded-full bg-warning-200">
              <Cog size={16} className="text-warning-700" />
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-primary-900 mb-4">
            Under Construction
          </h1>
          
          <p className="text-primary-600 mb-2 text-lg">
            We're working hard to bring you this feature!
          </p>
          
          <p className="text-primary-500 mb-8 text-sm">
            This section is currently being built. Check back soon for exciting new functionality.
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="bg-primary-100 rounded-full h-2 w-full max-w-xs mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 2, delay: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-primary-500 mt-2">65% Complete</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => navigate('/discover')}
            className="flex items-center gap-2 mx-auto"
          >
            Return to Discover
          </Button>
        </motion.div>

        {/* Fun Message */}
        <motion.div
          className="mt-8 p-4 bg-accent-50 rounded-lg border border-accent-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <p className="text-accent-700 text-sm">
            💡 <strong>Coming Soon:</strong> Enhanced features to make your Whizlist experience even better!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UnderConstruction;