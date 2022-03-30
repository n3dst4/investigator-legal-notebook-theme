# Development

## Release process

Main work is carried out on `main` branch.

We also have a `release` branch will occasionally be scooted forwards to `main`.

The manifest that is checked into git gives the download URL as

```
https://gitlab.com/n3dst4/investigator-legal-notebook-theme/-/jobs/artifacts/release/raw/package/investigator-legal-notebook-theme.zip?job=build
```

Which means "the artefact `package/investigator-legal-notebook-theme.zip` from the most recent run of the `build` job on the `release` branch."

The `module` field is:

```
https://gitlab.com/n3dst4/investigator-legal-notebook-theme/-/jobs/artifacts/release/raw/module.json?job=build
```

Which is the same but refers to the `module.json` that was constructed at the time.



### How to do a release

