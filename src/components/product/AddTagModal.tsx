import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useProductStore } from '../../store/productStore';

interface AddTagModalProps {
  productId: string;
  currentTags: string[];
  onClose: () => void;
}

const AddTagModal = ({ productId, currentTags, onClose }: AddTagModalProps) => {
  const [tags, setTags] = useState<string[]>([...currentTags]);
  const [tagInput, setTagInput] = useState('');
  const { updateProduct, isLoading } = useProductStore();

  const handleAddTag = async () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setTagInput('');
      
      // Immediately persist the change
      try {
        await updateProduct(productId, { tags: newTags });
      } catch (error) {
        console.error('Error adding tag:', error);
        // Revert on error
        setTags(tags);
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    
    // Immediately persist the change
    try {
      await updateProduct(productId, { tags: newTags });
    } catch (error) {
      console.error('Error removing tag:', error);
      // Revert on error
      setTags(tags);
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Manage Tags">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Product Tags
          </label>
          
          {/* Tags display */}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-primary-50 rounded-lg min-h-[60px]">
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-primary-800 border border-primary-200 shadow-sm group"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-primary-500 hover:text-primary-700 ml-1 opacity-70 group-hover:opacity-100 transition-opacity"
                    disabled={isLoading}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-primary-50 rounded-lg text-center text-primary-500 mb-3">
              No tags added yet. Add some tags to help organize this product.
            </div>
          )}
          
          {/* Tag input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a tag..."
              className="input flex-1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyPress}
              autoFocus
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.includes(tagInput.trim()) || isLoading}
              isLoading={isLoading}
            >
              <Plus size={16} />
            </Button>
          </div>
          
          <p className="mt-2 text-xs text-primary-500">
            Press Enter or click + to add tags. Click × on tags to remove them. Changes are saved automatically.
          </p>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button 
          type="button" 
          variant="secondary"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default AddTagModal;