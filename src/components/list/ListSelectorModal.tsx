import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useListStore } from '../../store/listStore';
import { useFolderStore } from '../../store/folderStore';
import Button from '../ui/Button';
import { Plus, Check, FolderOpen, ChevronDown, ChevronRight, List as ListIcon } from 'lucide-react';

interface ListSelectorModalProps {
  productId: string;
  onClose: () => void;
}

const ListSelectorModal = ({ productId, onClose }: ListSelectorModalProps) => {
  const { lists, addProductToList, removeProductFromList, createList } = useListStore();
  const { folders, fetchFolders } = useFolderStore();
  const [selectedLists, setSelectedLists] = useState<string[]>(
    lists.filter(list => list.products.includes(productId)).map(list => list.id)
  );
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleToggleList = (listId: string) => {
    setSelectedLists(prev => {
      if (prev.includes(listId)) {
        return prev.filter(id => id !== listId);
      } else {
        return [...prev, listId];
      }
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
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
        folderId: selectedFolderId,
      });

      await addProductToList(newList.id, productId);
      setSelectedLists(prev => [...prev, newList.id]);
      setNewListName('');
      setShowNewListInput(false);
      setSelectedFolderId(null);
    } catch (error) {
      console.error('Error creating new list:', error);
    }
  };

  const handleShowNewListInput = (folderId?: string) => {
    setSelectedFolderId(folderId || null);
    setShowNewListInput(true);
  };

  // Group lists by folder
  const getFolderLists = (folderId: string) => {
    return lists.filter(list => list.folderId === folderId);
  };

  const getUnorganizedLists = () => {
    return lists.filter(list => !list.folderId);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add to List" size="lg">
      <div className="max-h-96 overflow-y-auto mb-4">
        <div className="space-y-2">
          {/* Folders with their lists */}
          {folders.map((folder) => {
            const folderLists = getFolderLists(folder.id);
            const isExpanded = expandedFolders.includes(folder.id);
            
            return (
              <div key={folder.id} className="border border-primary-200 rounded-lg">
                {/* Folder header */}
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-t-lg">
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-primary-500" />
                    ) : (
                      <ChevronRight size={16} className="text-primary-500" />
                    )}
                    <FolderOpen size={16} className="text-primary-600" />
                    <span className="font-medium text-primary-800">{folder.name}</span>
                    <span className="text-primary-500 text-sm">({folderLists.length} lists)</span>
                  </button>
                  
                  <button
                    className="text-accent-600 hover:text-accent-700 p-1 rounded-md hover:bg-accent-50"
                    onClick={() => handleShowNewListInput(folder.id)}
                    title="Add new list to this folder"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Folder lists */}
                {isExpanded && (
                  <div className="p-2 space-y-1">
                    {folderLists.length > 0 ? (
                      folderLists.map((list) => (
                        <div 
                          key={list.id}
                          className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-primary-50"
                        >
                          <div className="flex items-center">
                            <button
                              className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                                selectedLists.includes(list.id) 
                                  ? 'bg-primary-700 border-primary-700 text-white' 
                                  : 'border-primary-300'
                              }`}
                              onClick={() => handleToggleList(list.id)}
                            >
                              {selectedLists.includes(list.id) && <Check size={14} />}
                            </button>
                            <ListIcon size={14} className="text-primary-500 mr-2" />
                            <span className="text-primary-800">{list.name}</span>
                          </div>
                          <span className="text-primary-500 text-sm">{list.products.length} items</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-primary-500 text-sm">
                        No lists in this folder yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unorganized lists */}
          {getUnorganizedLists().length > 0 && (
            <div className="border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <ListIcon size={16} className="text-primary-600" />
                  <span className="font-medium text-primary-800">Unorganized Lists</span>
                  <span className="text-primary-500 text-sm">({getUnorganizedLists().length} lists)</span>
                </div>
                
                <button
                  className="text-accent-600 hover:text-accent-700 p-1 rounded-md hover:bg-accent-50"
                  onClick={() => handleShowNewListInput()}
                  title="Add new unorganized list"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="p-2 space-y-1">
                {getUnorganizedLists().map((list) => (
                  <div 
                    key={list.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-primary-50"
                  >
                    <div className="flex items-center">
                      <button
                        className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                          selectedLists.includes(list.id) 
                            ? 'bg-primary-700 border-primary-700 text-white' 
                            : 'border-primary-300'
                        }`}
                        onClick={() => handleToggleList(list.id)}
                      >
                        {selectedLists.includes(list.id) && <Check size={14} />}
                      </button>
                      <ListIcon size={14} className="text-primary-500 mr-2" />
                      <span className="text-primary-800">{list.name}</span>
                    </div>
                    <span className="text-primary-500 text-sm">{list.products.length} items</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New list input */}
          {showNewListInput && (
            <div className="border border-accent-200 rounded-lg p-4 bg-accent-50">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={16} className="text-accent-600" />
                <span className="font-medium text-accent-800">
                  Create New List
                  {selectedFolderId && (
                    <span className="text-accent-600 ml-1">
                      in "{folders.find(f => f.id === selectedFolderId)?.name}"
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New list name"
                  className="input flex-1"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewList();
                    } else if (e.key === 'Escape') {
                      setShowNewListInput(false);
                      setNewListName('');
                      setSelectedFolderId(null);
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowNewListInput(false);
                    setNewListName('');
                    setSelectedFolderId(null);
                  }}
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
            </div>
          )}

          {/* Empty state */}
          {folders.length === 0 && getUnorganizedLists().length === 0 && (
            <div className="text-center py-8 text-primary-600">
              <ListIcon size={48} className="mx-auto mb-3 text-primary-300" />
              <p className="mb-4">No lists found. Create your first list!</p>
              <Button
                variant="accent"
                onClick={() => handleShowNewListInput()}
                className="mx-auto"
              >
                <Plus size={16} className="mr-1" />
                Create First List
              </Button>
            </div>
          )}
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
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default ListSelectorModal;