# Quest notes

- Build Week character scope is deliberately modular: do not generate every full visual combination. Store head, hair, outfit, and color as profile selections and compose them at runtime once 256px aligned layers arrive.
- Head style direction: `cute` = round, bright, approachable; `composed` = sharp, calm, confident; `pioneer` = practical, curious explorer. The selected names are stable data keys so generated art can be replaced without changing saves.
- Character frame contract: 256×256px transparent frames, fixed feet anchor, same canvas and scale across all layers. The game shell now accepts 8-direction input; diagonal frames temporarily reuse the nearest cardinal composite until the new asset pass.
- Scope decision: mining and logging should use a shared interaction pose plus floating tool overlay and skill FX rather than separate equip/unequip animation sets.
