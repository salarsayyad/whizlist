import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Modal from '../ui/Modal';
import { extractProductDetails } from '../../lib/utils';
import { useProductStore } from '../../store/productStore';
import { useListStore } from '../../store/listStore';
import Button from '../ui/Button';
import { Link2, ChevronDown } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { cn } from '../../lib/utils';

interface AddProductModalProps {
  onClose: () => void;
}

const AddProductModal = ({ onClose }: AddProductModalProps) => {
  const { id: currentListId } = useParams<{ id: string }>();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(currentListId || null);
  
  const { createProduct } = useProductStore();
  const { lists, fetchLists, addProductToList } = useListStore();
  
  useEffect(() => {
    fetchLists();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const productDetails = await extractProductDetails(url);
      const createdProduct = await createProduct(productDetails);
      
      if (selectedListId) {
        await addProductToList(selectedListId, createdProduct.id);
      }
      
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract product details';
      if (errorMessage === 'Could not extract product title') {
        setError('Could not extract product title from the URL. Please try a different URL or check if the product page is accessible.');
      } else {
        setError(`Failed to add product: ${errorMessage}`);
      }
      console.error('Error adding product:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectedList = lists.find(list => list.id === selectedListId);
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Product">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
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
                required
              />
            </div>
            <p className="mt-1 text-xs text-primary-500">
              Paste a product URL from any website to save it to your Whizlist
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Add to List
            </label>
            <Menu as="div" className="relative">
              <Menu.Button className="input w-full flex items-center justify-between">
                <span className="block truncate">
                  {selectedList ? selectedList.name : 'Unassigned'}
                </span>
                <ChevronDown size={16} className="text-primary-500" />
              </Menu.Button>
              <Menu.Items className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-elevated py-1 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm',
                        active ? 'bg-primary-50 text-primary-900' : 'text-primary-700'
                      )}
                      onClick={() => setSelectedListId(null)}
                    >
                      Unassigned
                    </button>
                  )}
                </Menu.Item>
                {lists.map(list => (
                  <Menu.Item key={list.id}>
                    {({ active }) => (
                      <button
                        type="button"
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm',
                          active ? 'bg-primary-50 text-primary-900' : 'text-primary-700'
                        )}
                        onClick={() => setSelectedListId(list.id)}
                      >
                        {list.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          </div>
          
          {error && (
            <p className="text-sm text-error-600">{error}</p>
          )}
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
            disabled={!url.trim() || isLoading}
          >
            {isLoading ? 'Extracting...' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;