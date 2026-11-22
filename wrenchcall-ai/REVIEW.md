# WrenchCall AI — code review

Review of the site as restored from the `wrenchcall-ai-backup` archive. The seven files
in this directory are the backup **verbatim**; nothing below has been applied to them.

Verified by serving the site locally and driving it in headless Chromium at 1440×900 and
390×844: page load, call simulator (all 3 scenarios), ROI calculator, billing toggle,
pricing cards, trial modal and submit, FAQ accordion, mobile menu.

## What already works

No uncaught page errors. No failed internal requests, no dead `#` links, no duplicate
element IDs, no missing files. All 96 Lucide icons render. No horizontal overflow at
390px — the tier comparison table scrolls inside its own container as intended. The
simulator state machine is sound: it resets cleanly between scenarios, the transcript
auto-scrolls, the dossier fills progressively, and the SMS payload renders at the end.
The Netlify honeypot is correctly hidden. Escape and outside-click both close the modal
and restore body scroll.

## Bugs

### 1. Annual billing never reaches the signup form
`app.js` → `openModal()` hardcodes monthly prices:

```js
let priceText = tierName === 'Solo Wrench' ? '$79/mo' : (...'$299/mo' : '$149/mo');
```

With **Annual** selected, the cards correctly show $63/$119/$239, but the modal still
reads "Solo Wrench ($79/mo)" and the hidden `selected_tier` field posts that string to
Netlify. Every annual signup is captured at the monthly price. `openModal()` needs to
read `currentBilling`.

### 2. A failed lead submission still shows "success"
`handleTrialSubmit()` fires the Netlify POST and swallows every failure:

```js
fetch('/', {...}).catch(err => console.log('Lead captured:', err));
```

The success panel is then shown unconditionally. If the POST fails the lead is gone, the
visitor is told it worked, and the console says "Lead captured". Await the response, check
`res.ok`, and show a real error state with a fallback (phone number or mailto) otherwise.

### 3. One CDN outage breaks the whole demo
`lucide.createIcons()` is called unguarded in `resetSimulatorUI()`, `playDialogueStep()`,
`startSimulation()`, `finishSimulation()` and `handleTrialSubmit()`. This is not
theoretical — it happened during this review when unpkg was unreachable: `resetSimulatorUI`
threw at `DOMContentLoaded`, and the simulator died after the first message with the
dossier stuck on "Awaiting Call". The page's single most persuasive feature is one CDN
hiccup away from looking broken. Wrap the calls (`if (window.lucide) lucide.createIcons()`)
and consider vendoring Lucide locally.

### 4. Sticky header covers section headings on anchor jumps
`<html class="scroll-smooth">` plus a `sticky h-20` header, with no `scroll-margin-top` on
the targets. Clicking any nav link lands with the heading tucked behind the header — visible
in the simulator and mobile pricing screenshots. Fix: `section[id] { scroll-margin-top: 6rem }`.

### 5. Copy mismatch
The simulator intro says click **"Simulate Incoming Call"**; the button is labelled
**"Simulate Call Now"**.

## Deployment and performance

### 6. Year-long cache on unfingerprinted assets
`netlify.toml` sets `Cache-Control: public, max-age=31536000` for `/*.css` and `/*.js`, but
the files are `styles.css` and `app.js` — no content hash. Returning visitors can keep stale
JavaScript for up to a year after a deploy. Either hash the filenames or drop to something
like `max-age=0, must-revalidate` for these two.

### 7. Tailwind Play CDN in production
`cdn.tailwindcss.com` ships the JIT compiler to the browser and compiles on every page view;
it logs its own "should not be used in production" warning. For a page whose only job is
conversion, prebuild the CSS.

### 8. Header gaps
No cache policy for HTML, no `Content-Security-Policy`, and `X-XSS-Protection` is deprecated
and ignored by current browsers.

## Accessibility

9. **Five form controls have no programmatic label** — `fullname`, `business`, `trade`,
   `phone`, `email`. The `<label>` elements neither carry `for` nor wrap their input, so
   screen readers announce unlabeled fields. Add `for`/`id` pairs.
10. **The modal is not a dialog.** No `role="dialog"`, no `aria-modal`, focus stays on the
    button behind it when it opens, there is no focus trap, and focus is not restored on
    close. Keyboard users are left behind the overlay.
11. FAQ buttons lack `aria-expanded` / `aria-controls`; the hamburger lacks `aria-expanded`
    and an accessible name.
12. No skip link.

## SEO and sharing

13. No Open Graph or Twitter Card tags, no canonical URL, no favicon, no `robots.txt` or
    sitemap. Pasted into a contractor Facebook group or an SMS, the link previews as bare
    text — a real cost for a page meant to be shared.

## Claims and compliance

These are the highest-risk items on the page.

### 14. Fabricated testimonials and ratings
Three named testimonials ("Dave Miller, Miller & Sons Plumbing", "Marco Rossi", "Elena
Vasquez") with five-star ratings, specific revenue claims, and Unsplash stock photos of
real people used as their faces. Plus "4.9/5 from solo plumbers & repair crews", a "+850"
customer-count avatar stack, and "Contractors report capturing an extra $3,400/month".

The FTC's Rule on Consumer Reviews and Testimonials (16 CFR Part 465, in force since
October 2024) prohibits writing, selling or disseminating fake consumer reviews and
testimonials, including ones from people who do not exist, and provides for civil
penalties per violation. "67% of homeowners hire the first contractor who answers" is also
unsourced. Before this goes live: use real customers with permission, or keep the layout
and label the content as illustrative.

### 15. The ROI calculator overstates
- "Monthly lost revenue" is gross revenue, not margin — parts, labour and fuel are ignored.
- "Net profit" subtracts only the $149 subscription from that gross figure.
- The ROI multiple always divides by $149 regardless of which tier or billing period the
  visitor is looking at.
- At the top of the sliders it reports **$2,610,000/year** and **1459.7x ROI**, which reads
  as a joke to the tradesperson you are trying to convince.

Add a gross-margin input, divide by the tier actually selected, and cap the headline.

### 16. Call recording and AI disclosure
`voice-agent-config.json` sets `recordingEnabled: true`, but neither `firstMessage` nor the
system prompt tells callers the call is recorded. In two-party-consent states (CA, FL, PA,
WA, MA, IL and others) that notice is required. The agent also only admits to being AI when
asked; California's bot-disclosure law and newer state AI statutes point toward disclosing
upfront. A single sentence in the greeting covers both.

### 17. Liability in the emergency script
The prompt instructs callers to locate and operate shut-off valves, and quotes a fixed $89
fee for the tenant. Worth a liability review, and the fee should be per-tenant config
rather than baked into the prompt.

## Housekeeping

18. `README.md` still documents a machine-specific path: `cd /home/Ouijamac/projects/wrenchcall-ai`.
19. Doc drift: the README sells bilingual support as a $29/mo Pro add-on, but
    `voice-agent-config.json` is English-only; `VOICE_PROMPT.md` offers a choice of models
    while the config pins `gpt-4o-mini`.
