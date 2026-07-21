# Asset and third-party license notes

This file separates the license for the project's original source code from the licenses and usage terms that may apply to media, generated assets, and dependencies.

## Original source code and project-authored documentation

The MIT License in `LICENSE` applies to the original source code and project-authored documentation in this repository unless a file states otherwise.

## Pixabay media

Pixabay-sourced images and other media are used under the [Pixabay Content License](https://pixabay.com/service/license-summary/). Pixabay's license summary permits free use, modification, and use without mandatory attribution, subject to its prohibited uses and any additional rights attached to a particular item.

The MIT License does not relicense Pixabay media. Do not redistribute a Pixabay file on a standalone basis, and check images containing recognizable people, brands, logos, or other protected material separately.

Before the final public release, record the Pixabay source page URL, creator name, and local file path for each Pixabay asset used by the project. The project currently does not claim that every media file under `public/assets/` is covered by MIT.

## Generated and supplied assets

Image-generation outputs, sprite sheets, user-supplied references, music, and other non-code assets may have terms separate from the MIT-licensed source code. Their reuse is limited to the permissions available for the source or generation workflow. The generation and QC history is kept in `.agents/PROJECT.md` and `docs/build-week/STATUS.md` where available.

## Dependencies

Packages under `node_modules/` and third-party libraries retain their own licenses. Their license files are not relicensed by this repository's MIT License.
