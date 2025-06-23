import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCommentStore } from '../../store/commentStore';
import Button from '../ui/Button';

interface CommentFormProps {
  entityType: 'product' | 'folder' | 'list';
  entityId: string;
  parentId?: string;
  placeholder?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const CommentForm = ({ 
  entityType,
  entityId, 
  parentId, 
  placeholder = "Add a comment...", 
  onSubmit,
  onCancel,
  autoFocus = false
}: CommentFormProps) => {
  const { user } = useAuthStore();
  const { createComment, isLoading } = useCommentStore();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Adjust height when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    try {
      await createComment(entityType, entityId, content.trim(), parentId);
      setContent('');
      onSubmit?.();
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-primary-600">
        Please log in to leave a comment.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-shrink-0">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata?.full_name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-sm font-medium">
            {getInitials(user.user_metadata?.full_name)}
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full p-3 pr-12 border border-primary-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] max-h-32 overflow-y-auto"
            rows={1}
            style={{ height: '44px' }}
          />
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="absolute bottom-2 right-2 p-1.5 text-primary-500 hover:text-primary-700 disabled:text-primary-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>

        {parentId && (
          <div className="flex gap-2 mt-2">
            <Button 
              type="submit" 
              size="sm" 
              disabled={!content.trim() || isLoading}
              isLoading={isLoading}
            >
              Reply
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                size="sm" 
                variant="secondary" 
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Helper text */}
        <p className="text-xs text-primary-500 mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </form>
  );
};

export default CommentForm;