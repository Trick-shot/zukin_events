import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Glow } from '@/components/ui/Glow'

/**
 * Milestone (a) ships the shell only. Each placeholder below owns the id and
 * the background tone its real section will keep, so the header anchors and
 * the cream/plum rhythm are already correct and later milestones replace the
 * body of one block at a time.
 */
const PLACEHOLDER_SECTIONS = [
  { id: 'hero', tone: 'plum', label: '1 Hero', note: 'Pinned scroll-scrubbed sequence — milestone (c)' },
  { id: 'marquee', tone: 'plum', label: '2 Marquee band', note: 'Milestone (d)' },
  { id: 'intro', tone: 'cream', label: '3 Intro', note: 'Milestone (d)' },
  { id: 'spaces', tone: 'cream', label: '4 Spaces', note: 'Milestone (d)' },
  { id: 'events', tone: 'cream', label: '5 Events', note: 'Milestone (d)' },
  { id: 'decoration', tone: 'plum', label: '6 Zukin decoration', note: 'Milestone (d)' },
  { id: 'gallery', tone: 'cream', label: '7 Gallery', note: 'Milestone (e)' },
  { id: 'availability', tone: 'cream', label: '8 Availability', note: 'Milestone (e)' },
  { id: 'how-it-works', tone: 'cream', label: '9 How booking works', note: 'Milestone (e)' },
  { id: 'location', tone: 'cream', label: '10 Location', note: 'Milestone (e)' },
  { id: 'cta', tone: 'plum', label: '11 CTA banner', note: 'Milestone (e)' },
] as const

export function LandingPage() {
  return (
    <>
      {PLACEHOLDER_SECTIONS.map((section, index) => (
        <Section
          key={section.id}
          id={section.id}
          tone={section.tone}
          labelledBy={`${section.id}-heading`}
          className="py-24"
        >
          {section.tone === 'cream' ? (
            <Glow
              tone="pink"
              size={700}
              className={index % 2 === 0 ? '-top-40 -right-40' : '-top-40 -left-40'}
            />
          ) : (
            <Glow tone="magenta" size={800} className="-top-60 right-0" />
          )}

          <Container>
            <Eyebrow>{section.label}</Eyebrow>
            <h2 id={`${section.id}-heading`} className="mt-4 text-4xl xl:text-5xl">
              {section.label.replace(/^\d+\s/, '')}
            </h2>
            <p
              className={
                section.tone === 'cream'
                  ? 'mt-3 text-muted'
                  : 'mt-3 text-on-dark-muted'
              }
            >
              {section.note}
            </p>
          </Container>
        </Section>
      ))}
    </>
  )
}
