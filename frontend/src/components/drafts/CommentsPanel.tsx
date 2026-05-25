'use client'

import { useState, useEffect } from 'react'
import CommentCard from './CommentCard'

interface Comment {
  id: string
  type: 'agent' | 'user'
  severity: 'info' | 'warning' | 'error'
  category: string
  content: string
  resolved: boolean
  metadata: Record<string, any>
  created_at: string
}

interface CommentsPanelProps {
  draftId: string
}

export default function CommentsPanel({ draftId }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'agent' | 'user'>('unresolved')
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    loadComments()
  }, [draftId, filter])
  
  const loadComments = async () => {
    try {
      setLoading(true)
      
      let url = `/api/drafts/${draftId}/comments`
      const params = new URLSearchParams()
      
      if (filter === 'unresolved') {
        params.append('resolved', 'false')
      } else if (filter === 'agent' || filter === 'user') {
        params.append('type', filter)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load comments')
      
      const data = await res.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved })
      })
      
      if (!res.ok) throw new Error('Failed to update comment')
      
      // Update local state
      setComments(prev =>
        prev.map(c => c.id === commentId ? { ...c, resolved } : c)
      )
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Error al actualizar comentario')
    }
  }
  
  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}/comments/${commentId}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete comment')
      
      // Remove from local state
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Error al eliminar comentario')
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    try {
      setIsSubmitting(true)
      
      const res = await fetch(`/api/drafts/${draftId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          severity: 'info',
          category: 'clarity',
          content: newComment.trim()
        })
      })
      
      if (!res.ok) throw new Error('Failed to create comment')
      
      const data = await res.json()
      setComments(prev => [data.comment, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('Error al crear comentario')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const unresolvedCount = comments.filter(c => !c.resolved).length
  
  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">
            Comentarios
            {unresolvedCount > 0 && (
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {unresolvedCount} pendiente{unresolvedCount !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'unresolved', 'agent', 'user'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'all' && 'Todos'}
              {f === 'unresolved' && 'Pendientes'}
              {f === 'agent' && 'Agente'}
              {f === 'user' && 'Míos'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            Cargando comentarios...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {filter === 'unresolved' ? (
              <>
                <div className="text-4xl mb-2">✅</div>
                <p>¡No hay comentarios pendientes!</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">💬</div>
                <p>No hay comentarios aún</p>
              </>
            )}
          </div>
        ) : (
          <div>
            {comments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onResolve={handleResolve}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* New comment form */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Agregar un comentario..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Enviando...' : 'Agregar comentario'}
          </button>
        </form>
      </div>
    </div>
  )
}
