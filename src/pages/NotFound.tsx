import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { BookmarkX } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BookmarkX size={64} className="text-primary-300 mb-4" />
      <h1 className="text-3xl font-medium text-primary-900 mb-2">Page Not Found</h1>
      <p className="text-primary-600 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate('/')}>
        Return to Dashboard
      </Button>
    </div>
  );
};

export default NotFound;