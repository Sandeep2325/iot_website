import type { PartImage } from '@/types'

/** Attribution required by the photo's licence, e.g. "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons". */
export function PhotoCredit({ credit }: { credit: NonNullable<PartImage['credit']> }) {
  return (
    <figcaption className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
      Photo:{' '}
      <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
        {credit.author}
      </a>
      ,{' '}
      {credit.licenseUrl ? (
        <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          {credit.license}
        </a>
      ) : (
        credit.license
      )}
      , via Wikimedia Commons
    </figcaption>
  )
}
