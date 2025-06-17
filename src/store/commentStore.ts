import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Comment } from '../types';
import { useAuthStore } from './authStore';

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  fetchComments: (entityType: 'product' | 'folder' | 'list', entityId: string) => Promise<void>;
  createComment: (entityType: 'product' | 'folder' | 'list', entityId: string, content: string, parentId?: string) => Promise<Comment>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  clearComments: () => void;
}

// Helper function to map database comment to UI comment
const mapDbCommentToUiComment = (dbComment: any): Comment => ({
  id: dbComment.id,
  content: dbComment.content,
  productId: dbComment.product_id, // Keep for backward compatibility
  entityType: dbComment.entity_type || 'product',
  entityId: dbComment.entity_id,
  userId: dbComment.user_id,
  parentId: dbComment.parent_id,
  createdAt: dbComment.created_at,
  updatedAt: dbComment.updated_at,
  isEdited: dbComment.is_edited,
  user: dbComment.profiles ? {
    id: dbComment.profiles.id,
    full_name: dbComment.profiles.full_name,
    avatar_url: dbComment.profiles.avatar_url
  } : undefined
});

// Helper function to organize comments into threads
const organizeCommentsIntoThreads = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  // First pass: create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into threads
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;
    
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  // Sort root comments by creation date (oldest first)
  rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Sort replies by creation date (oldest first)
  const sortReplies = (comment: Comment) => {
    if (comment.replies) {
      comment.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      comment.replies.forEach(sortReplies);
    }
  };

  rootComments.forEach(sortReplies);

  return rootComments;
};

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,

  fetchComments: async (entityType: 'product' | 'folder' | 'list', entityId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const mappedComments = (data || []).map(mapDbCommentToUiComment);
      const organizedComments = organizeCommentsIntoThreads(mappedComments);
      
      set({ comments: organizedComments });
      
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createComment: async (entityType: 'product' | 'folder' | 'list', entityId: string, content: string, parentId?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User must be authenticated to create a comment');

      const insertData: any = {
        content,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        parent_id: parentId || null
      };

      // For backward compatibility with product comments
      if (entityType === 'product') {
        insertData.product_id = entityId;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([insertData])
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      
      const newComment = mapDbCommentToUiComment(data);
      
      // Refresh comments to get proper threading
      await get().fetchComments(entityType, entityId);
      
      return newComment;
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateComment: async (commentId: string, content: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      
      const updatedComment = mapDbCommentToUiComment(data);
      
      // Update the comment in the store
      const updateCommentInList = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return updatedComment;
          }
          if (comment.replies) {
            return { ...comment, replies: updateCommentInList(comment.replies) };
          }
          return comment;
        });
      };
      
      set(state => ({ comments: updateCommentInList(state.comments) }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      // Remove the comment from the store
      const removeCommentFromList = (comments: Comment[]): Comment[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) {
            return false;
          }
          if (comment.replies) {
            comment.replies = removeCommentFromList(comment.replies);
          }
          return true;
        });
      };
      
      set(state => ({ comments: removeCommentFromList(state.comments) }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearComments: () => set({ comments: [], error: null }),
}));