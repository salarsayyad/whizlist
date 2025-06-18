import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useFolderStore } from '../../store/folderStore';

interface CreateFolderModalProps {
  onClose: () => void;
}

const CreateFolderModal = ({ onClose }: CreateFolderModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createFolder, isLoading, error } = useFolderStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createFolder({
        name,
        description,
        is_public: false,
        parent_id: null,
      });
      onClose();
    } catch (err) {
      // Error is handled by the store
    }
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Folder">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-primary-700 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Folder"
              required
              autoFocus
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
            Create Folder
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateFolderModal;