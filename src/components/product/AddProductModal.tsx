import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Modal from '../ui/Modal';
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(currentListId || null);
  
  const { createProduct } = useProductStore();
  const { lists, fetchLists, addProductToList } = useListStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url || !title) {
      setError('Please enter a URL and title');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const product = {
        title,
        description,
        price,
        image_url: imageUrl,
        product_url: url,
        is_pinned: false,
        tags: [],
      };

      const createdProduct = await createProduct(product);
      
      if (selectedListId && createdProduct) {
        await addProductToList(selectedListId, createdProduct.id);
      }
      
      onClose();
    } catch (err) {
      setError('Failed to create product. Please try again.');
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
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-primary-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-primary-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              className="input resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-primary-700 mb-1">
              Price
            </label>
            <input
              type="text"
              id="price"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="$0.00"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-primary-700 mb-1">
              Image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              className="input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
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
            disabled={isLoading || !url.trim() || !title.trim()}
          >
            Add Product
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;