import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  List as ListIcon, 
  FolderOpen, 
  Tag, 
  Search,
  ExternalLink,
  Pin
} from 'lucide-react';
import { useProductStore } from '../../store/productStore';
import { useListStore } from '../../store/listStore';
import { useFolderStore } from '../../store/folderStore';
import { motion } from 'framer-motion';

interface SearchResultsProps {
  query: string;
  onResultClick: () => void;
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
}

interface SearchResult {
  id: string;
  type: 'product' | 'list' | 'folder' | 'tag';
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  isPinned?: boolean;
  itemCount?: number;
  matchedIn?: string[];
}

const SearchResults = ({ query, onResultClick, selectedIndex = -1, onSelectedIndexChange }: SearchResultsProps) => {
  const navigate = useNavigate();
  const { products } = useProductStore();
  const { lists } = useListStore();
  const { folders } = useFolderStore();

  const searchResults = useMemo(() => {
    if (!query.trim()) return { products: [], lists: [], folders: [], tags: [], allResults: [] };

    const searchTerm = query.toLowerCase().trim();
    const results: {
      products: SearchResult[];
      lists: SearchResult[];
      folders: SearchResult[];
      tags: SearchResult[];
      allResults: SearchResult[];
    } = {
      products: [],
      lists: [],
      folders: [],
      tags: [],
      allResults: []
    };

    // Search Products
    products.forEach(product => {
      const matchedIn: string[] = [];
      let isMatch = false;

      // Check title
      if (product.title.toLowerCase().includes(searchTerm)) {
        matchedIn.push('title');
        isMatch = true;
      }

      // Check description
      if (product.description?.toLowerCase()?.includes(searchTerm)) {
        matchedIn.push('description');
        isMatch = true;
      }

      // Check tags - ensure product.tags is always an array
      const productTags = Array.isArray(product.tags) ? product.tags : [];
      const matchingTags = productTags.filter(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      if (matchingTags.length > 0) {
        matchedIn.push('tags');
        isMatch = true;
      }

      // Check URL domain
      try {
        const domain = new URL(product.productUrl).hostname;
        if (domain.toLowerCase().includes(searchTerm)) {
          matchedIn.push('website');
          isMatch = true;
        }
      } catch (e) {
        // Invalid URL, skip domain check
      }

      if (isMatch) {
        const result: SearchResult = {
          id: product.id,
          type: 'product',
          title: product.title,
          subtitle: product.price || undefined,
          description: product.description || undefined,
          url: product.productUrl,
          isPinned: product.isPinned,
          matchedIn
        };
        results.products.push(result);
        results.allResults.push(result);
      }
    });

    // Search Lists
    lists.forEach(list => {
      const matchedIn: string[] = [];
      let isMatch = false;

      // Check name
      if (list.name.toLowerCase().includes(searchTerm)) {
        matchedIn.push('name');
        isMatch = true;
      }

      // Check description
      if (list.description?.toLowerCase()?.includes(searchTerm)) {
        matchedIn.push('description');
        isMatch = true;
      }

      if (isMatch) {
        const result: SearchResult = {
          id: list.id,
          type: 'list',
          title: list.name,
          description: list.description || undefined,
          itemCount: list.productCount || 0,
          matchedIn
        };
        results.lists.push(result);
        results.allResults.push(result);
      }
    });

    // Search Folders
    folders.forEach(folder => {
      const matchedIn: string[] = [];
      let isMatch = false;

      // Check name
      if (folder.name.toLowerCase().includes(searchTerm)) {
        matchedIn.push('name');
        isMatch = true;
      }

      // Check description
      if (folder.description?.toLowerCase()?.includes(searchTerm)) {
        matchedIn.push('description');
        isMatch = true;
      }

      if (isMatch) {
        const folderLists = lists.filter(list => list.folderId === folder.id);
        const result: SearchResult = {
          id: folder.id,
          type: 'folder',
          title: folder.name,
          description: folder.description || undefined,
          itemCount: folderLists.length,
          matchedIn
        };
        results.folders.push(result);
        results.allResults.push(result);
      }
    });

    // Search Tags (collect unique tags that match) - ensure product.tags is always an array
    const allTags = new Set<string>();
    products.forEach(product => {
      const productTags = Array.isArray(product.tags) ? product.tags : [];
      productTags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTerm)) {
          allTags.add(tag);
        }
      });
    });

    Array.from(allTags).forEach(tag => {
      const productsWithTag = products.filter(product => {
        const productTags = Array.isArray(product.tags) ? product.tags : [];
        return productTags.some(t => t.toLowerCase() === tag.toLowerCase());
      });

      const result: SearchResult = {
        id: tag,
        type: 'tag',
        title: tag,
        itemCount: productsWithTag.length,
        matchedIn: ['tag']
      };
      results.tags.push(result);
      results.allResults.push(result);
    });

    // Sort results by relevance (pinned first, then alphabetical)
    const sortResults = (a: SearchResult, b: SearchResult) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.title.localeCompare(b.title);
    };

    results.products.sort(sortResults);
    results.lists.sort(sortResults);
    results.folders.sort(sortResults);
    results.tags.sort((a, b) => b.itemCount! - a.itemCount!); // Sort tags by usage

    return results;
  }, [query, products, lists, folders]);

  const handleResultClick = (result: SearchResult, index?: number) => {
    console.log('🔍 Search result clicked:', result);
    
    // Update selected index if provided
    if (typeof index === 'number' && onSelectedIndexChange) {
      onSelectedIndexChange(index);
    }
    
    // Navigate based on result type
    let targetPath = '';
    switch (result.type) {
      case 'product':
        targetPath = `/product/${result.id}`;
        break;
      case 'list':
        targetPath = `/list/${result.id}`;
        break;
      case 'folder':
        targetPath = `/folder/${result.id}`;
        break;
      case 'tag':
        targetPath = `/tag/${encodeURIComponent(result.id)}`;
        break;
    }
    
    console.log('🚀 Navigating to:', targetPath);
    
    // Navigate immediately, then close search results
    if (targetPath) {
      try {
        navigate(targetPath);
        console.log('✅ Navigation successful');
        // Close search results after successful navigation
        onResultClick();
      } catch (error) {
        console.error('❌ Navigation failed:', error);
        // Close search results even if navigation fails
        onResultClick();
      }
    } else {
      // Close search results if no valid path
      onResultClick();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!searchResults.allResults.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = selectedIndex < searchResults.allResults.length - 1 ? selectedIndex + 1 : 0;
          onSelectedIndexChange?.(nextIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : searchResults.allResults.length - 1;
          onSelectedIndexChange?.(prevIndex);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < searchResults.allResults.length) {
            handleResultClick(searchResults.allResults[selectedIndex], selectedIndex);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onResultClick();
          break;
      }
    };

    // Only add event listener if search results are visible
    if (searchResults.allResults.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedIndex, searchResults.allResults, onSelectedIndexChange, onResultClick]);

  const totalResults = searchResults.allResults.length;

  if (totalResults === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-elevated border border-primary-200 p-4 z-50">
        <div className="text-center py-4">
          <Search size={32} className="mx-auto text-primary-300 mb-2" />
          <p className="text-primary-600">No results found for "{query}"</p>
          <p className="text-primary-500 text-sm mt-1">
            Try searching for products, lists, folders, or tags
          </p>
        </div>
      </div>
    );
  }

  // Helper function to get the global index of a result
  const getGlobalIndex = (sectionResults: SearchResult[], localIndex: number): number => {
    let globalIndex = 0;
    
    // Add products count
    if (sectionResults === searchResults.lists) {
      globalIndex += searchResults.products.length;
    } else if (sectionResults === searchResults.folders) {
      globalIndex += searchResults.products.length + searchResults.lists.length;
    } else if (sectionResults === searchResults.tags) {
      globalIndex += searchResults.products.length + searchResults.lists.length + searchResults.folders.length;
    }
    
    return globalIndex + localIndex;
  };

  return (
    <motion.div 
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-elevated border border-primary-200 max-h-96 overflow-y-auto z-50"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-2">
        {/* Header */}
        <div className="px-3 py-2 border-b border-primary-100">
          <p className="text-sm text-primary-600">
            Found {totalResults} result{totalResults === 1 ? '' : 's'} for "{query}"
          </p>
          <p className="text-xs text-primary-500 mt-1">
            Use ↑↓ arrows to navigate, Enter to select, Esc to close
          </p>
        </div>

        {/* Products */}
        {searchResults.products.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Products ({searchResults.products.length})
            </div>
            {searchResults.products.map((result, index) => {
              const globalIndex = getGlobalIndex(searchResults.products, index);
              const isSelected = selectedIndex === globalIndex;
              
              return (
                <button
                  key={result.id}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                    isSelected 
                      ? 'bg-primary-100 text-primary-900' 
                      : 'hover:bg-primary-50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResultClick(result, globalIndex);
                  }}
                  onMouseEnter={() => onSelectedIndexChange?.(globalIndex)}
                >
                  <div className="flex-shrink-0">
                    <Package size={16} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary-900 truncate">
                        {result.title}
                      </p>
                      {result.isPinned && (
                        <Pin size={12} className="text-primary-600 fill-current" />
                      )}
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-primary-600">{result.subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-primary-500">
                        Matched in: {result.matchedIn?.join(', ')}
                      </p>
                      {result.url && (
                        <ExternalLink size={10} className="text-primary-400" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Lists */}
        {searchResults.lists.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Lists ({searchResults.lists.length})
            </div>
            {searchResults.lists.map((result, index) => {
              const globalIndex = getGlobalIndex(searchResults.lists, index);
              const isSelected = selectedIndex === globalIndex;
              
              return (
                <button
                  key={result.id}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                    isSelected 
                      ? 'bg-primary-100 text-primary-900' 
                      : 'hover:bg-primary-50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResultClick(result, globalIndex);
                  }}
                  onMouseEnter={() => onSelectedIndexChange?.(globalIndex)}
                >
                  <div className="flex-shrink-0">
                    <ListIcon size={16} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 truncate">
                      {result.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-primary-500">
                        {result.itemCount} item{result.itemCount === 1 ? '' : 's'}
                      </p>
                      <span className="text-xs text-primary-400">•</span>
                      <p className="text-xs text-primary-500">
                        Matched in: {result.matchedIn?.join(', ')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Folders */}
        {searchResults.folders.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Folders ({searchResults.folders.length})
            </div>
            {searchResults.folders.map((result, index) => {
              const globalIndex = getGlobalIndex(searchResults.folders, index);
              const isSelected = selectedIndex === globalIndex;
              
              return (
                <button
                  key={result.id}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                    isSelected 
                      ? 'bg-primary-100 text-primary-900' 
                      : 'hover:bg-primary-50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResultClick(result, globalIndex);
                  }}
                  onMouseEnter={() => onSelectedIndexChange?.(globalIndex)}
                >
                  <div className="flex-shrink-0">
                    <FolderOpen size={16} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 truncate">
                      {result.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-primary-500">
                        {result.itemCount} list{result.itemCount === 1 ? '' : 's'}
                      </p>
                      <span className="text-xs text-primary-400">•</span>
                      <p className="text-xs text-primary-500">
                        Matched in: {result.matchedIn?.join(', ')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tags */}
        {searchResults.tags.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Tags ({searchResults.tags.length})
            </div>
            {searchResults.tags.map((result, index) => {
              const globalIndex = getGlobalIndex(searchResults.tags, index);
              const isSelected = selectedIndex === globalIndex;
              
              return (
                <button
                  key={result.id}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                    isSelected 
                      ? 'bg-primary-100 text-primary-900' 
                      : 'hover:bg-primary-50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResultClick(result, globalIndex);
                  }}
                  onMouseEnter={() => onSelectedIndexChange?.(globalIndex)}
                >
                  <div className="flex-shrink-0">
                    <Tag size={16} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 truncate">
                      #{result.title}
                    </p>
                    <p className="text-xs text-primary-500 mt-1">
                      Used in {result.itemCount} product{result.itemCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchResults;