import { useState } from 'react';
import Modal from '../ui/Modal';
import { extractProductDetails } from '../../lib/utils';
import { useProductStore } from '../../store/productStore';
import Button from '../ui/Button';
import { Link2, Loader2 } from 'lucide-react';

interface AddProductModalProps {
  onClose: () => void;
}

const AddProductModal = ({ onClose }: AddProductModalProps) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addProduct } = useProductStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    // Simple URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const productDetails = await extractProductDetails(url);
      
      addProduct({
        ...productDetails,
        isPinned: false,
        tags: [],
        createdBy: 'user1',
      });
      
      onClose();
    } catch (err) {
      setError('Failed to extract product details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Product">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="url" className="block text-sm font-medium text-primary-700 mb-1">
            Product URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 size={16} className="text-primary-400" />
            </div>
            <input
              type="text"
              id="url"
              placeholder="https://www.example.com/product"
              className="input pl-10"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <p className="mt-1 text-xs text-primary-500">
            Paste a product URL from any website to save it to your Whizlist
          </p>
          {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Extracting...' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;