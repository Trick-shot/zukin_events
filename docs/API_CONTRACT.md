# API contract — booking tracking

Status: **contract only, not implemented.** The backend arrives in milestone
(b); this document is what it has to satisfy.

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
