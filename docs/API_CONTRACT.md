# API contract — booking endpoints

Status: **contract only, not implemented.** The backend arrives in milestone
(b); this document is what it has to satisfy.

Four endpoints, all driven today by mock modules the frontend already calls:

| Endpoint | Mock | Screens |
| --- | --- | --- |
| `GET /api/bookings/track` | `trackBooking` | B6, B7 (`/track`) |
| `GET /api/bookings/availability` | `checkDate` | B1, B5 (`/book`) |
| `POST /api/bookings/requests` | `submitRequest` | B3, B4 (`/book`) |
| `POST /api/bookings/site-visits` | `submitSiteVisit` | B8 (`/site-visit`) |

The authority for this contract is `frontend/src/lib/mockBookings.ts`. The
frontend is already built against it: `trackBooking(phone, reference)` returns
`Promise<Booking | null>`, and the whole `/track` screen is driven by the
`Booking` shape and the `BookingStatus` union. When the real endpoint exists,
the body of `trackBooking` becomes a `fetch` and the fixtures are deleted —
**nothing else in the frontend should need to change.** If the backend cannot
meet a detail here, change this document and the mock together, not just one.

---

## Endpoint

```
GET /api/bookings/track?phone=<string>&reference=<string>
```

Unauthenticated. Both parameters are **required** and are matched **as a
pair** — see [Security](#security-this-is-the-part-that-matters), which is not
optional advice.

### Responses

| Case | Status | Body |
| --- | --- | --- |
| Pair matches a booking | `200` | `Booking` (below) |
| Pair matches nothing | `404` | `{"detail": "No booking found."}` |
| Missing/blank parameter | `400` | `{"detail": "Phone and reference are required."}` |
| Throttled | `429` | `{"detail": "Too many attempts. Try again later."}` |

The client maps `404 → null`; `trackBooking` resolves `null` and the UI shows
the calm "No booking found" panel. A `404` is **not** an error state in the
UI, so it must not be logged as one.

`400` and `429` are genuine errors and surface in the form's error banner.

Every response carries `Cache-Control: no-store` — this is personal data and
must not sit in a proxy or in the browser's back/forward cache.

### `Booking`

Field names are **camelCase**, matching the TypeScript type exactly. DRF
defaults to snake_case, so each field needs an explicit `source=` (see the
serializer sketch) or the frontend types break.

| Field | Type | Notes |
| --- | --- | --- |
| `reference` | `string` | e.g. `ZK-2603-0142` |
| `clientName` | `string` | |
| `eventType` | `string` | e.g. `Wedding`, `Send-off` |
| `space` | `string` | Display name, e.g. `Main hall` |
| `eventDate` | `string` | ISO date, `YYYY-MM-DD` |
| `guests` | `number` | |
| `decorPackage` | `string \| null` | `null` when no package chosen |
| `status` | `BookingStatus` | enum below |
| `holdEndsOn` | `string?` | ISO date. **Only** when `status === 'deposit_due'` |
| `depositAmount` | `string?` | Pre-formatted for display, e.g. `TZS 450,000` |

`holdEndsOn` and `depositAmount` are omitted (not `null`) outside
`deposit_due`. The frontend narrows on `status` before reading them.

`depositAmount` is a **string, already formatted** — the frontend does no
currency formatting and must not have to. (The mock currently carries the
placeholder `TZS [amount]`, which is unconfirmed client data, not a format to
copy.)

### `BookingStatus`

A closed set. Adding a value is a breaking change for the frontend, which
maps each to a timeline step and a badge:

```
requested · under_review · deposit_due · confirmed · completed · rejected · expired · cancelled
```

The timeline renders four steps — Request received, Under review, Deposit,
Confirmed, Event day — so any new status must state where it sits.

### Phone normalisation

The server normalises exactly as the mock does, or pairs that work in
development will fail in production:

1. strip every non-digit (`+255 754 111 222`, `0754-111-222`, `0754111222` all collapse)
2. a leading `255` becomes `0`

So `+255 754 111 222` and `0754111222` are the same number. Store numbers
normalised, or normalise on both sides of the comparison — do not rely on the
database's stored formatting.

Reference comparison is case-insensitive and trimmed (`zk-2603-0142` matches).

---

## Security — this is the part that matters

This endpoint returns a named person's event date, guest count and venue to
**anyone on the internet with no login**. It is the most attackable surface
in the project. Three properties have to hold.

### 1. The pair is the credential — never either half alone

Match on `phone AND reference`. Never expose a lookup by one. The reference
alone is close to worthless as a secret: `ZK-2603-0142` is
`ZK-<YYMM>-<4 digits>`, so a month's bookings live in a space of 10,000 and
realistically a few hundred — minutes of guessing. The phone number is the
part an attacker is unlikely to hold, and only the pair is sufficient.

### 2. A miss must be indistinguishable from every other miss

Wrong phone, wrong reference, both wrong, or a reference that does not exist
at all must produce a **byte-identical `404`**. Any difference — body, status,
header, or response time — turns the endpoint into an oracle that confirms
"this reference exists" or "this phone has a booking", which is exactly the
enumeration this design is trying to prevent.

That means:

- one shared `404` body, built before the lookup, never mentioning which half failed
- no distinct "reference not found" vs "phone does not match" messages
- compare with `hmac.compare_digest`, not `==`, so a match does not short-circuit character by character
- pad the handler to a constant floor (e.g. ~200ms) so a database miss is not
  measurably faster than a hit

### 3. Throttle on both axes

A per-IP throttle alone is defeated by a botnet; a per-phone throttle alone is
defeated by rotating phones. Apply both, and count **failures**, not requests
— a client legitimately re-checking their own confirmed booking should not be
locked out:

| Scope | Suggested budget | Defeats |
| --- | --- | --- |
| per IP | 10 failures / hour | one host walking references |
| per normalised phone | 5 failures / hour | distributed guessing at one victim |
| global | a sane ceiling | mass harvesting |

Back off progressively rather than flipping to a hard block, and return `429`
with `Retry-After`.

### 4. Keep the phone out of logs

`GET` with query parameters means the phone number — personal data — lands in
nginx access logs, `DEBUG` logs, APM traces, and any proxy in between. The
frontend is built against `GET` and that is the contract, so the mitigation
sits on the server:

- scrub `phone` and `reference` from access-log formats and from Sentry/APM
  (`send_default_pii = False`, plus a `before_send` scrubber)
- never echo the submitted phone back in an error body
- `Referrer-Policy: no-referrer` on the page so the query string does not leak
  onward

If the privacy review would rather this were a `POST` with a JSON body — which
keeps it out of logs and history by construction — that is a better shape for
the data, and the cost is a one-line change in `trackBooking`. Worth raising
before launch; it is cheap now and expensive once third parties integrate.

---

## Sketch — serializer

```python
# bookings/serializers.py
from rest_framework import serializers

from .models import Booking


class BookingTrackSerializer(serializers.ModelSerializer):
    """
    Read-only projection of Booking for the public tracking endpoint.

    Field names are camelCase on purpose: this response IS the frontend's
    `Booking` type (frontend/src/lib/mockBookings.ts). Renaming a field here
    breaks the client silently, because TypeScript cannot check a network
    boundary.

    Only the fields below are ever exposed. Everything else on the model —
    internal notes, the reception assignee, payment references, the audit
    trail — stays server-side.
    """

    clientName = serializers.CharField(source="client_name", read_only=True)
    eventType = serializers.CharField(source="event_type", read_only=True)
    space = serializers.CharField(source="space.name", read_only=True)
    eventDate = serializers.DateField(source="event_date", read_only=True)
    decorPackage = serializers.CharField(
        source="decor_package.name", read_only=True, allow_null=True, default=None
    )
    holdEndsOn = serializers.DateField(source="hold_ends_on", read_only=True)
    depositAmount = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "reference",
            "clientName",
            "eventType",
            "space",
            "eventDate",
            "guests",
            "decorPackage",
            "status",
            "holdEndsOn",
            "depositAmount",
        )
        read_only_fields = fields

    def get_depositAmount(self, obj) -> str | None:
        # Formatted server-side: the frontend renders the string as given.
        if obj.status != Booking.Status.DEPOSIT_DUE:
            return None
        return f"TZS {obj.deposit_amount:,.0f}"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # The contract omits these outside deposit_due rather than sending
        # null, so the client can narrow on `status` alone.
        if instance.status != Booking.Status.DEPOSIT_DUE:
            data.pop("holdEndsOn", None)
            data.pop("depositAmount", None)
        return data
```

`Booking.Status` must be a `TextChoices` whose *values* are exactly the eight
strings in `BookingStatus` — `under_review`, not `UNDER_REVIEW` or `Under
review`.

## Sketch — throttles

```python
# bookings/throttling.py
from rest_framework.throttling import SimpleRateThrottle


class TrackByIPThrottle(SimpleRateThrottle):
    """Failures per IP. See scope rates in settings."""

    scope = "booking_track_ip"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class TrackByPhoneThrottle(SimpleRateThrottle):
    """
    Failures per normalised phone, so rotating IPs does not buy more guesses
    at one person's booking.
    """

    scope = "booking_track_phone"

    def get_cache_key(self, request, view):
        phone = normalise_phone(request.query_params.get("phone", ""))
        if not phone:
            return None  # the 400 path is handled before throttling
        return self.cache_format % {"scope": self.scope, "ident": phone}
```

Both are counted on **failure** — call `throttle.throttle_success()` only when
the lookup misses, so honest repeat checks are not punished.

## Sketch — view

```python
# bookings/views.py
import hmac
import time

from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking
from .serializers import BookingTrackSerializer
from .throttling import TrackByIPThrottle, TrackByPhoneThrottle
from .utils import normalise_phone

# Every miss answers with this exact object. One constant, one code path.
NOT_FOUND = {"detail": "No booking found."}

# Floor for the whole handler, so a miss is not measurably faster than a hit.
MIN_RESPONSE_SECONDS = 0.2


class BookingTrackView(APIView):
    """
    GET /api/bookings/track?phone=&reference=

    Public, unauthenticated lookup of one booking by (phone, reference).
    Read-only; there is deliberately no POST/PATCH here — changes are agreed
    on the phone with reception, which the UI tells the visitor.
    """

    permission_classes = [AllowAny]
    throttle_classes = [TrackByIPThrottle, TrackByPhoneThrottle]

    def get(self, request):
        started = time.monotonic()

        phone = normalise_phone(request.query_params.get("phone", ""))
        reference = request.query_params.get("reference", "").strip().upper()

        if not phone or not reference:
            return Response(
                {"detail": "Phone and reference are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch by reference, then verify the phone in constant time. Doing
        # both in the query would let the database's timing distinguish
        # "no such reference" from "reference exists, wrong phone".
        booking = (
            Booking.objects.select_related("space", "decor_package")
            .filter(reference__iexact=reference)
            .first()
        )

        matched = booking is not None and hmac.compare_digest(
            normalise_phone(booking.phone), phone
        )

        if not matched:
            self._pad(started)
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)

        data = BookingTrackSerializer(booking).data
        self._pad(started)
        response = Response(data)
        response["Cache-Control"] = "no-store"
        return response

    @staticmethod
    def _pad(started: float) -> None:
        remaining = MIN_RESPONSE_SECONDS - (time.monotonic() - started)
        if remaining > 0:
            time.sleep(remaining)
```

> The `time.sleep` floor is correct on a threaded/WSGI worker. On ASGI use
> `await asyncio.sleep` instead, or it blocks the event loop for every other
> request on that worker.

## Settings

```python
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {
        "booking_track_ip": "10/hour",
        "booking_track_phone": "5/hour",
    },
}
```

Throttles need a shared cache to mean anything behind more than one worker —
locmem resets per process, so use Redis (or the database cache) in anything
above dev.

---

## Definition of done

- [ ] `GET /api/bookings/track` returns exactly the `Booking` shape, camelCase
- [ ] All eight `BookingStatus` values round-trip to the frontend's union
- [ ] `holdEndsOn` / `depositAmount` present **only** on `deposit_due`
- [ ] A miss is byte-identical and time-indistinguishable across all four miss kinds
- [ ] Both throttles active, counted on failure, backed by a shared cache
- [ ] `phone` and `reference` scrubbed from access logs and APM
- [ ] `Cache-Control: no-store` on every response
- [ ] `trackBooking` in the frontend swapped to `fetch`, fixtures deleted,
      `/track` still passes all four fixture journeys by hand


---

# Availability

```
GET /api/bookings/availability?date=<YYYY-MM-DD>&space=<slug>
```

Public, unauthenticated, read-only. Backs step 1 of `/book`: the visitor picks
a date and the screen either moves on or offers alternatives (B5).

Mock: `checkDate` in `frontend/src/lib/mockAvailability.ts`.

### Responses

| Case | Status | Body |
| --- | --- | --- |
| Date is free | `200` | `{"available": true}` |
| Date is taken | `200` | `{"available": false, "closestFreeDates": ["YYYY-MM-DD", …]}` |
| Bad date or unknown space | `400` | `{"detail": "..."}` |
| Throttled | `429` | `{"detail": "..."}` |

`closestFreeDates` holds **at most three** dates, soonest first, strictly after
the requested one, never in the past, and free **in the space that was asked
about**. The UI renders them as tappable chips and continues straight to step
2 when one is chosen, so a date offered here must be bookable — do not return
a date that the create endpoint would then reject.

A taken date is a `200`, not a `404`: "booked" is a successful answer to the
question, and the UI shows it as information, not an error.

### What it must NOT return

Only the venue's own calendar, never anyone's booking. No client name, no
reference, no event type, no "held by" — a visitor may not learn who booked a
date or even that a specific person did. `{"available": false}` is the whole
truth the public is entitled to.

### Rate limiting

Lighter than tracking, because nothing personal is exposed, but still
throttled per IP: walking a year of dates across both spaces maps the venue's
entire booking calendar, which is commercially sensitive even if it is not
personal data. A per-IP budget in the low hundreds per hour is ample for an
honest visitor comparing a few dates.

### Which dates are taken (mock only)

The mock has no database, so it fakes a booked calendar with a documented
rule: **main hall** is taken on the 8th, 14th and 22nd of every month;
**second space** on the 14th and 27th. The 14th is deliberately taken in both,
which is the case where "try the other room" does not help either. Delete the
rule with the mock — the real endpoint consults actual bookings.

---

# Create a booking request

```
POST /api/bookings/requests
Content-Type: application/json
```

Public and unauthenticated — the whole point of the flow is that no account is
needed. Backs B3 → B4.

Mock: `submitRequest` in `frontend/src/lib/mockBookings.ts`.

### Request body

```json
{
  "eventDate": "2027-03-21",
  "space": "main-hall",
  "eventType": "send-off",
  "guests": 150,
  "clientName": "Neema Kato",
  "phone": "0754 111 222",
  "decorPackage": "Premium"
}
```

`decorPackage` is `null` when the visitor chose "Decide later". `eventType`
is the slug the hero widget and `/book` both use (`wedding`, `send-off`,
`kitchen-party`, `birthday`, `corporate`). `phone` arrives as typed; the
server normalises it the same way tracking does.

### Responses

| Case | Status | Body |
| --- | --- | --- |
| Created | `201` | `{"reference": "ZK-2703-9653"}` |
| Validation failed | `400` | `{"detail": "...", "errors": {"<field>": "..."}}` |
| Date taken since step 1 | `409` | `{"detail": "...", "closestFreeDates": [...]}` |
| Throttled | `429` | `{"detail": "..."}` |

The booking is created with status `requested`, which is where `/track` picks
it up. Nothing is held and nothing is paid — the UI says so on both B3 and B4,
and the server must not imply otherwise by, say, writing `deposit_due`.

**The `409` matters.** Availability was checked at step 1; the visitor then
spent a minute typing their details. Re-check on create, and if the date went
in the meantime, say so with the same `closestFreeDates` shape as the
availability endpoint so the UI can offer chips rather than dead-end.

### THE REFERENCE MUST BE UNGUESSABLE

The mock derives the reference deterministically from the payload, purely so
tests can assert an exact value. **That must not ship.**

The reference is one half of the tracking credential. Tracking already treats
the 4-digit tail as low-entropy and leans on the phone number as the real
secret — but that only holds if the reference cannot be *derived*. A reference
computed from (phone, date, space) would let anyone who knows a person's phone
number and guesses their wedding date reconstruct it exactly, and read their
booking. Use a database sequence or random suffix, and keep the
`ZK-YYMM-NNNN` shape only as display formatting.

### Rate limiting and abuse

This endpoint writes to the database on an unauthenticated POST, so it is the
spam surface:

- throttle per IP and per normalised phone (a few per hour is generous — nobody
  books five weddings an hour)
- reject obviously bad input server-side: dates in the past, guests below 1 or
  above the venue's real capacity, names and phones over sane lengths
- consider a soft duplicate check (same phone + same date within minutes) and
  return the existing reference rather than creating twins reception has to
  reconcile by hand
- the deterministic `guests: 13` failure in the mock is a **mock-only** test
  hook; the real endpoint must not have it

---

# Request a site visit

```
POST /api/bookings/site-visits
Content-Type: application/json
```

Public and unauthenticated. Backs B8. A site visit is a **separate request
type** in the lifecycle, not a booking.

Mock: `submitSiteVisit` in `frontend/src/lib/mockBookings.ts`.

### Request body

```json
{ "day": "2026-11-10", "slot": "12:00", "phone": "0712 345 678" }
```

### Responses

| Case | Status | Body |
| --- | --- | --- |
| Created | `201` | `{"reference": "ZV-2611-9887"}` |
| Validation failed | `400` | `{"detail": "...", "errors": {...}}` |
| Throttled | `429` | `{"detail": "..."}` |

References use the `ZV-` prefix so reception can tell a visit from a booking at
a glance on a printed list. The same unguessability rule applies.

The response does **not** confirm the slot, and the UI is careful to say so:
"the slot is not held until reception confirms it". Do not change that to an
immediate confirmation without changing the copy — promising a slot the venue
has not agreed to is worse than asking the visitor to wait for an SMS.

Open questions for the owner, both marked `[bracketed]` on screen: the real
slot times (10:00 / 12:00 / 15:00 are placeholders) and whether Sundays are
genuinely closed (currently shown disabled).

---

# Definition of done — the three new endpoints

- [ ] Availability returns at most three free, future, same-space dates
- [ ] A taken date is `200 {"available": false}`, never `404`, and leaks no booking
- [ ] Create re-checks availability and returns `409` with chips if it slipped
- [ ] **References are unguessable** — sequence or random, never derived from the payload
- [ ] Create throttled per IP and per phone; past dates and absurd guest counts rejected
- [ ] Site visits use `ZV-`, and the response never claims the slot is held
- [ ] The `guests: 13` and phone-ending-13 mock failure hooks do not exist server-side
- [ ] `checkDate`, `submitRequest` and `submitSiteVisit` swapped to `fetch`, mocks deleted,
      and `/book` + `/site-visit` still walk end to end by hand
