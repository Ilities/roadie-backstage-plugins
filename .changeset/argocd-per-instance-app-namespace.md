---
'@roadiehq/backstage-plugin-argo-cd': minor
---

Add per-instance app namespace annotations `argocd/app-namespace/<instance-name>`, so the same app can live in a different Argo CD namespace on each cluster. The existing `argocd/app-namespace` annotation is unchanged and still applies to any instance without a per-instance annotation.
