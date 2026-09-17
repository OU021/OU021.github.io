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
`hold2.bin` contains exactly 16,000 points. Baymax and both holding poses retain
point correspondence: the head, eyes, arms and hands move together. A subset of
1,450 points leaves the torso to form the flower when the hands meet. The camera,
photograph and flower use projected Morton order for shorter morph paths; one
shared ordering preserves point correspondence across all Baymax poses. All samples
are stochastic; there is no regular surface grid. The photographic plane uses
jittered cells to preserve even image coverage.

The binary format has an 8-byte header (`ZOP1` and a little-endian uint32 count),
then 9-byte records: three little-endian int16 coordinates divided by 16384,
followed by three uint8 colors. `camera.webp` is the transparent static fallback
rendered from the same points. Color and motion are intentionally restrained.
