import { useEffect } from 'react'

interface ShortcutsOverlayProps {
  open: boolean
  onClose: () => void
}

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="shortcutsBackdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="shortcutsOverlay"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="row between">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <dl className="shortcutsList">
          <div>
            <dt>Undo</dt>
            <dd>⌘/Ctrl + Z</dd>
          </div>
          <div>
            <dt>Redo</dt>
            <dd>⌘/Ctrl + Shift + Z</dd>
          </div>
          <div>
            <dt>Add table</dt>
            <dd>Use Add table in Schema</dd>
          </div>
          <div>
            <dt>Apply schema</dt>
            <dd>Use Apply to PGLite</dd>
          </div>
          <div>
            <dt>Switch tabs</dt>
            <dd>Choose Schema, SQL, or Data</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
