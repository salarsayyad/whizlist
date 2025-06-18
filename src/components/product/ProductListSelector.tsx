import { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { useListStore } from '../../store/listStore';
import { useFolderStore } from '../../store/folderStore';
import { useProductStore } from '../../store/productStore';
import Button from '../ui/Button';
import { Plus, Check, FolderOpen, ChevronDown, ChevronRight, List as ListIcon, Search, X, Copy, Move } from 'lucide-react';

interface ProductListSelectorProps {
  productId: string;
  currentListId: string | null;
  onClose: () => void;
}

const ProductListSelector = ({ productId, currentListId, onClose }: ProductListSelectorProps) => {
  const { lists, createList } = useListStore();
  const { folders, fetchFolders } = useFolderStore();
  const { moveProductToList, copyProductToList } = useProductStore();
  const [selectedListId, setSelectedListId] = useState<string | null>(currentListId);
  const [action, setAction] = useState<'move' | 'copy'>('move');
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  // Filter lists based on search query
  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) {
      return lists;
    }
    
    const query = searchQuery.toLowerCase();
    return lists.filter(list => 
      list.name.toLowerCase().includes(query) ||
      list.description?.toLowerCase().includes(query)
    );
  }, [lists, searchQuery]);

  // Filter folders that contain matching lists
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders;
    }
    
    return folders.filter(folder => {
      const folderLists = filteredLists.filter(list => list.folderId === folder.id);
      return folderLists.length > 0 || folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [folders, filteredLists, searchQuery]);

  // Auto-expand folders when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const foldersWithMatches = filteredFolders.map(folder => folder.id);
      setExpandedFolders(foldersWithMatches);
    }
  }, [searchQuery, filteredFolders]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleSave = async () => {
    try {
      if (action === 'move') {
        await moveProductToList(productId, selectedListId);
      } else {
        await copyProductToList(productId, selectedListId);
      }
      onClose();
    } catch (error) {
      console.error('Error updating product list:', error);
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

      if (action === 'move') {
        await moveProductToList(productId, newList.id);
      } else {
        await copyProductToList(productId, newList.id);
      }
      
      setNewListName('');
      setShowNewListInput(false);
      setSelectedFolderId(null);
      onClose();
    } catch (error) {
      console.error('Error creating new list:', error);
    }
  };

  const handleShowNewListInput = (folderId?: string) => {
    setSelectedFolderId(folderId || null);
    setShowNewListInput(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Group lists by folder (using filtered lists)
  const getFolderLists = (folderId: string) => {
    return filteredLists.filter(list => list.folderId === folderId);
  };

  const getUnorganizedLists = () => {
    return filteredLists.filter(list => !list.folderId);
  };

  const hasSearchResults = filteredLists.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  const currentList = lists.find(list => list.id === currentListId);
  const hasChanges = selectedListId !== currentListId;

  return (
    <Modal isOpen={true} onClose={onClose} title="Manage Product List" size="lg">
      {/* Action Type Selector */}
      <div className="mb-4">
        <div className="flex bg-primary-100 rounded-lg p-1">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              action === 'move' 
                ? 'bg-white shadow-sm text-primary-900' 
                : 'text-primary-600 hover:text-primary-800'
            }`}
            onClick={() => setAction('move')}
          >
            <Move size={16} />
            Move
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              action === 'copy' 
                ? 'bg-white shadow-sm text-primary-900' 
                : 'text-primary-600 hover:text-primary-800'
            }`}
            onClick={() => setAction('copy')}
          >
            <Copy size={16} />
            Copy
          </button>
        </div>
        <p className="text-xs text-primary-500 mt-2">
          {action === 'move' 
            ? 'Move this product to a different list' 
            : 'Create a copy of this product in another list'
          }
        </p>
      </div>

      {/* Current List Info */}
      {currentList && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            <span className="font-medium">Currently in:</span> {currentList.name}
          </p>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-primary-400" />
          </div>
          <input
            type="text"
            placeholder="Search lists and folders..."
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
          {/* Unassigned Option */}
          <div className="border border-primary-200 rounded-lg p-3">
            <div className="flex items-center">
              <button
                className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                  selectedListId === null 
                    ? 'bg-primary-700 border-primary-700 text-white' 
                    : 'border-primary-300'
                }`}
                onClick={() => setSelectedListId(null)}
              >
                {selectedListId === null && <Check size={14} />}
              </button>
              <span className="text-primary-800 font-medium">Unassigned</span>
            </div>
          </div>

          {/* Show search results or organized view */}
          {isSearching && !hasSearchResults ? (
            /* No search results */
            <div className="text-center py-8 text-primary-600">
              <Search size={48} className="mx-auto mb-3 text-primary-300" />
              <p className="mb-2">No lists found for "{searchQuery}"</p>
            </div>
          ) : (
            <>
              {/* Folders with their lists */}
              {filteredFolders.map((folder) => {
                const folderLists = getFolderLists(folder.id);
                const isExpanded = expandedFolders.includes(folder.id);
                const hasMatchingLists = folderLists.length > 0;
                
                // Don't show folders without matching lists when searching
                if (isSearching && !hasMatchingLists) {
                  return null;
                }
                
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
                        <span className="text-primary-500 text-sm">
                          ({folderLists.length} list{folderLists.length === 1 ? '' : 's'})
                        </span>
                      </button>
                      
                      {!isSearching && (
                        <button
                          className="text-accent-600 hover:text-accent-700 p-1 rounded-md hover:bg-accent-50"
                          onClick={() => handleShowNewListInput(folder.id)}
                          title="Add new list to this folder"
                        >
                          <Plus size={16} />
                        </button>
                      )}
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
                                    selectedListId === list.id 
                                      ? 'bg-primary-700 border-primary-700 text-white' 
                                      : 'border-primary-300'
                                  }`}
                                  onClick={() => setSelectedListId(list.id)}
                                >
                                  {selectedListId === list.id && <Check size={14} />}
                                </button>
                                <ListIcon size={14} className="text-primary-500 mr-2" />
                                <span className="text-primary-800">{list.name}</span>
                              </div>
                              <span className="text-primary-500 text-sm">{list.productCount} items</span>
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
                      <span className="font-medium text-primary-800">
                        {isSearching ? 'Matching Lists' : 'Unorganized Lists'}
                      </span>
                      <span className="text-primary-500 text-sm">
                        ({getUnorganizedLists().length} list{getUnorganizedLists().length === 1 ? '' : 's'})
                      </span>
                    </div>
                    
                    {!isSearching && (
                      <button
                        className="text-accent-600 hover:text-accent-700 p-1 rounded-md hover:bg-accent-50"
                        onClick={() => handleShowNewListInput()}
                        title="Add new unorganized list"
                      >
                        <Plus size={16} />
                      </button>
                    )}
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
                              selectedListId === list.id 
                                ? 'bg-primary-700 border-primary-700 text-white' 
                                : 'border-primary-300'
                            }`}
                            onClick={() => setSelectedListId(list.id)}
                          >
                            {selectedListId === list.id && <Check size={14} />}
                          </button>
                          <ListIcon size={14} className="text-primary-500 mr-2" />
                          <span className="text-primary-800">{list.name}</span>
                        </div>
                        <span className="text-primary-500 text-sm">{list.productCount} items</span>
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
                      Create & {action === 'move' ? 'Move' : 'Copy'}
                    </Button>
                  </div>
                </div>
              )}
            </>
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
          disabled={!hasChanges}
        >
          {action === 'move' ? 'Move Product' : 'Copy Product'}
        </Button>
      </div>
    </Modal>
  );
};

export default ProductListSelector;