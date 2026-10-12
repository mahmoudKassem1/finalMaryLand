# Maryland Pharmacy Mobile Product Card Blueprint

This document records the existing web product-card design and a practical blueprint for recreating it in the Expo app as a stable two-column mobile grid. The goal is a 2-column layout with the first four products forming a 2×2 block; additional products continue in subsequent rows.

## Reference Files

- [`frontend/src/components/ProductCard.jsx`](frontend/src/components/ProductCard.jsx): shared web card structure and card-level interactions.
- [`frontend/src/components/PriceInquiryNotice.jsx`](frontend/src/components/PriceInquiryNotice.jsx): compact price accordion, translations, and WhatsApp action.
- [`frontend/src/components/ui/GlassCard.jsx`](frontend/src/components/ui/GlassCard.jsx): shared surface treatment and default radius.
- [`frontend/src/components/ui/SquircleButton.jsx`](frontend/src/components/ui/SquircleButton.jsx): primary button colors, shape, and press state.
- [`frontend/src/pages/client/Home.jsx`](frontend/src/pages/client/Home.jsx): Maryland carousel and featured-product grid.
- [`frontend/src/pages/client/Shop.jsx`](frontend/src/pages/client/Shop.jsx): shared card usage, loading skeletons, pagination, and single-open accordion state.
- [`frontend/src/pages/client/CategoryPage.jsx`](frontend/src/pages/client/CategoryPage.jsx) and [`frontend/src/pages/client/SearchPage.jsx`](frontend/src/pages/client/SearchPage.jsx): current alternate grids; these pages currently use their own card markup.
- [`frontend/themes.md`](frontend/themes.md): broader brand and responsive design system.

## Existing Web Behavior

### Responsive product layouts

| Surface | Small screens | Wider screens | Notes |
| --- | --- | --- | --- |
| Home featured | 2 columns | 3 at `md`, 4 at `lg` | `gap-3` (12px) by default, `sm:gap-6` (24px). Home shows up to eight featured products. |
| Shop results | 2 columns | 3 at `md`, 4 at `lg` | Same responsive columns and gaps as Home; page size is 24. |
| Maryland selection | Horizontal carousel | Fixed-width cards grow at `sm`/`md` | 185px on mobile, 260px at `sm`, 280px at `md`; cards do not shrink and use snap scrolling. |
| Category and Search | 1 column | 2 at `md`, 3 at `lg` | These screens currently duplicate product-card markup rather than reuse `ProductCard`. Use the shared card and two-column mobile rule if visual consistency across all lists is required. |

On Home, the outer content uses 12px mobile horizontal padding and the featured grid uses a 12px gap. For a viewport width `W`, the approximate web card width is `(W - 24px - 12px) / 2`. Use the actual available content width, not the device width, if the page is nested in a padded container.

### Card anatomy

The shared web card is a full-height, vertically stacked, clickable surface:

1. **Outer surface:** white/light GlassCard, 12px padding on mobile and 16px from `sm`, thin pale slate border, rounded corners, and restrained hover elevation. The web `GlassCard` supplies a translucent white surface, blur, and a large default radius; the product-card caller also supplies `bg-white` and `rounded-2xl`. When reproducing the mobile design, use one deliberate white surface and one compact corner radius instead of stacking competing surface treatments.
2. **Image frame:** square aspect ratio, white background, rounded-xl corners, very light border, and 12px separation below. Product media uses `object-contain` with inner padding so packaging remains inspectable. Missing images show a red-tinted category-initial fallback.
3. **Overlays:** a small red Maryland badge at the logical start/top corner; an out-of-stock state uses a translucent white image overlay and a dark status pill. The product can also be identified through `isMaryland`.
4. **Title:** bold/black slate text, at most two lines, clamped and given reserved vertical space. Web sizing is 11px on mobile, 12px at `sm`, and 14px at `md`; its title slot is 28px on mobile and 36px at `sm`. The title turns brand red on hover.
5. **Price notice:** compact green “Price on Request” disclosure with a status dot and chevron. When open it shows a short market-price explanation and a full-width green WhatsApp action. Prices are intentionally not displayed as fixed values.
6. **Primary action:** full-width Maryland-red add-to-cart button pinned to the bottom of the card. The action is disabled when `stock === 0`; a successful add produces a toast.

The product card accepts `product`, `addToCart`, `navigate`, `lang`, `t`, `isNoticeOpen`, and `onToggleNotice`. Home and Shop hold one `openNoticeProductId`, so only one card’s price notice can be open at a time on that page. Both notice controls and add-to-cart stop click propagation so they do not navigate to product detail.

## Expo / React Native Translation

### Two-column small-screen grid

Use a normal flex-wrap `View` when the list is inside an outer vertical `ScrollView`; do not put a non-scrolling `FlatList` inside that `ScrollView`. Keep the two cards in each row at equal widths, and stretch their wrappers so a row containing an expanded price accordion shares the taller row height.

```tsx
const GRID_GAP = 12;
const GRID_PADDING = 16;
const columnWidth = Math.floor(
  (windowWidth - GRID_PADDING * 2 - GRID_GAP) / 2
);

<View style={styles.gridContainer}>
  {products.map((product) => (
    <View key={product._id} style={[styles.gridCardWrapper, { width: columnWidth }]}>
      <ProductCard product={product} />
    </View>
  ))}
</View>
```

Use `useWindowDimensions()` so the columns recalculate after rotation or a window-size change. If the screen is dedicated to a long catalog, use a single vertical `FlatList` with `numColumns={2}` as that screen’s scroller instead; do not nest it inside another vertical list or scroll view.

```tsx
const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
  },
  gridCardWrapper: {
    alignSelf: 'stretch',
  },
});
```

With 16px horizontal padding and a 12px column gap, two cards are each approximately `(W - 32px - 12px) / 2`: 138px at a 320px viewport, 158px at 360px, and 173px at 390px. At the narrow end, prevent label overflow: allow the price label to shrink/truncate, keep the dot and chevron from shrinking, and keep the CTA label on one line with a compact font size.

### Card layout and row alignment

- Keep the image frame fixed at 125px high in the native card, with `resizeMode="contain"`; a square web image becomes a compact fixed-height slot in the narrow native grid.
- Reserve a 36px title slot and use `numberOfLines={2}`. Use a one-line category label where available.
- Make the outer card and content body `flex: 1`; use `display: 'flex'` and `justifyContent: 'space-between'` so the action remains at the bottom when the accordion is closed.
- Let an open accordion participate in normal layout flow. Do not position it absolutely or put it in a modal, popup, or alert.
- Apply Android `UIManager.setLayoutAnimationEnabledExperimental(true)` behind an Android platform check, then call `LayoutAnimation.configureNext(...)` before toggling the accordion state.
- Stop event propagation in the accordion header, WhatsApp CTA, and add-to-cart action. Keep the card-level press navigation on the outer card only.
- Use a minimum closed-card height if needed for visual rhythm, not a fixed height that clips expanded accordion content. Let the open row grow naturally; stretch the sibling wrapper to the row height.
- Keep image, title, notice, and primary-action order identical in the Maryland carousel and featured grid. The carousel can use its wider 185px mobile card width while sharing the same component.

For the app’s product data, resolve the image from the existing `image` field, retain an initials/icon fallback when it is missing, treat only `stock === 0` as out of stock, and keep product description optional. The Maryland badge should depend on the product’s Maryland flag/category data rather than its position in a list.

### Accordion behavior

- Use a controlled `isOpen`/`onToggle` pair when a screen should allow only one expanded notice at a time; key the state by product ID. A card-local state is acceptable for a list that intentionally permits multiple open notices.
- Keep the notice text short enough for a 2-column card. Suggested English copy: “Due to market fluctuations, our pharmacist confirms current prices directly via WhatsApp.” Provide the equivalent Arabic translation and keep the notice root `dir` aligned with the active language.
- Use an emerald-tinted compact header, a small status dot, and a direction-independent disclosure chevron that rotates when open. The expanded area uses a lightly tinted slate surface, a short description, and a full-width emerald WhatsApp action.
- Encode product name and ID in the WhatsApp message. Keep the label visible and accessible; do not rely on the WhatsApp icon or color alone to explain the action.
- When toggling one notice open, close the previously open product notice. The row may grow, but card contents must not overlap and the action remains anchored to the row’s bottom.

## Brand and Type Tokens

| Use | Web reference |
| --- | --- |
| Maryland primary/action | `#DC2626` |
| Primary hover | `#B91C1C` |
| Primary tint | `#FEE2E2` |
| Heading/ink | `#0F172A` |
| Supporting text | `#475569` |
| Secondary text | `#64748B` |
| Page base | `#F8FAFC` |
| Card surface | `#FFFFFF` |
| Subtle border | `#F1F5F9` / `#E2E8F0` |
| Price/WhatsApp positive state | emerald; approximately `#059669` action and pale emerald surface |

Use compact bold labels and body text with enough line-height to remain legible at 2-column widths. The web theme uses Inter for English and Cairo for Arabic; map suitable native fonts if available. Do not force uppercase on Arabic text. Use logical start/end positioning for badges and preserve RTL order for text and directional controls.

## Consistency Gaps to Address When Implementing

1. Home and Shop already share `ProductCard` and its controlled accordion. Preserve the same component props and behavior when recreating these lists in React Native.
2. Category and Search currently render separate, larger cards and use one column on mobile. Replace that duplicated markup with the shared card and the same two-column mobile grid if those pages should match Home/Shop.
3. The web Home featured selection randomizes products in the current implementation. The card blueprint does not require random ordering; retain the app’s chosen deterministic ordering/pagination policy separately.
4. The Maryland carousel and the two-column grid need different widths, but not different card content or interaction behavior.

## Acceptance Checklist

- [ ] At 320px, 360px, and 390px screen widths, two cards fit per row without horizontal overflow.
- [ ] The first four products form two rows of two; later products continue in the same grid.
- [ ] Image frames remain 125px high and title slots remain 36px/two lines.
- [ ] With either card’s accordion open, both cards in that row share a stable outer height; their image/title baselines stay aligned and buttons do not float or overlap.
- [ ] Tapping the price disclosure, WhatsApp CTA, or add action never navigates to product detail unintentionally.
- [ ] Maryland badge, missing-image fallback, stock overlay, loading/empty states, and disabled add action remain correct.
- [ ] Arabic and English text fit, RTL layout uses logical edges, and price/CTA controls remain usable at narrow widths.
- [ ] The mobile app uses no nested vertical virtualized list and contains no `StyleSheet.absoluteFillObject` usage.
- [ ] The carousel still uses the shared card and remains horizontally scrollable at its wider fixed card width.