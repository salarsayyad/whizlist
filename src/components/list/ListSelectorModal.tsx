import { useState } from 'react';
import Modal from '../ui/Modal';
import { useListStore } from '../../store/listStore';
import Button from '../ui/Button';
import { Plus, Check } from 'lucide-react';

interface ListSelectorModalProps {
  productId: string;
  onClose: () => void;
}

const ListSelectorModal = ({ productId, onClose }: ListSelectorModalProps) => {
  const { lists, addProductToList, removeProductFromList, createList } = useListStore();
  const [selectedLists, setSelectedLists] = useState<string[]>(
    lists.filter(list => list.products.includes(productId)).map(list => list.id)
  );
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  
  const handleToggleList = (listId: string) => {
    setSelectedLists(prev => {
      if (prev.includes(listId)) {
        return prev.filter(id => id !== listId);
      } else {
        return [...prev, listId];
      }
    });
  };
  
  const handleSave = async () => {
    try {
      // Remove from lists that are no longer selected
      const removePromises = lists
        .filter(list => list.products.includes(productId) && !selectedLists.includes(list.id))
        .map(list => removeProductFromList(list.id, productId));

      // Add to newly selected lists
      const addPromises = selectedLists
        .filter(listId => !lists.find(list => list.id === listId)?.products.includes(productId))
        .map(listId => addProductToList(listId, productId));

      await Promise.all([...removePromises, ...addPromises]);
      onClose();
    } catch (error) {
      console.error('Error saving list selections:', error);
    }
  };
  
  const handleCreateNewList = async () => {
    if (!newListName.trim()) return;
    
    try {
      const newList = await createList({
        name: newListName.trim(),
        isPublic: false,
        description: null,
        folderId: null,
      });

      await addProductToList(newList.id, productId);
      setSelectedLists(prev => [...prev, newList.id]);
      setNewListName('');
      setShowNewListInput(false);
    } catch (error) {
      console.error('Error creating new list:', error);
    }
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Add to List">
      <div className="max-h-64 overflow-y-auto mb-4">
        {lists.map((list) => (
          <div 
            key={list.id}
            className="flex items-center justify-between py-2 border-b border-primary-100 last:border-b-0"
          >
            <div className="flex items-center">
              <button
                className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedLists.includes(list.id) 
                    ? 'bg-primary-700 border-primary-700 text-white' 
                    : 'border-primary-300'
                }`}
                onClick={() => handleToggleList(list.id)}
              >
                {selectedLists.includes(list.id) && <Check size={14} />}
              </button>
              <span className="ml-3 text-primary-800">{list.name}</span>
            </div>
            <span className="text-primary-500 text-sm">{list.products.length} items</span>
          </div>
        ))}
        
        {showNewListInput ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="New list name"
              className="input flex-1"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowNewListInput(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateNewList}
              disabled={!newListName.trim()}
            >
              Create
            </Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-2 mt-3 text-accent-600 hover:text-accent-700"
            onClick={() => setShowNewListInput(true)}
          >
            <Plus size={18} />
            <span>Create new list</span>
          </button>
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
          type="button"
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default ListSelectorModal;