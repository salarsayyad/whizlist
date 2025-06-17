import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useCommentStore } from '../../store/commentStore';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentSectionProps {
  productId: string;
}

const CommentSection = ({ productId }: CommentSectionProps) => {
  const { comments, isLoading, fetchComments, clearComments } = useCommentStore();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchComments(productId);
    
    return () => {
      clearComments();
    };
  }, [productId]);

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const handleReplySubmit = () => {
    setReplyingTo(null);
  };

  const handleReplyCancel = () => {
    setReplyingTo(null);
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-primary-700" />
        <h2 className="text-lg font-medium text-primary-900">
          Comments ({comments.length})
        </h2>
      </div>

      <CommentForm productId={productId} />

      {comments.length === 0 ? (
        <div className="text-center py-8 text-primary-600">
          <MessageSquare size={48} className="mx-auto mb-3 text-primary-300" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                productId={productId}
                onReply={handleReply}
              />
              
              {replyingTo === comment.id && (
                <div className="ml-11 mt-3">
                  <CommentForm
                    productId={productId}
                    parentId={comment.id}
                    placeholder="Write a reply..."
                    onSubmit={handleReplySubmit}
                    onCancel={handleReplyCancel}
                    autoFocus
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;