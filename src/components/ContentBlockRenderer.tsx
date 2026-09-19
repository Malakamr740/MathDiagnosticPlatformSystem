import React from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

export interface ContentBlock {
  id?: string
  type: 'text' | 'math' | 'latex' | 'image' | 'paragraph' | string
  content?: string
  text?: string
  value?: string
  url?: string
  caption?: string
}

interface ContentBlockRendererProps {
  blocks?: ContentBlock[] | string | null
  className?: string
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({
  blocks,
  className = '',
}) => {
  if (!blocks) return null

  // If passed a simple string
  if (typeof blocks === 'string') {
    return <span className={className}>{blocks}</span>
  }

  if (!Array.isArray(blocks)) {
    return <span className={className}>{String(blocks)}</span>
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {blocks.map((block, idx) => {
        const textVal = block.content ?? block.text ?? block.value ?? ''

        if (block.type === 'latex' || block.type === 'math') {
          try {
            return (
              <div key={block.id || idx} className="my-1 overflow-x-auto py-1">
                <BlockMath math={textVal} />
              </div>
            )
          } catch (e) {
            return (
              <code key={block.id || idx} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-blue-700">
                {textVal}
              </code>
            )
          }
        }

        if (block.type === 'image' && (block.url || textVal)) {
          return (
            <div key={block.id || idx} className="my-2">
              <img
                src={block.url || textVal}
                alt={block.caption || 'Question graphic'}
                className="max-h-64 rounded-lg border border-slate-200 object-contain shadow-xs"
              />
              {block.caption && (
                <p className="mt-1 text-xs text-slate-500 italic">{block.caption}</p>
              )}
            </div>
          )
        }

        // Inline LaTeX parsing: $...$ or standard text
        return (
          <p key={block.id || idx} className="text-xs leading-relaxed text-slate-800">
            {textVal}
          </p>
        )
      })}
    </div>
  )
}

export default ContentBlockRenderer
