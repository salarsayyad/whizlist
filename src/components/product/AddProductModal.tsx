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
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedListIds, setSelectedListIds] = useState<string[]>(currentListId ? [currentListId] : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newlyCreatedListId, setNewlyCreatedListId] = useState<string | null>(null);
  
  const { createProduct, products } = useProductStore();
  const { lists, fetchLists, createList } = useListStore();
  const { folders, fetchFolders } = useFolderStore();
  
  useEffect(() => {
    fetchLists();
    fetchFolders();
  }, []);

  // Get all existing tags from products
  const existingTags = useMemo(() => {
    const allTags = new Set<string>();
    products.forEach(product => {
      if (Array.isArray(product.tags)) {
        product.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }, [products]);

  // Filter tag suggestions based on input
  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    
    const query = tagInput.toLowerCase();
    return existingTags
      .filter(tag => 
        tag.toLowerCase().includes(query) && 
        !tags.includes(tag) // Don't suggest already added tags
      )
      .slice(0, 5); // Limit to 5 suggestions
  }, [tagInput, existingTags, tags]);

  // Reset selected suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [tagSuggestions]);

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
  
  const handleAddTag = (tagToAdd?: string) => {
    const trimmedTag = (tagToAdd || tagInput).trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (showTagSuggestions && tagSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < tagSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : tagSuggestions.length - 1
        );
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < tagSuggestions.length) {
          handleAddTag(tagSuggestions[selectedSuggestionIndex]);
        } else {
          handleAddTag();
        }
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleTagInputFocus = () => {
    if (tagInput.trim().length > 0) {
      setShowTagSuggestions(true);
    }
  };

  const handleTagInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
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
      setNewlyCreatedListId(newList.id);
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
      
      // If we have a newly created list, handle it first to avoid race condition
      if (newlyCreatedListId && selectedListIds.includes(newlyCreatedListId)) {
        // Create product for the newly created list first
        const productWithNewList = {
          ...baseProduct,
          listId: newlyCreatedListId
        };
        
        const createdProduct = await createProduct(productWithNewList);
        
        // Start the enhanced details extraction for this product
        updateDetails(createdProduct.id).catch(console.error);
        
        // Remove the newly created list from the remaining lists to process
        const remainingListIds = listsToCreate.filter(id => id !== newlyCreatedListId);
        
        // Create products for remaining lists concurrently
        if (remainingListIds.length > 0) {
          await Promise.all(
            remainingListIds.map(async (listId) => {
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
        }
      } else {
        // No newly created list, proceed with concurrent creation
        await Promise.all(
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
      }
      
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
              
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Add a tag..."
                      className="input w-full"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyPress}
                      onFocus={handleTagInputFocus}
                      onBlur={handleTagInputBlur}
                    />
                    
                    {/* Tag suggestions dropdown */}
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-primary-300 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                        {tagSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm focus:outline-none transition-colors",
                              index === selectedSuggestionIndex
                                ? "bg-primary-100 text-primary-900"
                                : "hover:bg-primary-50 text-primary-800"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              handleSuggestionClick(suggestion);
                            }}
                            onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddTag()}
                    disabled={!tagInput.trim() || tags.includes(tagInput.trim())}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </div>
            <p className="mt-1 text-xs text-primary-500">
              Press Enter or click + to add tags. Use ↑↓ arrows to navigate suggestions. Use Backspace to remove the last tag.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Add to Lists ({selectedListIds.length} selected)
            </label>
            
            {/* Search Input */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-primary-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search lists and folders..."
                  className="w-full px-3 py-2 pl-9 pr-9 text-sm border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-400 hover:text-primary-600"
                  >
                    <X size={14} />
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

            <div className="max-h-64 overflow-y-auto border border-primary-200 rounded-md">
              <div className="p-2 space-y-1">
                {/* Show search results or organized view */}
                {isSearching && !hasSearchResults ? (
                  /* No search results */
                  <div className="text-center py-6 text-primary-600">
                    <Search size={32} className="mx-auto mb-2 text-primary-300" />
                    <p className="mb-1 text-sm">No lists found for "{searchQuery}"</p>
                    <p className="text-xs text-primary-500 mb-3">Create a new list with this name</p>
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
                      <Plus size={14} className="mr-1" />
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
                        <div key={folder.id} className="border border-primary-200 rounded-md">
                          {/* Folder header */}
                          <div className="flex items-center justify-between p-2 bg-primary-50 rounded-t-md">
                            <button
                              type="button"
                              className="flex items-center gap-2 flex-1 text-left"
                              onClick={() => toggleFolder(folder.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown size={14} className="text-primary-500" />
                              ) : (
                                <ChevronRight size={14} className="text-primary-500" />
                              )}
                              <FolderOpen size={14} className="text-primary-600" />
                              <span className="text-sm font-medium text-primary-800">{folder.name}</span>
                              <span className="text-primary-500 text-xs">
                                ({folderLists.length})
                              </span>
                            </button>
                            
                            {!isSearching && (
                              <button
                                type="button"
                                className="text-accent-600 hover:text-accent-700 p-1 rounded hover:bg-accent-50"
                                onClick={() => handleShowNewListInput(folder.id)}
                                title="Add new list to this folder"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>

                          {/* Folder lists */}
                          {isExpanded && (
                            <div className="p-1 space-y-0.5">
                              {folderLists.length > 0 ? (
                                folderLists.map((list) => (
                                  <div 
                                    key={list.id}
                                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-primary-50"
                                  >
                                    <div className="flex items-center">
                                      <button
                                        type="button"
                                        className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${
                                          selectedListIds.includes(list.id) 
                                            ? 'bg-primary-700 border-primary-700 text-white' 
                                            : 'border-primary-300'
                                        }`}
                                        onClick={() => toggleListSelection(list.id)}
                                      >
                                        {selectedListIds.includes(list.id) && <Check size={10} />}
                                      </button>
                                      <ListIcon size={12} className="text-primary-500 mr-1.5" />
                                      <span className="text-sm text-primary-800">{list.name}</span>
                                    </div>
                                    <span className="text-primary-500 text-xs">{list.productCount || 0}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-3 text-primary-500 text-xs">
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
                      <div className="border border-primary-200 rounded-md">
                        <div className="flex items-center justify-between p-2 bg-primary-50 rounded-t-md">
                          <div className="flex items-center gap-2">
                            <ListIcon size={14} className="text-primary-600" />
                            <span className="text-sm font-medium text-primary-800">
                              {isSearching ? 'Matching Lists' : 'Unorganized Lists'}
                            </span>
                            <span className="text-primary-500 text-xs">
                              ({getUnorganizedLists().length})
                            </span>
                          </div>
                          
                          {!isSearching && (
                            <button
                              type="button"
                              className="text-accent-600 hover:text-accent-700 p-1 rounded hover:bg-accent-50"
                              onClick={() => handleShowNewListInput()}
                              title="Add new unorganized list"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>

                        <div className="p-1 space-y-0.5">
                          {getUnorganizedLists().map((list) => (
                            <div 
                              key={list.id}
                              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-primary-50"
                            >
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${
                                    selectedListIds.includes(list.id) 
                                      ? 'bg-primary-700 border-primary-700 text-white' 
                                      : 'border-primary-300'
                                  }`}
                                  onClick={() => toggleListSelection(list.id)}
                                >
                                  {selectedListIds.includes(list.id) && <Check size={10} />}
                                </button>
                                <ListIcon size={12} className="text-primary-500 mr-1.5" />
                                <span className="text-sm text-primary-800">{list.name}</span>
                              </div>
                              <span className="text-primary-500 text-xs">{list.productCount || 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Create new list option when searching (even with results) */}
                    {isSearching && searchQuery.trim() && !searchQueryExists && (
                      <div className="border border-accent-200 rounded-md bg-accent-50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Plus size={14} className="text-accent-600" />
                            <span className="text-accent-800 text-sm font-medium">
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
                        <p className="text-accent-600 text-xs mt-1 ml-5">
                          Create a new list with this name and add it to selection
                        </p>
                      </div>
                    )}

                    {/* New list input */}
                    {showNewListInput && (
                      <div className="border border-accent-200 rounded-md p-3 bg-accent-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Plus size={14} className="text-accent-600" />
                          <span className="text-sm font-medium text-accent-800">
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
                            className="flex-1 px-2 py-1.5 text-sm border border-accent-300 rounded focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
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
                      <div className="text-center py-6 text-primary-600">
                        <ListIcon size={32} className="mx-auto mb-2 text-primary-300" />
                        <p className="mb-3 text-sm">No lists found. Create your first list!</p>
                        <Button
                          type="button"
                          variant="accent"
                          size="sm"
                          onClick={() => handleShowNewListInput()}
                          className="mx-auto"
                        >
                          <Plus size={14} className="mr-1" />
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