import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Share2, Users, Pin, Trash2, 
  Lock, Globe, MoreHorizontal, Grid, List as ListIcon, FolderOpen, Plus 
} from 'lucide-react';
import { useListStore } from '../store/listStore';
import { useFolderStore } from '../store/folderStore';
import { useProductStore } from '../store/productStore';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import EditListModal from '../components/list/EditListModal';
import AddProductModal from '../components/product/AddProductModal';
import CommentSection from '../components/comment/CommentSection';
import { motion } from 'framer-motion';

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lists, deleteList, isLoading: listLoading } = useListStore();
  const { folders } = useFolderStore();
  const { fetchProductsByList, products, viewMode, setViewMode } = useProductStore();
  
  const list = lists.find(l => l.id === id);
  
  // Find the folder this list belongs to
  const parentFolder = list?.folderId ? folders.find(f => f.id === list.folderId) : null;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Fetch products for this list
  useEffect(() => {
    if (id) {
      fetchProductsByList(id);
    }
  }, [id, fetchProductsByList]);
  
  if (!list) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-primary-700 mb-2">List not found</h2>
        <p className="text-primary-600 mb-6">The list you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => navigate('/dashboard')}
          variant="secondary"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to delete this list? All products in this list will be moved to unassigned.')) {
      try {
        await deleteList(list.id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
  };

  const handleFolderClick = () => {
    if (parentFolder) {
      navigate(`/folder/${parentFolder.id}`);
    }
  };
  
  return (
    <div className="pb-24"> {/* Add bottom padding to prevent content from being hidden behind floating menu */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Folder Breadcrumb */}
              {parentFolder && (
                <div className="mb-2">
                  <button
                    onClick={handleFolderClick}
                    className="flex items-center text-primary-600 hover:text-primary-800 transition-colors group"
                  >
                    <FolderOpen size={16} className="mr-1 group-hover:text-primary-700" />
                    <span className="text-sm font-medium group-hover:underline">
                      {parentFolder.name}
                    </span>
                  </button>
                </div>
              )}

              <div className="flex items-center">
                <h1 className="text-2xl font-medium text-primary-900">{list.name}</h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="ml-2 text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100"
                  disabled={listLoading}
                >
                  <Edit2 size={16} />
                </button>
              </div>
              
              {/* Description moved under title */}
              {list.description && (
                <p className="text-primary-600 text-sm mt-2">{list.description}</p>
              )}
              
              {/* List and Privacy indicators moved under description */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-200 text-primary-800">
                    <ListIcon size={10} />
                    <span>List</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                    {list.isPublic ? (
                      <>
                        <Globe size={12} />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={12} />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-primary-900">
                Products ({products.length})
              </h2>
              
              <div className="flex items-center gap-3">
                <div className="flex bg-primary-100 rounded-md p-1">
                  <button
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-soft' : 'text-primary-600 hover:text-primary-800'}`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
                
                <Button 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <MoreHorizontal size={16} />
                  <span>More</span>
                </Button>
              </div>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-16 card p-8">
                <h3 className="text-xl font-medium text-primary-700 mb-2">No products in this list yet</h3>
                <p className="text-primary-600 mb-6">Add products to this list to start organizing.</p>
                <Button 
                  onClick={() => setShowAddProductModal(true)}
                  className="mx-auto flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6">
            <CommentSection 
              entityType="list"
              entityId={list.id}
              title={`List Comments (${0})`}
            />
          </div>
        </div>
      </div>

      {/* Fixed Floating Actions Menu - Positioned at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* Main content area container - positioned to match main content */}
        <div className="md:ml-64 p-4 md:p-6 pointer-events-auto">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="bg-white border border-primary-200 shadow-elevated"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="p-3">
                {/* Mobile: Scrollable horizontal layout with icons only */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:hidden">
                  <Button
                    variant="accent"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    onClick={() => setShowAddProductModal(true)}
                    title="Add Product"
                  >
                    <Plus size={20} />
                  </Button>
                  
                  <Button
                    variant={list.isPinned ? 'primary' : 'secondary'}
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    onClick={() => {/* togglePin(list.id) */}}
                    title={list.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={20} className={list.isPinned ? 'fill-white' : ''} />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-12 h-12 p-0"
                    title="Share"
                  >
                    <Users size={20} />
                  </Button>
                  
                  <Button
                    variant="error"
                    className="flex items-center justify-center whitespace-nowrap flex-shrink-0 w-10 h-12 p-0"
                    onClick={handleRemove}
                    disabled={listLoading}
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>

                {/* Desktop: Grid layout with text */}
                <div className="hidden sm:grid grid-cols-4 gap-3">
                  <Button
                    variant="accent"
                    className="flex items-center justify-center gap-2 w-full"
                    onClick={() => setShowAddProductModal(true)}
                  >
                    <Plus size={16} />
                    <span>Add Product</span>
                  </Button>
                  
                  <Button
                    variant={list.isPinned ? 'primary' : 'secondary'}
                    className="flex items-center justify-center gap-2 w-full"
                    onClick={() => {/* togglePin(list.id) */}}
                  >
                    <Pin size={16} className={list.isPinned ? 'fill-white' : ''} />
                    <span>{list.isPinned ? 'Pinned' : 'Pin'}</span>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <Users size={16} />
                    <span>Share</span>
                  </Button>
                  
                  <Button
                    variant="error"
                    className="flex items-center justify-center w-12 h-9"
                    onClick={handleRemove}
                    disabled={listLoading}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditListModal
          list={list}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showAddProductModal && (
        <AddProductModal onClose={() => setShowAddProductModal(false)} />
      )}
    </div>
  );
};

export default ListDetail;