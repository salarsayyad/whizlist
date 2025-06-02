import { useState } from 'react';
import Modal from '../ui/Modal';
import { useListStore } from '../../store/listStore';
import Button from '../ui/Button';
import { Plus, Check, FolderPlus } from 'lucide-react';

interface ListSelectorModalProps {
  productId: string;
  onClose: () => void;
}

const ListSelectorModal = ({ productId, onClose }: ListSelectorModalProps) => {
  const { lists, addProductToList, removeProductFromList } = useListStore();
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
  
  const handleSave = () => {
    // Remove from lists that are no longer selected
    lists.forEach(list => {
      if (list.products.includes(productId) && !selectedLists.includes(list.id)) {
        removeProductFromList(list.id, productId);
      }
    });
    
    // Add to newly selected lists
    selectedLists.forEach(listId => {
      if (!lists.find(list => list.id === listId)?.products.includes(productId)) {
        addProductToList(listId, productId);
      }
    });
    
    onClose();
  };
  
  const handleCreateNewList = () => {
    if (!newListName.trim()) return;
    
    const newList = {
      name: newListName.trim(),
      isPublic: false,
      isPinned: false,
      products: [productId],
      createdBy: 'user1',
      collaborators: [],
    };
    
    useListStore.getState().addList(newList);
    setNewListName('');
    setShowNewListInput(false);
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