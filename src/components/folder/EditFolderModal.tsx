import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useFolderStore } from '../../store/folderStore';
import { Folder } from '../../types/database';

interface EditFolderModalProps {
  folder: Folder;
  onClose: () => void;
}

const EditFolderModal = ({ folder, onClose }: EditFolderModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updateFolder } = useFolderStore();

  // Initialize form with folder data
  useEffect(() => {
    setName(folder.name);
    setDescription(folder.description || '');
  }, [folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Folder name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateFolder(folder.id, { 
        name: name.trim(), 
        description: description.trim() || null 
      });
      onClose();
    } catch (error) {
      console.error('Error updating folder:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setName(folder.name);
    setDescription(folder.description || '');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={handleCancel} title="Edit Folder">
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
              placeholder="Folder name"
              required
              autoFocus
              disabled={isSaving}
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
              placeholder="Folder description..."
              rows={4}
              disabled={isSaving}
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={!name.trim() || isSaving}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditFolderModal;