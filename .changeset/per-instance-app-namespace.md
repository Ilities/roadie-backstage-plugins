---
'@roadiehq/backstage-plugin-argo-cd': minor
---

Support per-instance app namespace annotations. You can now set the Argo CD application namespace per instance with `argocd/app-namespace/<instanceName>` (e.g. `argocd/app-namespace/myprod-cluster: aoa1`). The existing `argocd/app-namespace` annotation keeps working as a fallback and is used for the cross-instance "find" lookup and for instances without a dedicated annotation.
