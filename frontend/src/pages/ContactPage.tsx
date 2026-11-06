import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Mail } from 'lucide-react'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/ui/PageHeading'
import { CONTACT } from '@/content/site'

/**
 * /contact — the ways to reach reception, after Figma 94:980 / 94:1175.
 * Phone numbers and the email are [placeholders] until the owner confirms
 * them, so the cards render inert values rather than invented tel: links.
 */
const CHANNELS = [
  {
    icon: MessageCircle,
    name: 'WhatsApp',
    value: CONTACT.whatsapp,
    note: 'Fastest reply during opening hours',
  },
  {
    icon: Phone,
    name: 'Phone',
    value: CONTACT.phone,
    note: 'Reception answers Monday to Saturday',
  },
  {
    icon: Mail,
    name: 'Email',
    value: CONTACT.email,
    note: 'For quotes and written confirmations',
  },
  {
    icon: Clock,
    name: 'Open',
    value: CONTACT.hours,
    note: 'Site visits are free — book a slot',
  },
] as const

export function ContactPage() {
  return (
    <>
      <PageHeading
        crumb="Contact"
        title="Talk to reception."
        intro="Questions about a date, a quote or a visit — one team answers all of it."
      />

      <section aria-label="Ways to reach us" className="bg-paper pb-20">
        <Container className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel) => (
            <div key={channel.name} className="bg-paper p-6">
              <channel.icon size={18} aria-hidden="true" className="text-gold-dark" />
              <h2 className="mt-3 font-sans text-sm font-semibold">{channel.name}</h2>
              <p className="mt-1 text-[15px] font-medium text-ink">{channel.value}</p>
              <p className="mt-1.5 text-[13px] text-subtle">{channel.note}</p>
            </div>
          ))}
        </Container>
      </section>

      <section aria-labelledby="visit-heading" className="texture-kanga bg-sand py-20">
        <Container className="flex flex-col gap-12 lg:flex-row lg:gap-20">
          <div className="flex-[3]">
            <div className="min-h-72 overflow-hidden rounded-card bg-paper">
              <iframe
                title="Zukin Hall on Google Maps"
                src="https://www.google.com/maps?q=Zukin+Hall,+Dodoma,+Tanzania&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-96 w-full border-0"
              />
            </div>
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <MapPin size={15} aria-hidden="true" className="text-gold-dark" />
              Open in Google Maps
            </a>
          </div>
          <div className="flex-[2]">
            <h2 id="visit-heading" className="text-3xl">
              Come and see it.
            </h2>
            <p className="mt-3 max-w-md text-[15px] text-muted">
              {CONTACT.address}. A visit takes about 30 minutes — a member of the team walks you
              through both rooms and answers your questions.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button as="link" to="/site-visit">
                Book a site visit
              </Button>
              <Button as="link" to="/book" variant="outline">
                Check your date
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
