# Where’s Ralph?

A quiet tribute to Ralph, using seven photo cutouts across Home, About, Writing, Archive, Travel, China, and United States. England & Scotland has no find. There is no public game link or permanent counter.

## Behaviour and local preview

The first find introduces Ralph. Each discovery fades him away, shows one counter whose numerator rolls from the previous count to the new count while `/7` stays still. The same counter holds briefly and fades once, over 1.4 seconds total. Reduced motion shows a stationary count for one second. Duplicate activation never counts twice. On mouse hover or keyboard focus, Ralph grows by 5% around his hiding edge, with the pointer cursor and no added glow or shadow. Keyboard focus retains its visible outline. Reduced motion keeps the focus ring without movement; touch devices do not get a lingering hover state.

The homepage Ralph uses the bone-chewing photo, hanging upside down beneath the menu with the muzzle concealed by the capsule so only his eyes and ears peek out. His rolling counter appears below the menu, clear of its edge. He is centered on the page, which sits slightly left of the capsule’s center on mobile. He stays aligned with the menu while fading from full opacity at the top to invisible after 360px of scrolling, and fades back in on returning to the top. The hidden muzzle portion is clipped from the image itself, so it cannot show through the translucent menu during scrolling. While invisible he cannot intercept clicks or keyboard focus. This also applies when he returns as the prize-reopening button after completion.

Progress uses `kevin-ralph-hunt-v1` in localStorage, with sessionStorage fallback. It contains only found spot IDs and whether the introduction was shown. Different origins (localhost, Vercel preview, production), browser profiles, or devices have separate progress. Clearing site data resets the hunt. If neither storage mechanism is available, the message explains that cross-page progress cannot be saved.

**Temporary local-review behaviour:** refreshing on localhost or a loopback address resets all finds and the introduction, so Kevin can replay without a private window or console command. Clicking links between pages still preserves progress. Other hostnames retain the intended behaviour of remembering finds across refreshes and later visits. Remove this temporary local exception when review is finished.

The seventh find opens the prize. After completion, the homepage Ralph returns and reopens the prize, including after a refresh. The email link uses the existing site contact address and subject `I found all the Ralphs, let’s talk`.

Run `npm run dev` and open http://127.0.0.1:4173. To replay the hunt, run this in the browser’s developer console after an animation finishes:

```js
resetRalphHunt()
```

The function returns `true` when reset succeeds and `false` while a discovery animation is running. There is deliberately no visible reset button. Do not change the versioned storage key for ordinary copy or styling changes; that would reset visitors’ progress.

This feature is preserved on `v2.1` for a later release. Keep it off `redesign/v2` and `main` until Kevin asks to include it.

## Assets and editing prompts

The seven transparent PNG cutouts are in `images/ralph/`, resized to a maximum edge of 320px for small display sizes. Original photos remain untouched in Kevin’s Photos Library. The assets were prepared with the built-in imagegen tool, then resized with macOS `sips`. Photo numbers below refer to Kevin’s set of 18 supplied photos.

| Saved asset | Supplied photo | Subject instruction |
|---|---|---|
| `home.png` | Earlier HEIC test photo | Ralph with his tongue touching the large pale bone. Retain the dog, paws and bone; remove the window, door, rug and room. Preserve the original face and expression. The site rotates this cutout upside down and clips the bone and muzzle behind the menu. |
| `about.png` | #8 | Ralph holding the small orange basketball; retain the ball, ears, face, chest and visible paws. Remove human arms/legs and background. |
| `writing.png` | #4 | Ralph lying on his side, with his head tilted toward the camera. Retain the photographed face, body and legs; remove gray clothing, couch and pillow. This cutout peeks below the Writing note. |
| `travel.png` | #16 | Ralph standing on a picnic table. Retain his entire body, all four paws, collar and tag; remove the table and outdoor background. |
| `china.png` | #1 | Ralph in his red plaid and black winter coat. Retain the entire dog and coat, including paws and exact face; remove the entryway, towel, shoes and surroundings. |
| `us.png` | #10 | Ralph reaching up with his tongue out. Retain his exact face, tongue, ears, chest and front legs. Remove the human leg, sock and floor. |
| `archive.png` | #14 | Ralph asleep under the yellow-and-white blanket. Retain the complete head, upright ear, naturally visible portion of the second ear beside the pillow, front paw and modest draped blanket. Remove sofa, pillows and loose bedding; do not invent a fully upright hidden ear. |

The editing prompt for each cutout used the subject instruction above with these constraints:

> Use case: background-extraction. Edit target: provided real photograph of Ralph, Kevin’s late French bulldog. Remove only the background to make a faithful photographic cutout. Preserve the exact photographed features, fur markings, expression, proportions and pose. Do not redraw, stylize, beautify or invent missing anatomy. True transparent alpha background, clean natural fur edges, tight framing with a little transparent padding. No text, sticker outline, shadow or other objects.

Light/dark edge contrast is applied in CSS rather than baked into the photos. Keep placement controls outside travel photo links and filterable grids. They are ordinary keyboard-accessible buttons, hidden until JavaScript restores their saved state.

## Layout regression checks

`tests/browser/ralph-layout.spec.mjs` checks the rendered opaque pixels of each cutout rather than just its transparent button rectangle. It verifies contact with the intended hiding edge within 2px, enough visible image to recognize Ralph, no overlap with visible headings or links, and real clicks/taps on an opaque part of each dog. Both themes run at desktop, tablet, phone, and small-phone widths. An additional homepage sweep covers 320, 360, 390, 430, 700, 701, 768, 820, 1024, and 1440px widths at several scroll positions. Mouse hover must keep every dog attached to its edge.

Use explicit flex alignment on `.ralph-button`: browsers otherwise vertically center the shorter clipping window in the minimum-height button, creating gaps or protrusions. Anchor hover scaling at each cutout’s hiding edge rather than translating the whole button. Keep at least 48px above the mobile Writing note so its Ralph does not overlap the preceding article link.

These are Chromium browser layout checks; they do not replace a physical iPhone/Safari check or human review of whether each pose looks natural. Remote travel images and fonts are stubbed during automated tests.

### Local audit results

The new checks reproduced the homepage gap (5.45px on desktop, 7.57px on phones), cutouts extending past the Archive/Travel/US edges (approximately 9–11px), and the Writing cutout overlapping the preceding article link on phones. Explicit flex alignment fixed the common cause; extra clearance above the mobile Writing note fixed the link overlap. Hidden headings inside closed timeline details are excluded from overlap measurements because they are not painted.

After these fixes: all 31 applicable new layout cases passed (five cases intentionally skip duplicate resize sweeps or hover on touch devices). The full browser suite passed 163 cases with nine expected skips; the four build/unit tests and static build passed. These checks were completed during local review before the feature was deferred to `v2.1`.

Blue-panel cutouts use actual overflow clipping at the panel edge. Do not restore blue foreground patches: hover scaling can expose image edges around those patches. A separate regression checks the clipping-window boundary during hover for About, Writing, and China.

Archive uses the blanket pose at 76.8px wide (20% above the original size), with the whole head and visible portions of both ears in frame. Writing uses the sideways lounging pose, peeking beneath the blue Medium note. Its hidden button portion is clipped as well, so the Medium link remains clickable.

- The Travel overview Ralph sits above the United States album card (selected by slug, not card position), at 73.6px wide: 15% larger than his original 64px. He is lowered 2px relative to the proportionally scaled placement. Keep a 1px bleed BEHIND the album card at rest and on hover, with the card link painted above the cutout so the bleed is never visible. Do not paint Ralph on top of the photo to hide a seam.
