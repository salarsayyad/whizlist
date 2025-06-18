import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useListStore } from '../../store/listStore';
import { List } from '../../types';

interface EditListModalProps {
  list: List;
  onClose: () => void;
}

const EditListModal = ({ list, onClose }: EditListModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updateList } = useListStore();

  // Initialize form with list data
  useEffect(() => {
    setName(list.name);
    setDescription(list.description || '');
  }, [list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('List name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateList(list.id, { 
        name: name.trim(), 
        description: description.trim() || null 
      });
      onClose();
    } catch (error) {
      console.error('Error updating list:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setName(list.name);
    setDescription(list.description || '');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={handleCancel} title="Edit List">
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
              placeholder="List name"
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
              placeholder="List description..."
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

export default EditListModal;