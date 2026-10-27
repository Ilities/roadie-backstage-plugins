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
import {
  getAppNamespacesByInstance,
  useArgoCDAppData,
} from './useArgoCDAppData';

const entityWithAnnotations = (annotations: Record<string, string>): Entity =>
  ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'my-app', annotations },
  } as Entity);

describe('getAppNamespacesByInstance', () => {
  it('returns an empty map when there are no per-instance annotations', () => {
    expect(
      getAppNamespacesByInstance(
        entityWithAnnotations({
          'argocd/app-name': 'my-app',
          'argocd/app-namespace': 'aoa1',
        }),
      ),
    ).toEqual({});
  });

  it('maps instance names to namespaces', () => {
    expect(
      getAppNamespacesByInstance(
        entityWithAnnotations({
          'argocd/app-selector': 'app=my-app',
          'argocd/app-namespace/myprod-cluster': 'aoa1',
          'argocd/app-namespace/my-non-prod-cluster': 'aoa2',
        }),
      ),
    ).toEqual({
      'myprod-cluster': 'aoa1',
      'my-non-prod-cluster': 'aoa2',
    });
  });

  it('ignores an annotation with an empty instance name', () => {
    expect(
      getAppNamespacesByInstance(
        entityWithAnnotations({ 'argocd/app-namespace/': 'aoa1' }),
      ),
    ).toEqual({});
  });
});

describe('useArgoCDAppData', () => {
  it('keeps returning the global appNamespace annotation', () => {
    const entity = entityWithAnnotations({
      'argocd/app-name': 'my-app',
      'argocd/app-namespace': 'aoa1',
    });
    const result = useArgoCDAppData({ entity });
    expect(result.appNamespace).toBe('aoa1');
    expect(result.appNamespaces).toEqual({});
    expect(result.appName).toBe('my-app');
  });

  it('returns per-instance namespaces alongside the global one', () => {
    const entity = entityWithAnnotations({
      'argocd/app-selector': 'app=my-app',
      'argocd/app-namespace': 'fallback',
      'argocd/app-namespace/myprod-cluster': 'aoa1',
    });
    const result = useArgoCDAppData({ entity });
    expect(result.appNamespace).toBe('fallback');
    expect(result.appNamespaces).toEqual({ 'myprod-cluster': 'aoa1' });
  });
});
