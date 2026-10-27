import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Part } from '@/types'
import { illustrationFor } from './illustrations'
import { PartIllustration } from './PartIllustration'

type ImagePart = Pick<Part, 'id' | 'name' | 'category' | 'mpn' | 'image'>

/**
 * A part's photo on a light tile (photos are shot on white), or its drawing when there is no photo
 * or the photo fails to load.
 */
export function PartImage({ part, className }: { part: ImagePart; className?: string }) {
  const [failed, setFailed] = useState(false)
  const photo = part.image && !failed ? part.image : null

  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg', photo ? 'bg-white' : 'bg-accent', className)}>
      {photo ? (
        <img
          src={photo.src}
          alt={part.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-[6%]"
        />
      ) : (
        <PartIllustration spec={illustrationFor(part)} className="p-[6%]" />
      )}
    </span>
  )
}
