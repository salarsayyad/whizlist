import { useMemo } from 'react';
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

const SearchResults = ({ query, onResultClick }: SearchResultsProps) => {
  const navigate = useNavigate();
  const { products } = useProductStore();
  const { lists } = useListStore();
  const { folders } = useFolderStore();

  const searchResults = useMemo(() => {
    if (!query.trim()) return { products: [], lists: [], folders: [], tags: [] };

    const searchTerm = query.toLowerCase().trim();
    const results: {
      products: SearchResult[];
      lists: SearchResult[];
      folders: SearchResult[];
      tags: SearchResult[];
    } = {
      products: [],
      lists: [],
      folders: [],
      tags: []
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
      if (product.description?.toLowerCase().includes(searchTerm)) {
        matchedIn.push('description');
        isMatch = true;
      }

      // Check tags
      const matchingTags = product.tags.filter(tag => 
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
        results.products.push({
          id: product.id,
          type: 'product',
          title: product.title,
          subtitle: product.price || undefined,
          description: product.description || undefined,
          url: product.productUrl,
          isPinned: product.isPinned,
          matchedIn
        });
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
      if (list.description?.toLowerCase().includes(searchTerm)) {
        matchedIn.push('description');
        isMatch = true;
      }

      if (isMatch) {
        results.lists.push({
          id: list.id,
          type: 'list',
          title: list.name,
          description: list.description || undefined,
          itemCount: list.products.length,
          matchedIn
        });
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
      if (folder.description?.toLowerCase().includes(searchTerm)) {
        matchedIn.push('description');
        isMatch = true;
      }

      if (isMatch) {
        const folderLists = lists.filter(list => list.folderId === folder.id);
        results.folders.push({
          id: folder.id,
          type: 'folder',
          title: folder.name,
          description: folder.description || undefined,
          itemCount: folderLists.length,
          matchedIn
        });
      }
    });

    // Search Tags (collect unique tags that match)
    const allTags = new Set<string>();
    products.forEach(product => {
      product.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTerm)) {
          allTags.add(tag);
        }
      });
    });

    Array.from(allTags).forEach(tag => {
      const productsWithTag = products.filter(product => 
        product.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );

      results.tags.push({
        id: tag,
        type: 'tag',
        title: tag,
        itemCount: productsWithTag.length,
        matchedIn: ['tag']
      });
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

  const handleResultClick = (result: SearchResult) => {
    console.log('🔍 Search result clicked:', result);
    
    // Close search results immediately
    onResultClick();
    
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
        targetPath = '/dashboard';
        break;
    }
    
    console.log('🚀 Navigating to:', targetPath);
    
    // Try multiple navigation approaches
    try {
      // Method 1: React Router navigate
      navigate(targetPath);
      console.log('✅ React Router navigation attempted');
    } catch (error) {
      console.error('❌ React Router navigation failed:', error);
      
      // Method 2: Fallback to window.location
      try {
        window.location.href = targetPath;
        console.log('✅ Window location navigation attempted');
      } catch (locationError) {
        console.error('❌ Window location navigation failed:', locationError);
      }
    }
  };

  const totalResults = 
    searchResults.products.length + 
    searchResults.lists.length + 
    searchResults.folders.length + 
    searchResults.tags.length;

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
        </div>

        {/* Products */}
        {searchResults.products.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Products ({searchResults.products.length})
            </div>
            {searchResults.products.map((result) => (
              <button
                key={result.id}
                className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-md flex items-center gap-3 transition-colors"
                onClick={() => handleResultClick(result)}
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
            ))}
          </div>
        )}

        {/* Lists */}
        {searchResults.lists.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Lists ({searchResults.lists.length})
            </div>
            {searchResults.lists.map((result) => (
              <button
                key={result.id}
                className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-md flex items-center gap-3 transition-colors"
                onClick={() => handleResultClick(result)}
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
            ))}
          </div>
        )}

        {/* Folders */}
        {searchResults.folders.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Folders ({searchResults.folders.length})
            </div>
            {searchResults.folders.map((result) => (
              <button
                key={result.id}
                className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-md flex items-center gap-3 transition-colors"
                onClick={() => handleResultClick(result)}
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
            ))}
          </div>
        )}

        {/* Tags */}
        {searchResults.tags.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-primary-500 uppercase tracking-wide">
              Tags ({searchResults.tags.length})
            </div>
            {searchResults.tags.map((result) => (
              <button
                key={result.id}
                className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-md flex items-center gap-3 transition-colors"
                onClick={() => handleResultClick(result)}
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
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchResults;