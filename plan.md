# Digital Loyalty Card Platform: Project Plan

Inspired by [fidelix.ma](https://fidelix.ma/en). Built solo, for the Algerian market, on a near-zero budget.

_Last updated: stack changed to Neon + Drizzle + Better Auth; wallet section corrected._

---

## 1. Project Summary

A SaaS platform where small businesses (cafés, bakeries, barbers, etc.) create a digital loyalty card. Customers get the card on their phone with no app to install. Staff scan the customer's QR code at the till to add a stamp or points. Owners see simple stats.

**Who builds it:** me **Market:** Algeria. **Billing:** manual (cash or BaridiMob). The developer extends each business's subscription by hand.

### Out of scope (decided)

- Email campaigns
- AI adviser
- Automated online payments

---

## 2. What the Product Is

Four systems:

1. **Merchant dashboard:** create a programme (stamps or points), set rewards and brand colours, view stats, manage staff.
2. **Customer card:** a branded web card (PWA) with a QR code. Wallet passes (Apple / Google) come later.
3. **Till scanner:** a staff-only mobile web page that scans the QR and adds a stamp or points. Works offline in Phase 2.
4. **Retention features:** follow-ups, referrals, review bonus, nearby notifications (later, mostly wallet-dependent).

---

## 3. Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js (App Router) + React + TypeScript (strict) | One codebase for UI and backend |
| UI | Tailwind CSS + shadcn/ui + lucide-react | Fast, consistent UI |
| Backend | Server Actions + Route Handlers | No separate API server |
| Database | **One** Neon Postgres database | Generous free tier, no inactivity pause of the project |
| ORM | Drizzle (`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`) | Typed queries, simple migrations |
| Auth | Better Auth + Drizzle adapter, **organization plugin** | Businesses, members and owner/staff roles built in |
| Files | Vercel Blob | Logos only |
| i18n | next-intl, set up from day one (FR first, AR later) | Retrofitting RTL and translations later is painful |
| Package manager | Bun | Fast. Do not use Bun-specific APIs in app code |
| Hosting | Vercel | See hosting note below |
| QR generation | `qrcode` | Simple |
| QR scanning | `html5-qrcode` or browser BarcodeDetector | Works in a PWA |
| Offline (Phase 2) | Service worker (e.g. Serwist) + IndexedDB | Next.js has no built-in service worker |

---

## 4. Wallet Passes: Algeria Notes

Wallet passes are an upgrade, not the foundation. The product must work fully as a web card (PWA) first.

### Apple Wallet

- Needs a paid Apple Developer account (about $99/year) to sign passes.
- Payment: an international Visa card should solve the payment problem (the earlier concern was about local-only Algerian cards).
- Enrollment: people in Algeria do publish iOS apps, so it is probably possible. **Verify** at developer.apple.com/programs/enroll with your own Apple ID (you can go up to the payment step for free).
- Apple Wallet **passes** are separate from Apple Pay **payments**. Passes do not depend on Apple Pay being offered in your country.

### Google Wallet

- Creating loyalty cards through the Google Wallet API is free.
- Unverified: whether the Google Wallet **app** is available on Algerian phones. Availability is decided by Google country by country. Morocco working does not prove Algeria works.
- **How to check (about 1 hour):**
  1. Open a free issuer account in the Google Pay & Wallet Console.
  2. Create a demo loyalty pass using the Wallet API quickstart.
  3. Add test phones' Google accounts as test users.
  4. Open the save link on 3-4 Android phones in Algeria.
  5. Also search "Google Wallet" in the Play Store on an Algerian phone.

### Decision table

| Apple   | Google  | Plan                                     |
| ------- | ------- | ---------------------------------------- |
| Works   | Works   | Build both in Phase 3                    |
| Works   | Doesn't | Apple only, web card for Android         |
| Doesn't | Works   | Google only, web card for iPhone         |
| Doesn't | Doesn't | Web card only (still a complete product) |

**Rule:** do not promise wallet cards to a shop owner until you have seen a pass save on a real phone.

---

## 5. Data Model

Better Auth creates its own tables (`user`, `session`, `account`, `verification`, and with the organization plugin: `organization`, `member`, `invitation`). Treat **organization = business**.

Your own tables:

| Table | Purpose | Key fields |
| --- | --- | --- |
| `locations` | Shops belonging to a business | organization_id, name, address |
| `programs` | Loyalty programme config | organization_id, type (`stamps` / `points`), stamps_required, colours, logo_url |
| `rewards` | What customers can redeem | program_id, label, cost |
| `customers` | A customer of one business | organization_id, name, phone |
| `cards` | Customer's card in a programme | customer_id, program_id, balance, **token** (random, secret) |
| `transactions` | Every stamp / points event | card_id, staff_user_id, amount, type, **client_uuid (unique)**, created_at |
| `redemptions` | Rewards given out | card_id, reward_id, staff_user_id, created_at |
| `subscriptions` | Manual billing | organization_id, paid_until |

**Important details**

- `cards.token` is a long random value. The QR code contains the token, never a plain ID.
- `transactions.client_uuid` is unique. It is generated on the device and prevents double-counting when offline scans sync.
- Every tenant table carries `organization_id` (directly or through its parent) and is only accessed through the data-access layer.

---

## 6. Security Basics

- QR contains a random token only. The server looks up the card from it.
- Per-card cooldown (for example, one stamp per few minutes) to prevent accidental double scans.
- Every transaction records which staff member performed it, so owners can spot abuse.
- Staff roles limited to scanning. They cannot see revenue or the customer list.
- Owners can revoke staff access in one click.
- Every server action checks the session and the organization membership before touching data.
- Privacy: write a short privacy policy. Check Algerian personal-data requirements (Law 18-07) before launch.

---

## 7. Phase 1: MVP (one shop can use it)

**Complexity: easy to medium.** Hardest parts: tenant scoping done correctly, camera scanning on real phones (iOS Safari is picky), and double-stamp prevention. **Estimated effort:** 3-4 weeks part-time.

### Steps

**Step 1: Setup**

- `bun create next-app`, add Tailwind and shadcn/ui, set up next-intl (FR only).
- Create a Neon project, connect Drizzle, deploy an empty page to Vercel.
- Done when: your site is live at a URL and connects to the database.

**Step 2: Auth and database**

- Set up Better Auth with the Drizzle adapter and the organization plugin.
- Generate the auth tables, then add your tables (`programs`, `customers`, `cards`, `transactions`).
- Build the data-access layer: every query requires `organizationId`.
- Done when: two test businesses exist and neither can read the other's data through your code.

**Step 3: Merchant login and programme setup**

- Signup, login, create the business (organization).
- Form to create a stamp programme: name, logo (Vercel Blob), colour, stamps needed, reward label.
- Done when: a business owner can create their programme.

**Step 4: Customer join page**

- Public page `/j/[business]` with name and phone.
- Creates the customer and a card with a random token.
- Done when: you open the link on your phone and receive a card.

**Step 5: Customer card page**

- Branded page showing the QR code and stamp progress.
- PWA manifest so it can be added to the home screen.
- Done when: the card opens from the home screen like an app.

**Step 6: Staff scanner**

- Page that opens the camera, reads the QR, and adds a stamp (atomic write via `db.batch()`).
- Cooldown to block accidental double scans.
- When the card is full, show "reward ready" and reset on redeem.
- Done when: scanning one phone with another makes the stamp appear.

**Step 7: Basic dashboard**

- Customer count, visits per day, rewards given.
- Done when: the owner sees real numbers after test scans.

**Step 8: Real-world test**

- Give it to one real shop for a week.
- Write down everything that confuses people.

**Phase 1 exit criteria:** one real shop uses it daily without your help.

---

## 8. Phase 2: Sellable

**Complexity: medium to hard.** Contains the hardest feature in the project: offline mode. **Estimated effort:** 4-6 weeks part-time.

### Steps

1. **Staff accounts**
   - Owner invites staff through the organization plugin. Staff role sees only the scanner.
   - Revoke access in one click.
2. **Offline till mode** _(hardest part)_
   - Service worker caches the scanner page.
   - Scans are saved locally in IndexedDB with a `client_uuid`.
   - Sync when the connection returns. The unique `client_uuid` prevents duplicates.
   - **Scope-down option:** start with "cache the page and queue scans" and improve later.
3. **Points and rewards menu**
   - Programme type `points`, with several rewards at different costs.
4. **Admin page for you**
   - List businesses, set `paid_until` after a cash or BaridiMob payment.
   - Block or limit accounts past their paid date.
5. **Languages**
   - Arabic (with right-to-left layout) and English added to next-intl.
6. **Shareable programme page**
   - Public page showing the rewards, shareable on Instagram or WhatsApp.
7. **Tooling (optional)**
   - Add Ultracite / lefthook now if you want them.

**Phase 2 exit criteria:** you can sign up a new shop, collect payment manually, and the till keeps working with the internet off.

---

## 9. Phase 3: Wallet and Retention

**Complexity: mixed.** Apple Wallet is hard (certificates, signing, push web service). Google Wallet is medium. Most other features are easy. **Estimated effort:** open-ended, 1-3 months depending on what you pick. Optional: you can launch and charge without it.

### Steps (in this order)

1. **Run the wallet checks** from section 4 (Apple enrollment, Google test on real phones).
2. **Google Wallet pass** (medium), if it works on Algerian phones: REST API, an "Add to Google Wallet" button on the card page, update the pass on each stamp.
3. **Apple Wallet pass** (hard), if enrollment works: certificates, pass signing, push web service.
4. **Nearby notifications** (easy once passes exist): add the shop's coordinates as a location on the pass. The phone's OS handles the rest.
5. **Referrals:** customers invite friends and both earn a bonus.
6. **Google review bonus:** link to the shop's review page plus a reward (honour-based or manual).
7. **NFC tags:** write the join URL onto cheap NFC tags or cards so customers tap to join.
8. **Follow-ups (no email):**
   - "You're 1 stamp away" banner on the web card.
   - A list for the owner of customers who have not visited in X days, to contact by WhatsApp.
   - Wallet-pass messages, once wallets exist.

---

## 10. Complexity Summary

| Phase | Difficulty | Hardest part | Effort (part-time) |
| --- | --- | --- | --- |
| 1: MVP | Easy to medium | Tenant scoping, camera scanning | 3-4 weeks |
| 2: Sellable | Medium to hard | **Offline mode** | 4-6 weeks |
| 3: Wallet and retention | Mixed | Apple Wallet | 1-3 months, optional |

---

## 11. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| A query forgets `organizationId` and leaks data | One data-access layer, no direct table queries in pages, test with two businesses in Step 2 |
| Camera scanning breaks on some phones | Test on real iPhones and Androids early in Step 6 |
| Double stamps | Cooldown + unique `client_uuid` + atomic writes via `db.batch()` |
| Offline sync bugs and duplicates | Unique `client_uuid`, and the scope-down option |
| Apple enrollment fails | Treat Apple Wallet as optional; web card is the product |
| Google Wallet unavailable in Algeria | Same: web card is the fallback |
| Vercel Hobby is non-commercial | Check terms; budget for a paid plan or move to a VPS when charging |
| Tooling and setup eat time | Delay Ultracite / lefthook until after Phase 1 |
| Building features nobody asked for | Get Phase 1 into a real shop's hands as soon as possible |
| Shops and staff don't actually use it | Train staff in person; print the QR for the counter |

---

## 12. Working Method

- Work on **one step at a time**. Don't start the next until the "done when" check passes.
- Get Phase 1 to one real shop quickly. Real feedback beats extra features.
- Keep a short list of "things that confused the shop" and fix those before adding anything new.

---

## 13. Immediate Next Actions

- [ ] Install Bun and confirm Node is available (`bun -v`, `node -v`).
- [ ] Create Neon and Vercel accounts.
- [ ] Check Apple enrollment (free, up to the payment step).
- [ ] Test a demo Google Wallet pass on a few Algerian Android phones (can wait until Phase 3).
- [ ] Pick one real shop (a café, bakery or barber you know) for the Phase 1 test.
- [ ] Start **Step 1 and Step 2**: project setup, Better Auth with the organization plugin, and the Drizzle schema with the tenant-scoped data-access layer.
