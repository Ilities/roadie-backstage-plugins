/*
 * Copyright 2021 Larder Software Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity } from '@backstage/catalog-model';

export const ARGOCD_ANNOTATION_APP_NAME = 'argocd/app-name';
export const ARGOCD_ANNOTATION_APP_SELECTOR = 'argocd/app-selector';
export const ARGOCD_ANNOTATION_APP_NAMESPACE = 'argocd/app-namespace';
/**
 * Prefix for per-instance app-namespace annotations. The full annotation name
 * is `argocd/app-namespace/<instance-name>` and the value is the namespace to
 * use for that specific Argo CD instance. This allows the same app to live in
 * differently named namespaces across clusters.
 */
export const ARGOCD_ANNOTATION_APP_NAMESPACE_PREFIX = 'argocd/app-namespace/';
export const ARGOCD_ANNOTATION_PROJECT_NAME = 'argocd/project-name';
export const ARGOCD_ANNOTATION_PROXY_URL = 'argocd/proxy-url';

/**
 * Extracts a mapping of Argo CD instance name to app namespace from entity
 * annotations of the form `argocd/app-namespace/<instance-name>`.
 */
export const getPerInstanceAppNamespaces = (
  entity: Entity,
): Record<string, string> => {
  const annotations = entity?.metadata.annotations ?? {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(annotations)) {
    if (
      key.startsWith(ARGOCD_ANNOTATION_APP_NAMESPACE_PREFIX) &&
      key.length > ARGOCD_ANNOTATION_APP_NAMESPACE_PREFIX.length &&
      typeof value === 'string' &&
      value.length > 0
    ) {
      const instanceName = key.slice(
        ARGOCD_ANNOTATION_APP_NAMESPACE_PREFIX.length,
      );
      result[instanceName] = value;
    }
  }
  return result;
};

/**
 * Resolve the app namespace for a given Argo CD instance, preferring the
 * per-instance override (if present) and falling back to the entity-wide
 * default. Returns `undefined` when neither is set.
 */
export const resolveAppNamespaceForInstance = (
  instanceName: string | undefined,
  defaultAppNamespace: string | undefined,
  perInstanceAppNamespaces: Record<string, string>,
): string | undefined => {
  if (instanceName && perInstanceAppNamespaces[instanceName]) {
    return perInstanceAppNamespaces[instanceName];
  }
  return defaultAppNamespace;
};

export const useArgoCDAppData = ({ entity }: { entity: Entity }) => {
  const appName =
    entity?.metadata.annotations?.[ARGOCD_ANNOTATION_APP_NAME] ?? '';
  const appSelector =
    entity?.metadata.annotations?.[ARGOCD_ANNOTATION_APP_SELECTOR] ?? '';
  const appNamespace =
    entity?.metadata.annotations?.[ARGOCD_ANNOTATION_APP_NAMESPACE];
  const appNamespaces = getPerInstanceAppNamespaces(entity);
  const projectName =
    entity?.metadata.annotations?.[ARGOCD_ANNOTATION_PROJECT_NAME];
  const url =
    entity?.metadata.annotations?.[ARGOCD_ANNOTATION_PROXY_URL] ??
    '/argocd/api';
  if (!(appName || appSelector || projectName)) {
    throw new Error("'argocd' annotation is missing");
  } else if (appName && (appSelector || projectName)) {
    throw new Error(
      "Cannot provide both 'argocd/app-name' and 'argocd-app' annotations",
    );
  }
  return {
    url,
    appName,
    appSelector,
    appNamespace,
    appNamespaces,
    projectName,
  };
};
