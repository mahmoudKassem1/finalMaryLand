# Maryland Pharmacy Frontend UI/UX Theme Blueprint

Use this document as the design and product brief to recreate the Maryland Pharmacy frontend. Build a working storefront and management interface, not a marketing-only landing page. Preserve the pharmacy's bilingual Arabic/English experience, RTL support, product price-inquiry workflow, and operational/admin tools.

## 1. Product Identity and Experience

- **Product:** Maryland Pharmacy, a customer-facing pharmacy catalog and order-inquiry experience for Alexandria, Egypt, with a separate staff/admin workspace.
- **Brand qualities:** Trustworthy, clinically credible, contemporary, helpful, direct, locally grounded, and easy to scan.
- **Primary customer need:** Browse medicine, healthcare, personal care, beauty, baby, vitamins, and Maryland-exclusive products; add items to an inquiry list; then confirm live prices and delivery details with a pharmacist through WhatsApp.
- **Pricing behavior:** Treat product price as “Price on Request” rather than displaying a fixed price. Explain price variation briefly and provide a WhatsApp inquiry action.
- **Languages:** Arabic is the default. English is a complete alternate language. Keep language choice persistent and switch document language and direction with it.
- **Two related visual modes:** Use a light, calm storefront for clients and a dark slate operations workspace for admin pages. Both share the Maryland red brand accent and consistent interaction states.

## 2. Brand Color System

Use these values as design tokens. Keep the overall page light; red is the primary accent, not a full-page background.

| Token | Value | Use |
| --- | --- | --- |
| Brand primary | `#DC2626` | Main CTAs, active states, category icons, key links, focus rings, brand emphasis |
| Brand hover | `#B91C1C` | Hover/pressed primary action state |
| Brand light | `#FEE2E2` | Soft highlight, selected chips, error-adjacent surfaces |
| Ink / heading | `#0F172A` | Primary headings, body emphasis, key text |
| Body slate | `#475569` | Supporting copy and standard body text |
| Secondary slate | `#64748B` | Secondary labels and metadata |
| Muted slate | `#94A3B8` | Helper text, placeholders, disabled metadata |
| Page base | `#F8FAFC` | Cool, very light gray storefront canvas |
| Surface | `#FFFFFF` | Product cards, forms, panels, menus |
| Border | `#E2E8F0` | Standard subtle separators and controls |
| Border subtle | `#F1F5F9` | Card/image boundaries and low emphasis dividers |
| Admin base | `#0F172A` | Admin header, dark cards, admin work surfaces |
| Admin raised | `#1E293B` | Dark filters, inputs, segmented controls |
| Positive / WhatsApp | `#059669` / `#10B981` | Inquiry badges, WhatsApp actions, success states |
| Info / delivery | `#2563EB` | Delivery information and explanatory notices |
| Warning | `#F59E0B` | Caution, low-stock and operational warning states |
| Error | `#DC2626` | Destructive/error feedback; pair with text and icon |

The app also uses emerald, blue, amber, and occasional payment-provider colors for semantic states. Keep these localized to badges/notices/actions; do not let them replace the red/slate brand system. Avoid a purple-led palette.

## 3. Typography

- Load **Inter** for English and **Cairo** for Arabic, with suitable sans-serif fallbacks. The current HTML imports both from Google Fonts.
- Recommended explicit mapping for a recreation: `font-sans`/English → Inter; Arabic language or `font-arabic` → Cairo.
- Important implementation note: current source imports Inter and Cairo, but Tailwind’s default sans family remains the system UI stack and the source CSS does not define a `.font-arabic` utility. A rebuild should explicitly connect the imported families so this intended typography is reliable.
- Use a compact, bold hierarchy: `font-black` for page/section headings and important labels; `font-bold` for action labels and control titles; medium/regular for descriptive text.
- Headlines are usually slate, bold/black, often uppercase in English; use tight leading and tracking sparingly. Body text is slate with comfortable line-height.
- Common hierarchy: page headings around 24–36px; section headings 24–40px; card titles 11–14px; metadata 10–12px; button labels 10–14px. Arabic copy should remain naturally sized and never be forced into English uppercase styling.
- Use line clamps and reserved heights for repeated titles, especially product cards, to keep rows aligned.

## 4. Shape, Surface, and Elevation

- **Storefront cards:** White surface, thin slate border (`#F1F5F9` or `#E2E8F0`), restrained shadow, 16px-ish corners (`rounded-2xl`). Repeated product cards must remain compact and consistent-height.
- **Glass surfaces:** Use translucent white, a fine white/slate border, backdrop blur, and soft elevation for floating header and feature panels. Avoid making every content section a floating card.
- **GlassCard variants:** Light is translucent white with dark slate text; dark is translucent deep slate with white text; red is a soft red-tinted surface.
- **Buttons:** Primary actions use Maryland red and white text. Secondary actions may use deep slate. Outline actions use red border/text and a very light red hover. Use rounded-xl/2xl shapes; buttons may have a subtle press scale.
- **Inputs:** Rounded-xl/2xl, lightly tinted slate background, minimal border, strong red focus ring/border. Admin inputs use a deep slate fill and white text.
- **Separators:** Thin slate borders. Use spacing and typography first; avoid heavy boxes around every section.
- Existing `GlassCard` has a large default radius and heavy shadow; storefront callers often override it to a smaller rounded-2xl card. Match the specific page's density, not one radius indiscriminately.

## 5. Layout and Responsive Rules

- Use a centered responsive container, typically Tailwind `container mx-auto`, with horizontal gutters around 16px on mobile and 24px at wider sizes. Keep operational page content readable and avoid overly wide text lines.
- Use Tailwind's standard responsive breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.
- At mobile widths, favor vertical stacking, touch-sized controls, horizontal snap-scrolling category/product tracks, and compact two-column product grids.
- Product grid: 2 columns by default, 3 at `md`, 4 at `lg`, with compact gaps on mobile (`12px`) and larger gaps from `sm` (`24px`).
- Horizontal tracks must support touch scrolling, hide the scrollbar where appropriate, and use `snap-x`/snap alignment. Do not clip focus outlines or labels.
- Use stable aspect ratios for product images (square), fixed two-line title space, and consistent card structure. Product images use `object-contain` on white/light backgrounds so packaging is inspectable.
- The client header is fixed, translucent and rounded; reserve top padding in the page shell so content is not covered. It may hide while scrolling down and return while scrolling up.
- Use an intentional responsive layout, not scaled desktop controls. Ensure Arabic and long product names wrap rather than overflow.

## 6. Icons, Motion, and Feedback

- Use `lucide-react` line icons. Common icon families already in use include shopping cart/bag, search, user, menu, globe, package, category-specific health symbols, truck, shield, clock, award, message circle, map pin, and directional chevrons.
- Icons support the label; they should not replace an unfamiliar action label. Icon-only controls need an accessible name and, where helpful, a tooltip.
- Primary transitions are subtle: color/border/shadow changes, small hover scale on image/icon, active button scale, slide/fade menu transitions, and a slow trust-bar marquee. Avoid excessive decorative motion.
- Use loading skeletons or a centered red spinner; use empty states with a relevant icon, clear message, and a route back to browsing; show retry actions when fetching fails.
- Use toast feedback for cart additions, saves, login, and errors. Preserve meaningful disabled/loading states and prevent duplicate form submissions.
- Respect reduced-motion preferences in a recreation, especially for marquees, pulsing status indicators, and animated menus.

## 7. Bilingual, RTL, and Accessibility Requirements

- Arabic is the initial/default language. Persist selected language, update `<html lang>` and `dir`, and set the appropriate direction on page/component roots as well.
- Every visible string, including empty/loading/error states, buttons, tooltips, counts, form errors, and status labels, must have Arabic and English copy.
- For Arabic use `dir="rtl"`, right-aligned text when appropriate, and mirrored directional icons (arrows/chevrons). Do not mirror non-directional icons such as search, cart, globe, or medical symbols.
- Prefer CSS logical positioning (`start`/`end`) where available. Place search icons and input padding on the reading-start side for the selected language.
- Maintain visible keyboard focus, semantic headings, real buttons/links, form labels, useful alt text, and accessible names for controls. Do not rely on color alone to communicate stock, success, errors, or selected states.
- Keep touch targets comfortable on mobile (aim for at least 40–44px for primary controls).

## 8. Shared Navigation and Shell

### Client shell

- Floating top header: logo/menu, search, language toggle on desktop (also available from the account/menu on mobile), cart with item count, and account menu.
- Category drawer: full-height white panel sliding in from the language-leading side, dark translucent scrim, category links with red icons, active red state, and a brand footer.
- Breadcrumbs: home icon followed by route labels and direction-aware separators. Current page is non-link text.
- Back button: arrow direction switches with language and navigates to history when available, otherwise its fallback route.
- Footer: deep slate full-width block with brand, short localized description, location, WhatsApp and phone contacts, payment links, social links, and copyright/developer credit. On mobile it stacks; at wide widths it uses four columns.
- Toast notifications appear near the top center.

### Admin shell

- Replace the client header/footer with a sticky deep-slate admin header.
- Show Maryland Management wordmark, desktop nav for Dashboard/Orders/Add Product, language toggle, logout, and a collapsible mobile nav.
- Admin routes are protected; unauthenticated users go to the management login screen.
- Use dark slate panels/inputs and white text, with red active navigation and emphasis. Keep admin data dense, scannable, and task-oriented.

## 9. Main Page and Component Recipes

### Home `/`

Build the storefront home as a functional discovery page in this order:

1. **Hero:** Wide image/logo-led region with dark lower/side overlay, bilingual two-line trust headline, short quality statement, and red Shop Now CTA that scrolls to featured products. Use the existing pharmacy logo and hero image assets when available.
2. **Trust strip:** White band with continuously moving, duplicated items for fast delivery, product authenticity, professional support, and good prices. Red line icons, slate labels, subdued captions. Reverse marquee motion in RTL.
3. **Category bar:** Centered title/underline and horizontally swipeable round white icon buttons; include All Products plus Beauty, Personal Care, Mom & Baby, Health Care, Medication, Vitamins, Maryland. Active category uses a red ring and label.
4. **Maryland Exclusive:** Bold heading, “View All” link to `/category/maryland-products`, and horizontally snapping product cards at fixed widths.
5. **Featured products:** 2/3/4-column product grid and a bilingual “See More” CTA to `/shop`.
6. **Contact/commitment close:** Wide pharmacy-related image with a contact CTA, then a centered localized brand promise/signature block.

Keep this editorial hero unique to Home; catalog and account pages should open directly onto useful content.

### Category bar

- Reuse the same component on Home and Shop.
- Circle icon surface is white with red icon, thin ring/shadow and restrained hover lift.
- Mobile is horizontally scrollable with snap points; never wrap categories into multiple rows on narrow screens.
- Active state is determined from the current route; clicking a category navigates to its established path.

### Product card

- Square, white image frame; contained product image; optional red Maryland tag and stock overlay.
- Two-line title with fixed height, dark bold text, red hover emphasis.
- Compact green “Price on Request” accordion with explanation and WhatsApp CTA.
- Full-width primary add-to-cart action at the bottom. Disable when out of stock; toast on success.
- Clicking the card opens product detail. Buttons/accordion inside the card must stop propagation so they do not trigger the detail link.
- Keep card structure and footer aligned across grid rows.

### Shop `/shop`

- Start with breadcrumbs and back control, followed by shared category bar.
- Header includes “Shop All Products”/Arabic equivalent and a localized product count.
- Search, category filter, sort selection, and in-stock toggle are compact controls with clear labels.
- Show a responsive 2/3/4-column product grid, skeleton/loading, retryable error, localized empty state, and load-more or pagination behavior.
- Sorting includes latest, featured, and name; maintain query/data pagination consistently.

### Category `/category/:slug`

- Breadcrumb/back row, category title and short localized description, results/page count, product grid, empty state, and pagination.
- Preserve route shape and product-detail route `/category/:category/:id` (also support `/product/:id`).

### Search `/search`

- Show query-aware heading/results and a product grid using the same card and inquiry/cart interaction. Provide an empty state for no matches.

### Product detail

- Product-focused layout with large inspectable image, localized metadata, availability, price-on-request explanation and WhatsApp CTA, and prominent add-to-cart action. Breadcrumb/back navigation must preserve category return context where supported.

### Cart `/cart`

- Empty state: centered shopping-bag icon, clear empty message, return-to-shopping CTA.
- Filled state: item rows with thumbnail/title/availability, quantity stepper and remove action; a summary panel shows unique items and total units.
- Primary action proceeds to delivery/checkout. Secondary WhatsApp action builds a localized price-check message from item names and quantities.
- On desktop, use a two-column item-list/summary layout; summary may stay sticky. Collapse to one column on mobile.

### Checkout `/checkout`

- Protected route. Present delivery/contact details, saved-address selection/edit/add, payment preference, delivery fee guidance, and a clear step/progress explanation.
- Emphasize that the pharmacist confirms live prices and location-specific delivery fee through WhatsApp. Confirmation submits the inquiry/order and opens WhatsApp; show a clear success/reference state and post-submit payment guidance.
- Use red for primary progression, emerald for confirmed/success states, and blue for delivery information. Avoid suggesting card prices or online payment are finalized if the pharmacist must confirm them.

### Account and support pages

- Login, signup, forgot/reset password, profile, and order history use a narrow readable content column, white/glass panels, slate form labels, red focus/submit states, bilingual copy, and explicit loading/error feedback.
- Contact page prioritizes local contact methods, WhatsApp links, phone numbers, location, and social channels; use recognizable icons and direct actions.

### Admin pages

- **Dashboard:** dark cards with totals/trends, email notification management (up to three recipients), low-stock entry point, and inventory management.
- **Inventory:** searchable, filterable, paginated/infinite product management. Support edit, image upload/preview, Maryland flag, stock/category updates, deletion confirmation, and loading/error feedback.
- **Orders:** status filter tabs, search by customer/order, dense readable order details, status update controls, and guarded bulk delete. Use status colors and explicit confirmation for destructive operations.
- **Add Product:** structured form with image, title, category, description, stock/Maryland fields and clear save/cancel feedback.
- **Settings:** concise operational forms using dark admin surfaces and shared control styles.

## 10. Routing and Critical Behavior to Preserve

- `/` Home
- `/shop` all-product catalog
- `/category/:slug` category browse
- `/category/:categoryName/:id` and `/product/:id` product details
- `/search`, `/cart`, `/checkout`, `/my-orders`, `/profile`, `/contact`
- `/login`, `/signup`, `/forget-password`, `/reset-password/:resettoken`
- `/management/login`, `/management-panel` and its nested orders, inventory, add-product, settings pages
- Add-to-cart state persists in local storage and quantity changes update the cart badge.
- Price inquiry links open WhatsApp with URL-encoded localized content and selected product/order context.
- Do not replace inquiry-based ordering with fixed pricing or an unrelated payment flow.

## 11. Current Implementation Caveats for a Clean Rebuild

- `index.html` imports Inter and Cairo but the source Tailwind/CSS does not explicitly map them to English/Arabic font classes. Make that mapping explicit.
- The global stylesheet currently defines Tailwind layers, a light-only root, a teal scrollbar thumb, and `.no-scrollbar`; some page code also references utility classes such as `liquid-bg`, `animate-fade-in`, `custom-scrollbar`, and `font-arabic` without definitions in the source stylesheet/config. Recreate these intentionally (or remove references) instead of relying on undefined classes.
- A few existing pages use `black`, green, blue, amber, or purple payment accents. Preserve them only for semantics/third-party payment identity; keep slate and Maryland red dominant.
- Product data may omit an image or stock value; cards and management views need resilient fallbacks.
- The current product schema is inquiry-oriented and does not define a reliable retail `price` field. Do not display a price unless the data contract is deliberately changed.

## 12. Rebuild Acceptance Checklist

- [ ] Landing page, catalog, category, detail, cart, checkout, account, support, and admin screens are usable—not placeholders.
- [ ] Every visible UI state is fully translated into English and Arabic.
- [ ] Arabic switches the whole application to RTL; chevrons/back arrows and search placement adapt correctly.
- [ ] Mobile navigation, filters, forms, and product cards fit without horizontal page overflow.
- [ ] Product cards stay aligned in 2/3/4-column grids and images remain inspectable.
- [ ] Product prices remain “on request”; WhatsApp inquiry messages contain the correct product/order context.
- [ ] Loading, empty, error, success, disabled, and destructive-confirmation states are present.
- [ ] Client and admin shells remain visually distinct while sharing brand colors and accessible controls.
- [ ] The visual balance remains light, clean, cool-toned, and pharmacy-trustworthy, with red as the primary accent and no excessive decoration.
