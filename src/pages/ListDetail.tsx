import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Share2, Users, Pin, Trash2, 
  Lock, Globe, MoreHorizontal, Grid, List as ListIcon, FolderOpen 
} from 'lucide-react';
import { useListStore } from '../store/listStore';
import { useFolderStore } from '../store/folderStore';
import { useProductStore } from '../store/productStore';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import CommentSection from '../components/comment/CommentSection';
import { motion } from 'framer-motion';

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lists, togglePin, deleteList } = useListStore();
  const { folders } = useFolderStore();
  const { fetchProductsByList, products, viewMode, setViewMode } = useProductStore();
  
  const list = lists.find(l => l.id === id);
  
  // Find the folder this list belongs to
  const parentFolder = list?.folderId ? folders.find(f => f.id === list.folderId) : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(list?.name || '');
  const [description, setDescription] = useState(list?.description || '');

  // Fetch products for this list
  useEffect(() => {
    if (id) {
      fetchProductsByList(id);
    }
  }, [id]);
  
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
  
  const handleRemove = () => {
    deleteList(list.id);
    navigate('/dashboard');
  };
  
  const handleSaveEdit = () => {
    // In a real app, this would update the list
    console.log('Saving list changes:', { name, description });
    setIsEditing(false);
  };

  const handleFolderClick = () => {
    if (parentFolder) {
      navigate(`/folder/${parentFolder.id}`);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-600 hover:text-primary-800 mb-4"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back</span>
        </button>
        
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="max-w-xl">
                <input
                  type="text"
                  className="input text-xl font-medium mb-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="List name"
                />
                <textarea
                  className="input resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="List description (optional)"
                  rows={3}
                />
                <div className="mt-3 flex gap-2">
                  <Button onClick={handleSaveEdit}>Save</Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
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
                    onClick={() => setIsEditing(true)}
                    className="ml-2 text-primary-500 hover:text-primary-700 p-1 rounded-md hover:bg-primary-100"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                
                {/* Privacy indicator moved under title */}
                <div className="mt-1 mb-2">
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
                
                {list.description && (
                  <p className="text-primary-700 mt-1">{list.description}</p>
                )}
              </motion.div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            <Button
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Users size={16} />
              <span>Share</span>
            </Button>
            <Button
              variant={list.isPinned ? 'primary' : 'secondary'}
              className="flex items-center gap-1"
              onClick={() => togglePin(list.id)}
            >
              <Pin size={16} className={list.isPinned ? 'fill-white' : ''} />
              <span>{list.isPinned ? 'Pinned' : 'Pin'}</span>
            </Button>
            <Button
              variant="error"
              className="flex items-center gap-1"
              onClick={handleRemove}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </Button>
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
                  onClick={() => navigate('/dashboard')}
                  className="mx-auto"
                >
                  Browse Products
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
    </div>
  );
};

export default ListDetail;