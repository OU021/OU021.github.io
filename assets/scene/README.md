# Point-cloud story

Original stochastic surface geometry connects photography, 3D perception and a
personal fondness for Baymax, the character from Disney's *Big Hero 6*. The
unbranded camera, kapok flower and Baymax fan-art geometry are written for this
homepage; no external mesh or scanned model is included. The photographic stage
uses Zhilin Ou's existing `assets/photos/digital7.webp`, without editing that file.
The flower is an illustration inspired by the photo, not a recovered 3D scan or
a research result. The homepage has no affiliation with Disney.

Run `python3 scripts/generate-story.py` from the repository root to regenerate
these assets (NumPy and Pillow are needed only for this optional preparation).
The normal site build needs only Node.js.

Each of `camera.bin`, `photo.bin`, `flower.bin`, `baymax.bin`, `hold.bin` and
`hold2.bin` contains exactly 16,000 points. Camera, photograph, flower and Baymax
are drawn as separate objects in a shared WebGL scene. A shutter cap depresses,
the camera turns to its rear screen, and the photograph appears there before
expanding. The illustrated flower emerges from its location in the photograph,
orbits Baymax once, and moves into the waiting hands. The same flower geometry
persists throughout; unrelated objects do not morph into each other.

The camera uses local object coordinates, a recessed rear screen, and rear
controls. Front/lens particles are suppressed in the rear view to avoid seeing
through the sparse shell. The photo is a depth-tested texture with a restrained
warm blend; `photo.bin` supplies a particle-image fallback if the texture cannot
be uploaded. Run `python3 scripts/generate-story.py --camera-only` to regenerate
just the camera and its static fallback without changing other assets.

Baymax and both holding poses retain point correspondence: the head, eyes, arms
and hands move together. The source holding targets contain a legacy subset of
1,450 flower particles. The renderer identifies and excludes that exact subset
using the corresponding color changes, leaving 14,550 character points. This
keeps the separately moving flower continuous through the catch, without a
second flower appearing in the hands. The final arms and head interpolate
between the two holding poses. All samples are stochastic; there is no regular
surface grid. The photographic plane uses jittered cells to preserve coverage.

The loop lasts 42 seconds. Local preview URLs can freeze meaningful moments with
`?scene=shutter`, `rear`, `photo`, `emerge`, `flower`, `orbit`, `catch` or `hold`.
Chapter controls, pause, reduced motion, offscreen suspension, and the static
camera fallback are preserved.

The binary format has an 8-byte header (`ZOP1` and a little-endian uint32 count),
then 9-byte records: three little-endian int16 coordinates divided by 16384,
followed by three uint8 colors. `camera.webp` is the transparent static fallback
rendered from the same points. Color and motion are intentionally restrained.
