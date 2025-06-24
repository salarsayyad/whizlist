import { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { useListStore } from '../../store/listStore';
import { useFolderStore } from '../../store/folderStore';
import Button from '../ui/Button';
import { Plus, Check, FolderOpen, ChevronDown, ChevronRight, Search, X } from 'lucide-react';

interface MoveListToFolderModalProps {
  listId: string;
  currentFolderId: string | null;
  onClose: () => void;
}

const MoveListToFolderModal = ({ listId, currentFolderId, onClose }: MoveListToFolderModalProps) => {
  const { updateList } = useListStore();
  const { folders, fetchFolders, createFolder } = useFolderStore();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders;
    }
    
    const query = searchQuery.toLowerCase();
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(query) ||
      folder.description?.toLowerCase().includes(query)
    );
  }, [folders, searchQuery]);

  // Auto-expand folders when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const foldersToExpand = filteredFolders.map(folder => folder.id);
      setExpandedFolders(foldersToExpand);
    }
  }, [searchQuery, filteredFolders]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleMove = async () => {
    if (selectedFolderId === currentFolderId) {
      onClose();
      return;
    }

    setIsMoving(true);
    try {
      await updateList(listId, { folderId: selectedFolderId });
      onClose();
    } catch (error) {
      console.error('Error moving list to folder:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const newFolder = await createFolder({
        name: newFolderName.trim(),
        description: null,
        is_public: false,
        parent_id: null,
      });

      setSelectedFolderId(newFolder.id);
      setNewFolderName('');
      setShowNewFolderInput(false);
    } catch (error) {
      console.error('Error creating new folder:', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const hasChanges = selectedFolderId !== currentFolderId;

  return (
    <Modal isOpen={true} onClose={onClose} title="Move List to Folder" size="lg">
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-primary-400" />
          </div>
          <input
            type="text"
            placeholder="Search folders..."
            className="input pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-400 hover:text-primary-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto mb-4">
        <div className="space-y-2">
          {/* No Folder Option */}
          <div className="border border-primary-200 rounded-lg p-3">
            <div className="flex items-center">
              <button
                className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                  selectedFolderId === null 
                    ? 'bg-primary-700 border-primary-700 text-white' 
                    : 'border-primary-300'
                }`}
                onClick={() => setSelectedFolderId(null)}
              >
                {selectedFolderId === null && <Check size={14} />}
              </button>
              <span className="text-primary-800 font-medium">No Folder (Unorganized)</span>
            </div>
          </div>

          {/* Existing Folders */}
          {filteredFolders.length > 0 ? (
            filteredFolders.map((folder) => (
              <div key={folder.id} className="border border-primary-200 rounded-lg">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center flex-1">
                    <button
                      className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                        selectedFolderId === folder.id 
                          ? 'bg-primary-700 border-primary-700 text-white' 
                          : 'border-primary-300'
                      }`}
                      onClick={() => setSelectedFolderId(folder.id)}
                    >
                      {selectedFolderId === folder.id && <Check size={14} />}
                    </button>
                    
                    <button
                      className="flex items-center gap-2 flex-1 text-left"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {expandedFolders.includes(folder.id) ? (
                        <ChevronDown size={16} className="text-primary-500" />
                      ) : (
                        <ChevronRight size={16} className="text-primary-500" />
                      )}
                      <FolderOpen size={16} className="text-primary-600" />
                      <span className="font-medium text-primary-800">{folder.name}</span>
                    </button>
                  </div>
                </div>

                {/* Folder description */}
                {expandedFolders.includes(folder.id) && folder.description && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-primary-600 ml-8">{folder.description}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-primary-600">
              <FolderOpen size={48} className="mx-auto mb-3 text-primary-300" />
              <p className="mb-2">
                {searchQuery ? `No folders found for "${searchQuery}"` : 'No folders found'}
              </p>
              <p className="text-sm text-primary-500 mb-4">Create a new folder to organize your lists</p>
            </div>
          )}

          {/* Create new folder option */}
          {showNewFolderInput ? (
            <div className="border border-accent-200 rounded-lg p-4 bg-accent-50">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={16} className="text-accent-600" />
                <span className="font-medium text-accent-800">Create New Folder</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New folder name"
                  className="input flex-1"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewFolder();
                    } else if (e.key === 'Escape') {
                      setShowNewFolderInput(false);
                      setNewFolderName('');
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateNewFolder}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-accent-200 rounded-lg bg-accent-50 p-4">
              <button
                className="flex items-center gap-2 text-accent-700 hover:text-accent-800 font-medium"
                onClick={() => setShowNewFolderInput(true)}
              >
                <Plus size={16} />
                <span>Create New Folder</span>
              </button>
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
          onClick={handleMove}
          disabled={!hasChanges || isMoving}
          isLoading={isMoving}
        >
          {isMoving ? 'Moving...' : 'Move List'}
        </Button>
      </div>
    </Modal>
  );
};

export default MoveListToFolderModal;