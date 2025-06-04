import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useListStore } from '../../store/listStore';

interface CreateListModalProps {
  folderId?: string;
  onClose: () => void;
}

const CreateListModal = ({ folderId, onClose }: CreateListModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createList, isLoading, error } = useListStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createList({
        name,
        description,
        isPublic: false,
        folderId: folderId || null,
      });
      onClose();
    } catch (err) {
      // Error is handled by the store
    }
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Create New List">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-primary-700 mb-1">
              List Name
            </label>
            <input
              type="text"
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My List"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-primary-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              className="input resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
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
            disabled={!name.trim() || isLoading}
          >
            Create List
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateListModal;