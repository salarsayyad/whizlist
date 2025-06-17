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

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      setTags(tags.slice(0, -1));
    }
  };

  const handleSave = async () => {
    try {
      await updateProduct(productId, { tags });
      onClose();
    } catch (error) {
      console.error('Error updating product tags:', error);
    }
  };

  const hasChanges = JSON.stringify(tags.sort()) !== JSON.stringify(currentTags.sort());

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
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-primary-800 border border-primary-200 shadow-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-primary-500 hover:text-primary-700 ml-1"
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
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.includes(tagInput.trim())}
            >
              <Plus size={16} />
            </Button>
          </div>
          
          <p className="mt-2 text-xs text-primary-500">
            Press Enter or click + to add tags. Click × on tags to remove them.
          </p>
        </div>
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
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          isLoading={isLoading}
        >
          Save Changes
        </Button>
      </div>
    </Modal>
  );
};

export default AddTagModal;