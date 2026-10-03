# Immutable historical Registry inputs

`react/0.1.0-alpha.0/manifest.json` preserves the original metadata-only Registry
snapshot byte for byte. Its Registry digest is
`sha256:095bda6190018ed0ee6882a7e74c7130692f227e0b4e5b108a950585e6a157ec`.
This release did not include source or Token artifacts; rebuilding must not add
current artifacts to this historical version.

The Registry builder restores missing historical outputs from these tracked
inputs on a clean checkout. It validates the manifest, any listed artifact hashes,
and exact file bytes. An existing historical output that differs causes a build
failure instead of being overwritten. Current editable release artifacts are
rebuilt from component, example, recipe, and Token source.
