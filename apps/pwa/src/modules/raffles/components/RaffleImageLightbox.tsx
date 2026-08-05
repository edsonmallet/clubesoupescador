'use client'

import { useEffect, useState } from 'react'

export function RaffleImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 animate-fade-in bg-black/95">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        ✕
      </button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: overlay tap-to-zoom, Escape/close button já cobrem teclado */}
      <div
        className="flex h-full w-full items-center justify-center overflow-auto"
        onClick={() => setZoomed((z) => !z)}
      >
        <img
          src={src}
          alt={alt}
          className={
            zoomed
              ? 'w-[200%] max-w-none animate-scale-in cursor-zoom-out transition-all duration-300'
              : 'max-h-full max-w-full animate-scale-in cursor-zoom-in object-contain transition-all duration-300'
          }
        />
      </div>
    </div>
  )
}
