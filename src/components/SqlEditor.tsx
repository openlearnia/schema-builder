import { useRef } from 'react'

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

export function SqlEditor({ value, onChange, ariaLabel, className }: SqlEditorProps) {
  const lineCount = Math.max(value.split('\n').length, 1)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`sqlEditorShell ${className ?? ''}`}>
      <div ref={lineNumbersRef} className="sqlLineNumbers" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop
          }
        }}
        aria-label={ariaLabel}
        spellCheck={false}
        wrap="off"
      />
    </div>
  )
}
