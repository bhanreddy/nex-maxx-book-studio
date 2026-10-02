# Publisher logo

The original supplied PNG lives at `public/assets/brand/nex-maxx-logo.png`. The editor header, dashboard and startup screen share the `PublisherLogo` component. No image proxy or external request is needed.

New books and existing books recovered on this device receive one native image element on the first physical page. The default width is 144 pt (2 inches), keeping the 608 px source above 300 effective DPI. The image retains the supplied typography, coloured X, tagline and NexSyrus attribution.

The first-page element is editable with the existing image tools. Move or resize it like any other image. Intentional edits and removal persist; the one-time migration does not reinsert it on every reload.

For example, a cover with a title at 180 pt receives the logo in the free space above it. A page already filled by content receives a new branded cover in front, preserving the existing content and folios.

The existing export pipeline embeds the local image in the print layout proof. Offline startup warms the same preflight worker used by export, along with the logo and print fonts. `scripts/auditLogoIntegration.mjs` verifies recovery, duplicate prevention, offline reload and offline proof export against a production server.

Every page also receives a shared publisher footer: a thin rule, the original logo at 60 pt width, and “Powered by NexSyrus”. Canvas, visible thumbnails and both PDF exporters use the same positioned scene. Existing custom footer text and folios remain; automatic folios are suppressed on covers, decorative frames and pages with their own numbers.

Layout margins reserve at least 60 pt at the bottom for the branded footer and trim clearance. Decorative pages retain their larger safe margins. For example, a plain content page shows branding with its folio on the right; a Scholar Wave page shows branding above the bottom ornaments and keeps its existing number badges.

The shared Scholar Wave border uses the original burgundy ribbons and peach washes, with no leaves, flowers or illustrated objects. New books start with it. Older books receive a one-time book-wide upgrade, including previously disabled covers and chapter-only borders. “Every page in this book” also governs new pages and imported chapter snapshots. Later intentional removal persists.

Open **Page borders** at the top of the left sidebar, or **Layout → Page borders**. Choose a palette, keep **Every page in this book**, then click **Apply to all pages**. The editor shows the number of bordered pages and a live preview. Individual page or chapter customization is still available through the scope selector.

Paper renders behind native content; the wave artwork renders above full-page backgrounds in the canvas, thumbnails and both export paths. `scripts/auditPageBorders.mjs` verifies the visible manual control, palette application, future-page inheritance, local recovery and offline exports.
