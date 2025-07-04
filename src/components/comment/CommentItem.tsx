import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Reply, Edit2, Trash2, ThumbsUp } from 'lucide-react';
import { Comment } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCommentStore } from '../../store/commentStore';
import { Menu } from '@headlessui/react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import CommentForm from './CommentForm';
import ConfirmationModal from '../ui/ConfirmationModal';

interface CommentItemProps {
  comment: Comment;
  entityType: 'product' | 'folder' | 'list';
  entityId: string;
  depth?: number;
  replyingTo?: string | null;
  onReply?: (parentId: string, replyToCommentId: string) => void;
  onReplyCancel?: () => void;
}

const CommentItem = ({ comment, entityType, entityId, depth = 0, replyingTo, onReply, onReplyCancel }: CommentItemProps) => {
  const { user } = useAuthStore();
  const { updateComment, deleteComment, toggleLike } = useCommentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === comment.userId;
  const maxDepth = 3;
  const canReply = true; // Always allow replies, but handle depth in the reply logic
  const isReplying = replyingTo === comment.id;

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      await updateComment(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteComment(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleLike = async () => {
    if (isLiking) return; // Prevent double-clicking
    
    setIsLiking(true);
    try {
      await toggleLike(comment.id);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReplySubmit = () => {
    onReplyCancel?.();
  };

  const handleReplyClick = () => {
    if (!onReply) return;
    
    // If we're at max depth, reply to the parent instead of this comment
    if (depth >= maxDepth - 1) {
      // Find the parent comment ID to reply to
      const parentId = comment.parentId || comment.id;
      onReply(parentId, comment.id);
    } else {
      // Normal reply - reply directly to this comment
      onReply(comment.id, comment.id);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  return (
    <>
      <div className={cn("space-y-3", depth > 0 && "ml-4")}>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {comment.user?.avatar_url ? (
              <img
                src={comment.user.avatar_url}
                alt={comment.user.full_name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-sm font-medium">
                {getInitials(comment.user?.full_name)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-primary-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary-900 text-sm">
                    {comment.user?.full_name || 'Anonymous User'}
                  </span>
                  <span className="text-primary-500 text-xs">
                    {formatDate(comment.createdAt)}
                    {comment.isEdited && ' (edited)'}
                  </span>
                </div>

                {isOwner && (
                  <Menu as="div" className="relative">
                    <Menu.Button className="p-1 rounded-md hover:bg-primary-100 text-primary-500">
                      <MoreVertical size={14} />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-elevated py-1 z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={cn(
                              "flex items-center gap-2 w-full px-3 py-1.5 text-sm",
                              active ? "bg-primary-50 text-primary-900" : "text-primary-700"
                            )}
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={cn(
                              "flex items-center gap-2 w-full px-3 py-1.5 text-sm",
                              active ? "bg-error-50 text-error-900" : "text-error-700"
                            )}
                            onClick={handleDelete}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-primary-300 rounded-md resize-none text-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEdit} disabled={!editContent.trim()}>
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-primary-800 text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-1 hover:text-primary-700 transition-colors disabled:opacity-50",
                  comment.isLikedByUser ? "text-primary-700" : "text-primary-500"
                )}
              >
                <ThumbsUp size={14} className={comment.isLikedByUser ? "fill-current" : ""} />
                <span>{comment.likeCount > 0 ? comment.likeCount : ''}</span>
              </button>

              {canReply && onReply && (
                <button
                  onClick={handleReplyClick}
                  className="flex items-center gap-1 text-primary-500 hover:text-primary-700 transition-colors"
                >
                  <Reply size={14} />
                  <span>Reply</span>
                </button>
              )}
            </div>

            {/* Reply form for this specific comment */}
            {isReplying && (
              <div className="mt-3">
                <CommentForm
                  entityType={entityType}
                  entityId={entityId}
                  parentId={depth >= maxDepth - 1 ? comment.parentId || comment.id : comment.id}
                  placeholder={`Reply to ${comment.user?.full_name || 'this comment'}...`}
                  onSubmit={handleReplySubmit}
                  onCancel={onReplyCancel}
                  autoFocus
                />
              </div>
            )}

            {/* Render nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    entityType={entityType}
                    entityId={entityId}
                    depth={depth + 1}
                    replyingTo={replyingTo}
                    onReply={onReply}
                    onReplyCancel={onReplyCancel}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message={
          <div>
            <p className="mb-3">
              Are you sure you want to delete this comment?
            </p>
            <p className="text-sm text-primary-500">
              This action cannot be undone. All replies to this comment will also be deleted.
            </p>
          </div>
        }
        confirmText="Delete Comment"
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
};

export default CommentItem;