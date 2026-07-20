# Builder notes

- This slice keeps authentication local because Firebase is explicitly outside the verified implementation scope in `docs/build-week/STATUS.md`.
- `readStoredProfile` treats `localStorage` as an untrusted boundary and validates the stored shape before using it as a `CharacterProfile`.
