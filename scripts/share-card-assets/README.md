# Share card assets

These files are build-time inputs for `scripts/share-card.html`; only the final JPEG is published. Poppins 600 is bundled so card exports work without network access. The site's runtime font setup is unchanged.

Poppins v24 was downloaded from Google Fonts on November 14, 2026:
https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6V1s.ttf

It uses the SIL Open Font License; see `fonts/poppins-OFL.txt`.

## Goat illustration

`goat-peeking.png` was created with the built-in imagegen tool using `images/headshots/square/me_square_med.jpg` as a reference. The transparent generated asset is preserved without raster edits. The face, upper chest, and hooves peek over the “g” in “wang”; typography and placement are rendered in HTML/CSS.

Generation prompt:

> Use case: illustration-story. Create a small simple flat CLIP ART goat PEEKING OVER A HORIZONTAL EDGE, isolated on true transparent background. Reference photo is only for goat identity and its pink and blue decorations; do NOT copy photographic style. Show ONLY head, wide sideways floppy ears, tiny horns, a hint of upper chest, and two little front hooves at the bottom. NO full body, NO tall neck, NO legs, NO seated hindquarters. Compact short wide silhouette. Big friendly ivory goat face facing viewer, small black oval eyes and simple muzzle, gentle playful expression. Pink pompom on head and short muted blue and pink tassels beside ears echo the reference. Clean confident rounded dark charcoal outlines, flat ivory fills, a few simple tan shapes, 4-6 flat colors, bold readable silhouette at 90 pixels wide. Absolutely NO realistic fur, NO fur texture, NO painterly shading, NO gradients, NO photorealism, NO detailed bells. The face and tiny bit of chest rise above a single bottom baseline with two small hooves resting on that baseline as though peeking over lettering. Do not draw the edge itself. Tightly framed subject with small transparent margins, no text, no floor, no scenery, no shadow.
