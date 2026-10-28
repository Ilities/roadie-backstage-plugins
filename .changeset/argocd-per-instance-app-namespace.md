---
'@roadiehq/backstage-plugin-argo-cd': minor
---

Add support for per-instance `argocd/app-namespace/<instance-name>` annotations
so that the same Backstage entity can target differently named app namespaces
across multiple Argo CD instances (for example `prod-mynamespace-gitops` on a
`myprod-cluster` instance and `npr-mynamespace-gitops` on a
`my-nonprod-cluster` instance). The existing `argocd/app-namespace` annotation
keeps working as before and is used as the fallback when no instance-specific
annotation matches.
