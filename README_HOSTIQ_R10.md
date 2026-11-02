# ZaMaGui | Full visual correction r10

## What changed
- Fixed missing styles after prior upload: page styles now use a new, uniquely named stylesheet (solutions-layout-r10.css), loaded after the shared CSS. Old stylesheet cache references were replaced in every HTML file.
- All 36 direction cards have crisp semantic SVG illustrations instead of oversized raster photos.
- Each direction has a unique featured card, original palette, thematic illustrations, and responsive layout.
- Native expandable details are accessible and reflow the grid. Cards use page-specific lead CTAs.
- All 3 languages (UK/EN/RU), both themes. White image details retain their original colors.
- Added localized articles at /stories.html, /en/stories.html, /ru/stories.html to make blog links real.
- Existing forms, PHP integration endpoints, and interactive ecosystem graph retained.
- Light-themed illustration variants are also used within a contrast panel in dark mode so white eyes, teeth and robot details are not changed by baked-in dark image retouching.
- Dark-mode outline buttons have accessible foreground/background contrast.

## HostIQ deployment
1. Back up your current website (including .htaccess and PHP configuration).
2. Deploy to a staging subdomain first. Upload the contents of the ZIP directly into the document root (`public_html` only if it is your intended root).
3. Do not upload an extra top-level folder: `index.html`, `assets`, `en`, `ru`, `api` must be siblings.
4. Check /ai.html, /en/ai.html, /ru/ai.html at widths 360, 768 and 1440 and both themes.
5. Open any solution card and verify that the grid reflows, the illustration stays inside the card and the CTA links to contact.
6. Check localized article links, contact forms, PHP/CRM delivery, SSL/HTTPS and graph.
7. Clear HostIQ/CDN caches and remove the old release only after staging QA.

## Production note
The archive provides frontend and PHP integration points but does not complete your private CRM, mail, legal or payment setup. Validate actual lead delivery before public use.

## Verification completed in the build environment
- 86 HTML files reviewed: 70 content pages and 16 intentional legacy redirects.
- 688 browser-layout combinations checked across four viewport widths (320, 375, 768, 1440) and two themes, with no horizontal text or page overflow detected.
- 216 additional checks of the six solution pages in three languages, including opening/closing details cards, with no element or illustration overflow detected.
- Static links, local assets, JavaScript/PHP syntax and translation file presence checked.
- Actual HostIQ production, CRM/email delivery and external CDN caching still require final acceptance testing.

## Deployment structure
The ZIP itself has NO outer directory. On extraction, `index.html`, `assets/`, `en/`, `ru/`, `api/`, and `.htaccess` must be directly in the chosen Document Root.
