# Vision notes

- Selected direction: a cinematic route map as the single primary visual anchor, paired with one persistent planet-information panel. This keeps the first post-login decision obvious: inspect a route, then explicitly enter TERRA.
- Navigation uses four large, stable destinations: 항로, 교신, 전초기지, 작전. Resource totals and profile identity remain secondary in the header.
- Typography was raised to a 14–16px reading baseline for navigation and communication content, with 38–64px editorial headings.
- The communication view uses a broad two-column composition instead of a small floating chat dock.
- Rejected direction: a dense terminal dashboard made the page read as many unrelated cards and weakened the route decision.
- Rejected direction: a bright ivory editorial treatment diverged too far from the existing FIRST LIGHT dark-space identity.
- Route asset correction: the command route map must reuse the start screen's shared-coordinate transparent layers (`space-base`, `terra`, `luna`, `sol`) instead of a separate flattened route image or CSS-drawn substitute planets.
- Considered alternatives were cropped planet cards and select-to-swap full backgrounds; both were rejected because they break the continuous solar-system composition and weaken spatial orientation.
- Route layout correction: the route art remains full-bleed below a 78px header with `cover` sizing; planet information is a click-triggered overlay, not a permanent column that reduces the map.
- Header hierarchy is Korean navigation on the left and compact resource/profile status on the right. The FIRST LIGHT serif lockup moved into the map composition to match the start-screen identity.
- Route chat direction: use an MMORPG-style translucent HUD with channel tabs, online presence, timestamp/author hierarchy, and a compact command-aware composer. A plain enlarged message list and a Discord-like sidebar were rejected because they either lacked game context or obscured too much route art.
- Start authentication direction: reinterpret the reference's rounded fields, blurred card, and password visibility control as a two-zone FIRST LIGHT signal console. The space artwork remains visible but is dimmed behind the modal so account entry becomes the only active hierarchy.
- A full-page white authentication replacement was rejected because it discarded the established title composition; two permanently visible forms were rejected because they duplicated controls and made the start screen dense.
