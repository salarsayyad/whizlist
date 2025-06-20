import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Modal from '../ui/Modal';
import { extractProductDetails } from '../../lib/utils';
import { useProductStore } from '../../store/productStore';
import { useListStore } from '../../store/listStore';
import { useFolderStore } from '../../store/folderStore';
import Button from '../ui/Button';
import { Link2, ChevronDown, X, Plus, Check, FolderOpen, ChevronRight, List as ListIcon, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AddProductModalProps {
  onClose: () => void;
}

const AddProductModal = ({ onClose }: AddProductModalProps) => {
  const { id: currentListId } = useParams<{ id: string }>();
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedListIds, setSelectedListIds] = useState<string[]>(currentListId ? [currentListId] : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  const { createProduct } = useProductStore();
  const { lists, fetchLists, createList } = useListStore();
  const { folders, fetchFolders } = useFolderStore();
  
  useEffect(() => {
    fetchLists();
    fetchFolders();
  }, []);

  // Filter lists and folders based on search query
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
      setTags(tags.slice(0, -1));
    }
  };

  const toggleListSelection = (listId: string) => {
    setSelectedListIds(prev => {
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

  const handleShowNewListInput = (folderId?: string) => {
    setSelectedFolderId(folderId || null);
    setShowNewListInput(true);
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

      setSelectedListIds(prev => [...prev, newList.id]);
      setNewListName('');
      setShowNewListInput(false);
      setSelectedFolderId(null);
    } catch (error) {
      console.error('Error creating new list:', error);
    }
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { product, updateDetails } = await extractProductDetails(url);
      
      // Include user-added tags with the product
      const baseProduct = {
        ...product,
        tags: [...(product.tags || []), ...tags],
      };

      // Create products for each selected list (or one unassigned product if no lists selected)
      const listsToCreate = selectedListIds.length > 0 ? selectedListIds : [null];
      
      const createdProducts = await Promise.all(
        listsToCreate.map(async (listId) => {
          const productWithList = {
            ...baseProduct,
            listId
          };
          
          const createdProduct = await createProduct(productWithList);
          
          // Start the enhanced details extraction for each product
          updateDetails(createdProduct.id).catch(console.error);
          
          return createdProduct;
        })
      );
      
      onClose();
    } catch (err) {
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof Error) {
        if (err.message.includes('NetworkError') || err.message.includes('Failed to send')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error adding product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasSearchResults = filteredLists.length > 0;
  const isSearching = searchQuery.trim().length > 0;
  const searchQueryExists = lists.some(list => 
    list.name.toLowerCase() === searchQuery.toLowerCase().trim()
  );
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Product" size="xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-primary-700 mb-1">
              Product URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link2 size={16} className="text-primary-400" />
              </div>
              <input
                type="text"
                id="url"
                placeholder="https://www.example.com/product"
                className="input pl-10"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <p className="mt-1 text-xs text-primary-500">
              Paste a product URL from any website to save it to your Whizlist
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Tags
            </label>
            <div className="space-y-2">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-primary-500 hover:text-primary-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  className="input flex-1"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyPress}
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
            </div>
            <p className="mt-1 text-xs text-primary-500">
              Press Enter or click + to add tags. Use Backspace to remove the last tag.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-3">
              Add to Lists ({selectedListIds.length} selected)
            </label>
            
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
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-400 hover:text-primary-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {isSearching && (
                <p className="mt-1 text-xs text-primary-500">
                  {hasSearchResults 
                    ? `Found ${filteredLists.length} list${filteredLists.length === 1 ? '' : 's'}`
                    : 'No lists found matching your search'
                  }
                </p>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto border border-primary-200 rounded-lg">
              <div className="p-3 space-y-2">
                {/* Show search results or organized view */}
                {isSearching && !hasSearchResults ? (
                  /* No search results */
                  <div className="text-center py-8 text-primary-600">
                    <Search size={48} className="mx-auto mb-3 text-primary-300" />
                    <p className="mb-2">No lists found for "{searchQuery}"</p>
                    <p className="text-sm text-primary-500 mb-4">Create a new list with this name</p>
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        setNewListName(searchQuery);
                        setShowNewListInput(true);
                      }}
                      className="mx-auto"
                    >
                      <Plus size={16} className="mr-1" />
                      Create "{searchQuery}" List
                    </Button>
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
                              type="button"
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
                                type="button"
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
                                        type="button"
                                        className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                                          selectedListIds.includes(list.id) 
                                            ? 'bg-primary-700 border-primary-700 text-white' 
                                            : 'border-primary-300'
                                        }`}
                                        onClick={() => toggleListSelection(list.id)}
                                      >
                                        {selectedListIds.includes(list.id) && <Check size={14} />}
                                      </button>
                                      <ListIcon size={14} className="text-primary-500 mr-2" />
                                      <span className="text-primary-800">{list.name}</span>
                                    </div>
                                    <span className="text-primary-500 text-sm">{list.productCount || 0} items</span>
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
                              type="button"
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
                                  type="button"
                                  className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                                    selectedListIds.includes(list.id) 
                                      ? 'bg-primary-700 border-primary-700 text-white' 
                                      : 'border-primary-300'
                                  }`}
                                  onClick={() => toggleListSelection(list.id)}
                                >
                                  {selectedListIds.includes(list.id) && <Check size={14} />}
                                </button>
                                <ListIcon size={14} className="text-primary-500 mr-2" />
                                <span className="text-primary-800">{list.name}</span>
                              </div>
                              <span className="text-primary-500 text-sm">{list.productCount || 0} items</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Create new list option when searching (even with results) */}
                    {isSearching && searchQuery.trim() && !searchQueryExists && (
                      <div className="border border-accent-200 rounded-lg bg-accent-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Plus size={16} className="text-accent-600" />
                            <span className="text-accent-800 font-medium">
                              Create "{searchQuery}" list
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            onClick={() => {
                              setNewListName(searchQuery);
                              setShowNewListInput(true);
                            }}
                          >
                            Create & Select
                          </Button>
                        </div>
                        <p className="text-accent-600 text-sm mt-1 ml-6">
                          Create a new list with this name and add it to selection
                        </p>
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
                                e.preventDefault();
                                handleCreateNewList();
                              } else if (e.key === 'Escape') {
                                setShowNewListInput(false);
                                setNewListName('');
                                setSelectedFolderId(null);
                              }
                            }}
                          />
                          <Button
                            type="button"
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
                            type="button"
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
                    {!isSearching && folders.length === 0 && getUnorganizedLists().length === 0 && (
                      <div className="text-center py-8 text-primary-600">
                        <ListIcon size={48} className="mx-auto mb-3 text-primary-300" />
                        <p className="mb-4">No lists found. Create your first list!</p>
                        <Button
                          type="button"
                          variant="accent"
                          onClick={() => handleShowNewListInput()}
                          className="mx-auto"
                        >
                          <Plus size={16} className="mr-1" />
                          Create First List
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs text-primary-500">
              {selectedListIds.length === 0 
                ? "Product will be unassigned if no lists are selected"
                : `Product will be added to ${selectedListIds.length} list${selectedListIds.length === 1 ? '' : 's'} as separate copies`
              }
            </p>
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
            disabled={!url.trim() || isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;