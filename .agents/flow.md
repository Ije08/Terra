# Flow motion notes

- Start-screen motion uses compositor-safe opacity, transform, filter, and clip-path changes.
- Motion groups: star shimmer, Terra atmosphere drift, and Sol corona pulse.
- Reduced-motion mode freezes decorative motion while keeping the stars visible.
- Terra clouds are now a separate generated chroma-keyed layer; comet trails are CSS-only occasional passes over the black space field.
- Cloud and comet visuals were intentionally disconnected from the start screen for the title-only composition; the cloud asset remains available for a later pass.
- Loading feedback now follows the reference X-rotating boxes pattern: two centered square borders use `configure-clockwise` and `configure-xclockwise` at 3s ease-in-out alternate; the spinner is reused on the login black transition and plaza loading screen.
- Reduced-motion mode freezes the two boxes in a readable crossed state while preserving the loading text.
- Spinner boxes use explicit 50% centering and a 1600ms plaza loading window so the active state remains visually observable.
- Character walking now uses the existing male/female composite 4x4 sheets directly: the movement requestAnimationFrame loop chooses one of four cardinal directions and advances four frames at 120ms intervals. When movement stops, the neutral frame remains; reduced-motion mode freezes the frame while preserving facing direction.
- Entry and plaza navigation use one pure-black loading page held for 1600ms with destination-specific status text.
- The loading page intentionally contains only status copy and the X-rotating boxes; the progress bar was removed, and the boxes now use translucent gradients, backdrop blur, glass highlights, and soft glow.
- The provided CSS space effect was reduced to two repeated star layers, six cross-shaped bright stars, and one comet. The comet runs on a 28-second cycle but is visible for only about 2.2 seconds; reduced-motion hides it and freezes all added star motion.
- Start-screen comets now use six rotated tracks on one 30-second timeline with five-second phase offsets. Each pass lasts about 2.1 seconds, travels along its tail angle with transform-only motion, and remains disabled under reduced-motion.
- After title placement was finalized, the adjustment controls were removed from the rendered UI. The saved normalized position remains readable so the user-selected composition survives reloads; comet glow was reduced and a denser low-contrast star layer was added.
