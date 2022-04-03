# Development

## Release process

Work is carried out on `main` branch, with feature branches/forks/PRs as and when.

A release is carried out by:

1. Update the version number in the manifest (`module.json`).
2. Update the CHANGELOG.
3. Commit & push.
4. Create & push a tag which matches the version number with a lower-case "v" in front of it. E.g. if the version is `1.2.3`, the tag should be `v1.2.3`.

What then happens is, the tag matches a regex, which triggers a series of GitLab CI jobs:

* **build** checks that the version in the manifest matches the version in the tag, sets the `download` in the manifest to a versioned GitLab package URL, and kicks off a build.
* **upload** uploads the package to GitLab Packages, under the version and also as "latest". It *also* uploads the manifest, also versioned and `latest`.
* **release** creates a GitLab release with links to the versioned manifest, so you can go on the Releases page and get a link to a manifest for any previous version.

The checked-in manifest contains the `latest` URL for both `manifest` and `download`, so it's completely safe to install from there. Foundry should seamlessly start using the package-latest URL to check for updates.



