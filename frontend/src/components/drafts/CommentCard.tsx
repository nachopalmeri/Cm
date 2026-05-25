'use client'

import { useState } from 'react'

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

interface CommentCardProps {
  comment: Comment
  onResolve: (id: string, resolved: boolean) => void
  onDelete?: (id: string) => void
}

export default function CommentCard({ comment, onResolve, onDelete }: CommentCardProps) {
  const [isResolving, setIsResolving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const handleResolve = async () => {
    setIsResolving(true)
    await onResolve(comment.id, !comment.resolved)
    setIsResolving(false)
  }
  
  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm('¿Eliminar este comentario?')) return
    
    setIsDeleting(true)
    await onDelete(comment.id)
  }
  
  const getSeverityIcon = () => {
    switch (comment.severity) {
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
    }
  }
  
  const getSeverityColor = () => {
    switch (comment.severity) {
      case 'error': return 'border-red-500 bg-red-50'
      case 'warning': return 'border-yellow-500 bg-yellow-50'
      case 'info': return 'border-blue-500 bg-blue-50'
    }
  }
  
  const getCategoryLabel = () => {
    const labels: Record<string, string> = {
      hook: 'Hook',
      voice: 'Voz',
      repetition: 'Repetición',
      structure: 'Estructura',
      length: 'Longitud',
      clarity: 'Claridad'
    }
    return labels[comment.category] || comment.category
  }
  
  return (
    <div className={`border-l-4 rounded-lg p-4 mb-3 ${getSeverityColor()} ${comment.resolved ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getSeverityIcon()}</span>
          <span className="text-xs font-semibold px-2 py-1 bg-white rounded">
            {getCategoryLabel()}
          </span>
          {comment.type === 'agent' && (
            <span className="text-xs text-gray-500">🤖 Agente</span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="text-xs px-2 py-1 rounded hover:bg-white transition-colors"
            title={comment.resolved ? 'Marcar como no resuelto' : 'Marcar como resuelto'}
          >
            {isResolving ? '...' : comment.resolved ? '↩️' : '✓'}
          </button>
          
          {comment.type === 'user' && onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs px-2 py-1 rounded hover:bg-white transition-colors text-red-600"
              title="Eliminar comentario"
            >
              {isDeleting ? '...' : '🗑️'}
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <p className="text-sm text-gray-700 mb-2">
        {comment.content}
      </p>
      
      {/* Suggestions */}
      {comment.metadata.suggestions && comment.metadata.suggestions.length > 0 && (
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800">
            Ver sugerencias ({comment.metadata.suggestions.length})
          </summary>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            {comment.metadata.suggestions.map((suggestion: string, i: number) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </details>
      )}
      
      {/* Timestamp */}
      <div className="text-xs text-gray-400 mt-2">
        {new Date(comment.created_at).toLocaleString('es-AR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  )
}
