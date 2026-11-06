<p align="center">
  <img src="public/logo.svg" alt="" width="112">
</p>

<h1 align="center">Homebox Front</h1>

<p align="center">
  A public, shop-like window onto your <a href="https://github.com/sysadminsmedia/homebox">Homebox</a>
  inventory: send someone a link and they see what you have and whether it is free to borrow.
</p>

> **A note on AI:** Homebox Front is developed by a human with AI assistance
> (mostly Claude Code) helping write, refactor and review code. It's not "vibe
> coded" or auto-generated: every change is reviewed, tested against a live
> Homebox and shipped intentionally. That said, I'm all in on AI as a
> development tool. It massively speeds up the work and lets a solo developer
> ship features and fixes at a pace that wouldn't be possible otherwise. I'm
> sharing this openly so you know what's behind the project.

Homebox is great for keeping track of what you own, but it is an internal tool.
Homebox Front puts a friendly, read-only storefront in front of it. A collective
can show the party gear it lends out, friends can see which machines you would
lend them, and nobody needs a Homebox account to look.

Each **page** has its own link and shows one or more Homebox locations, including
everything below them. Visitors browse, search and filter like in an online shop,
see at a glance what is available or lent until when, and contact you through the
buttons on each item. **Homebox stays the single source of truth**: the app reads
everything through the Homebox API and only ever writes one custom field, `Verleih`
(lending), which you can also edit by hand in Homebox.

The interface is in German.

## What it looks like

A page in the *showcase* layout, with its own logo and accent colour. Locations
and Homebox tags become filters; only what is *not* freely available is marked.

![A showcase page: header with logo, title and search, location and category filters, item cards](docs/screenshots/shop-showcase.png)

The *classic shop* layout with a sidebar, and an item page with gallery,
Markdown description, manuals and one button per contact channel.

![Classic shop layout with sidebar filters](docs/screenshots/shop-classic.png)

![Item page: gallery, status, contact buttons, description, facts and manual](docs/screenshots/item-detail.png)

Built for the phone, because links are shared via messenger. The request button
stays under the thumb; partially lent items say how many are left and when more
come back.

<p>
  <img src="docs/screenshots/mobile-shop.png" alt="Mobile shop page" width="300">
  <img src="docs/screenshots/mobile-item.png" alt="Mobile item page with fixed request bar" width="300">
</p>

Light and dark follow the device, or can be forced in the settings.

![The showcase page in dark mode](docs/screenshots/dark-shop.png)

The admin: lend several items in one go with a return date and a private
borrower name, and configure each page.

![Admin item list with three items selected and the bulk lending bar open](docs/screenshots/admin-items-bulk.png)

![Admin page editor](docs/screenshots/admin-page-form.png)

## Features

**For visitors**
- Shop-style pages per link: search, filter by location and category (Homebox tags),
  "only available", pagination. Filters live in the URL, so a filtered view can be shared.
- Honest availability: "Verfügbar", "2 von 10 verfügbar", "Verliehen bis 14.11.",
  "Wieder da ab …". A loan ends automatically after its date. Who borrowed something
  is never shown publicly.
- Item pages with a swipeable gallery and fullscreen view, Markdown descriptions,
  manuals and other attachments (per page you choose which kinds are shown).
- One button per contact channel: Telegram, mail (pre-filled with the item name),
  phone, plus WhatsApp/Signal links from the free-text notes.
- Optional password per page.

**Per page**
- Three layouts: classic shop, showcase with header, compact list.
- Logo, accent colour (presets or custom; kept readable in light and dark and away
  from the red/green used for availability), intro text, contact heading,
  "So läuft's" (how borrowing works) and which item fields are visible.

**For you (single admin)**
- Lend and return from the admin list, or directly on a public item page while logged in.
- Lend several items at once, with quantities, date presets and borrower suggestions.
- Everything is written to Homebox; partial quantities are supported.
- Items with a hidden tag (default `privat`) never appear on any page.

## How it works

| What | Where |
|---|---|
| Items, photos, manuals, locations, tags | Homebox (read via API) |
| Lending | Homebox custom field `Verleih` on the item |
| Pages, passwords, logos, colours, settings | Local SQLite file (`data/app.db`) |

The `Verleih` field holds one entry per loan, separated by `; `:

```
6× bis 2026-11-14 (Max); 2× bis 2026-12-01
```

`N×` is the quantity (default 1), `bis YYYY-MM-DD` the last day of the loan
(Europe/Berlin), `(…)` an optional borrower that only the admin sees. Available =
quantity minus active loans. The parser is tolerant, so you can edit the field by
hand in Homebox; unreadable entries are kept and flagged in the admin, never
silently dropped.

When the app writes, it reads the item fresh, changes only `Verleih`, sends the
complete item back (Homebox clears fields that are missing from a `PUT`) and reads
it again to make sure nothing else changed.

Homebox data is cached for up to 60 seconds. Lending from the app refreshes it
immediately; for changes made directly in Homebox there is a reload button in
the admin.

## Quick start

### Prerequisites

- Node.js 22.5 or newer (uses the built-in `node:sqlite`)
- A Homebox instance (v0.26 or newer, tested with 0.27) and an API key from it

### 1. Install

```bash
git clone https://github.com/stanislavhannes/homebox-front.git
cd homebox-front
npm install
cp .env.example .env.local
```

### 2. Configure `.env.local`

```bash
# Your Homebox and an API key (Homebox → Profile → API keys)
HOMEBOX_URL=https://homebox.example.org
HOMEBOX_TOKEN=

# Password for /admin
ADMIN_PASSWORD=

# Random secret for cookies, at least 32 characters: openssl rand -base64 48
SESSION_SECRET=

# Where pages and settings are stored
DATABASE_PATH=data/app.db

# 1 = sample data instead of Homebox, to try it without a token (writes nothing)
HOMEBOX_MOCK=0
```

### 3. Run

```bash
npm run dev            # development, http://localhost:3000
# or
npm run build && npm run start
```

Open `/admin`, log in, create a page, pick its locations and share the link.
The start page `/` deliberately lists nothing; pages are only found through
their link.

## Security

- The Homebox API key never leaves the server.
- Photos and attachments are served through a proxy that checks that the item
  belongs to the requested, published (and unlocked) page and that the attachment
  type is enabled for it. Guessing IDs gets you nothing.
- Borrower names, lending controls and other admin-only data are only rendered
  for a logged-in admin.
- Page passwords and the admin session use signed, http-only cookies; failed
  logins are rate-limited.

## Development

```bash
npm test               # unit tests (vitest): lending parser, availability, PUT body, contacts …
npx tsc --noEmit       # type check
npx eslint src         # lint
```

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4 and
shadcn/ui. Design notes live in [`DESIGN.md`](DESIGN.md), product context in
[`PRODUCT.md`](PRODUCT.md).

## Project layout

```
src/app/[slug]/            public pages and item pages
src/app/admin/             admin (pages, items/lending, settings)
src/app/api/               image/attachment proxy, page logos
src/components/shop/       shop views, cards, gallery, contact
src/lib/homebox/           Homebox API client, mock data, safe updates
src/lib/loans.ts           lending format and availability
```
