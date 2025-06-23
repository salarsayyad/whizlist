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
  toggleLike: (commentId: string) => Promise<void>;
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
  likeCount: dbComment.like_count || 0,
  isLikedByUser: dbComment.is_liked_by_user || false,
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
      
      const userId = useAuthStore.getState().user?.id;
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          ),
          like_count:comment_likes(count),
          is_liked_by_user:comment_likes!inner(user_id)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('comment_likes.user_id', userId || '')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Process the data to get proper like counts and user like status
      const processedData = await Promise.all((data || []).map(async (comment) => {
        // Get total like count
        const { count: likeCount } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        // Check if current user liked this comment
        const { data: userLike } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', comment.id)
          .eq('user_id', userId || '')
          .single();

        return {
          ...comment,
          like_count: likeCount || 0,
          is_liked_by_user: !!userLike
        };
      }));
      
      const mappedComments = processedData.map(mapDbCommentToUiComment);
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
        parent_id: parentId || null,
        // Only set product_id for product comments, leave null for others
        product_id: entityType === 'product' ? entityId : null
      };

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
      
      const newComment = mapDbCommentToUiComment({
        ...data,
        like_count: 0,
        is_liked_by_user: false
      });
      
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
      
      // Get current like data for this comment
      const userId = useAuthStore.getState().user?.id;
      const { count: likeCount } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      const { data: userLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId || '')
        .single();

      const updatedComment = mapDbCommentToUiComment({
        ...data,
        like_count: likeCount || 0,
        is_liked_by_user: !!userLike
      });
      
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

  toggleLike: async (commentId: string) => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User must be authenticated to like comments');

      // Check if user already liked this comment
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike: remove the like
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;
      } else {
        // Like: add the like
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert([{
            comment_id: commentId,
            user_id: userId
          }]);

        if (insertError) throw insertError;
      }

      // Update the comment in the store with new like status
      const updateCommentLikes = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const newIsLiked = !comment.isLikedByUser;
            const newLikeCount = newIsLiked 
              ? comment.likeCount + 1 
              : Math.max(0, comment.likeCount - 1);
            
            return {
              ...comment,
              isLikedByUser: newIsLiked,
              likeCount: newLikeCount
            };
          }
          if (comment.replies) {
            return { ...comment, replies: updateCommentLikes(comment.replies) };
          }
          return comment;
        });
      };

      set(state => ({ comments: updateCommentLikes(state.comments) }));

    } catch (error) {
      console.error('Error toggling like:', error);
      set({ error: (error as Error).message });
    }
  },

  clearComments: () => set({ comments: [], error: null }),
}));