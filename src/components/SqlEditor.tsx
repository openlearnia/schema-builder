interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

export function SqlEditor({ value, onChange, ariaLabel, className }: SqlEditorProps) {
  const lineCount = Math.max(value.split('\n').length, 1)

  return (
    <div className={`sqlEditorShell ${className ?? ''}`}>
      <div className="sqlLineNumbers" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        spellCheck={false}
        wrap="off"
      />
    </div>
  )
}
