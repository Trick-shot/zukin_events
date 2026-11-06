# Booking flow — every screen, desktop and 390px

Captured from the running app against the mock modules. Each screen is here at
both widths: `-desktop` is 1440, `-390` is a true 390px viewport.

| File stem | Screen | How to reach it by hand |
| --- | --- | --- |
| `b1-date-and-space` | B1 — date & space | `/book` (prefills from the hero widget's `?date=&space=&eventType=&guests=`) |
| `b5-date-unavailable` | B5 — date taken | pick the **8th, 14th or 22nd** of any month in the main hall |
| `b2-your-details` | B2 — your details | continue from B1, or tap one of B5's chips |
| `b3-review` | B3 — review & send | continue from B2 |
| `b3-review-send-failed` | B3 — send failed | set guests to **13** and send |
| `b4-request-sent` | B4 — sent | send any other guest count |
| `b8-site-visit-picker` | B8 — day & slot | `/site-visit` |
| `b8-site-visit-sent` | B8 — requested | pick a day, a slot, a phone, send |

## Deterministic triggers

Everything above is reachable without a database, by rules documented in the
mock modules:

- **taken dates** — main hall: 8th, 14th, 22nd; second space: 14th, 27th. The
  14th is taken in *both*, which is the case where "try the other room" does
  not help either.
- **send fails** — exactly 13 guests (`FAILURE_GUEST_COUNT`). Memorable,
  impossible to hit by accident at a venue this size, obviously synthetic.
- **site visit fails** — a phone number ending in 13.

## Notes on the captures

- The 390px shots are rendered in a 390px-wide iframe, because Chrome will not
  size a window below 500px. The faint dashed line at the right and bottom of
  those images is the harness iframe's edge, not a UI border.
- `b4` and `b8-site-visit-sent` show the shared `SuccessMark kind="success"`
  check-draw frozen after its single play; it never loops. `kind="rings"` is
  reserved for a *confirmed* booking, which is a `/track` moment, not a
  just-sent one.
- B1 shows `CalendarMark` beside the date field: it loops while the date is
  being checked and rests once the date comes back free.
- Every `[bracketed]` value visible in these shots is unconfirmed client data,
  not a bug: `[24 hours]`, `[00%]`, `[SMS wording to confirm.]`,
  `[confirm with owner]`, `[placeholder]`, `[+255 000 000 000]`.
