import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useCommentStore } from '../../store/commentStore';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentSectionProps {
  entityType: 'product' | 'folder' | 'list';
  entityId: string;
  title?: string;
  hideTitle?: boolean; // New prop to hide the title
}

const CommentSection = ({ entityType, entityId, title, hideTitle = false }: CommentSectionProps) => {
  const { comments, isLoading, fetchComments, clearComments } = useCommentStore();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchComments(entityType, entityId);
    
    return () => {
      clearComments();
    };
  }, [entityType, entityId]);

  const handleReply = (parentId: string, replyToCommentId: string) => {
    setReplyingTo(replyToCommentId);
  };

  const handleReplyCancel = () => {
    setReplyingTo(null);
  };

  const getEntityName = () => {
    switch (entityType) {
      case 'product': return 'product';
      case 'folder': return 'folder';
      case 'list': return 'list';
      default: return 'item';
    }
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {!hideTitle && (
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <MessageSquare size={18} className="text-primary-700" />
          <h2 className="text-lg font-medium text-primary-900">
            {title || `Comments (${comments.length})`}
          </h2>
        </div>
      )}

      {/* Comments list - scrollable area */}
      <div className="flex-1 overflow-y-auto mb-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-primary-600">
            <MessageSquare size={48} className="mx-auto mb-3 text-primary-300" />
            <p>No comments yet. Be the first to comment on this {getEntityName()}!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                entityType={entityType}
                entityId={entityId}
                replyingTo={replyingTo}
                onReply={handleReply}
                onReplyCancel={handleReplyCancel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed comment input at bottom */}
      <div className="border-t border-primary-200 pt-4 flex-shrink-0 bg-white">
        <CommentForm 
          entityType={entityType}
          entityId={entityId}
        />
      </div>
    </div>
  );
};

export default CommentSection;