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
  getPerInstanceAppNamespaces,
  resolveAppNamespaceForInstance,
  useArgoCDAppData,
} from './useArgoCDAppData';

const makeEntity = (annotations: Record<string, string>): Entity => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'sample-service',
    namespace: 'default',
    annotations,
  },
  spec: {},
});

describe('getPerInstanceAppNamespaces', () => {
  it('returns an empty map when no per-instance annotations are present', () => {
    expect(
      getPerInstanceAppNamespaces(
        makeEntity({
          'argocd/app-name': 'guestbook',
          'argocd/app-namespace': 'my-test-ns',
        }),
      ),
    ).toEqual({});
  });

  it('extracts per-instance namespace annotations keyed by instance name', () => {
    expect(
      getPerInstanceAppNamespaces(
        makeEntity({
          'argocd/app-selector': 'app=guestbook',
          'argocd/app-namespace/myprod-cluster': 'prod-mynamespace-gitops',
          'argocd/app-namespace/my-nonprod-cluster': 'npr-mynamespace-gitops',
        }),
      ),
    ).toEqual({
      'myprod-cluster': 'prod-mynamespace-gitops',
      'my-nonprod-cluster': 'npr-mynamespace-gitops',
    });
  });

  it('ignores the base app-namespace annotation and empty values', () => {
    expect(
      getPerInstanceAppNamespaces(
        makeEntity({
          'argocd/app-namespace': 'default-ns',
          'argocd/app-namespace/': 'ignored-no-instance',
          'argocd/app-namespace/empty-cluster': '',
          'argocd/app-namespace/good-cluster': 'good-ns',
        }),
      ),
    ).toEqual({ 'good-cluster': 'good-ns' });
  });

  it('tolerates entities without annotations', () => {
    expect(
      getPerInstanceAppNamespaces({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'x', namespace: 'default' },
        spec: {},
      } as Entity),
    ).toEqual({});
  });
});

describe('resolveAppNamespaceForInstance', () => {
  it('returns the per-instance namespace when the instance matches', () => {
    expect(
      resolveAppNamespaceForInstance('prod', 'default-ns', {
        prod: 'prod-ns',
        nonprod: 'npr-ns',
      }),
    ).toBe('prod-ns');
  });

  it('falls back to the default when no per-instance override exists', () => {
    expect(
      resolveAppNamespaceForInstance('other', 'default-ns', {
        prod: 'prod-ns',
      }),
    ).toBe('default-ns');
  });

  it('returns undefined when neither override nor default is set', () => {
    expect(
      resolveAppNamespaceForInstance('whatever', undefined, {}),
    ).toBeUndefined();
  });

  it('falls back to the default when instance name is undefined', () => {
    expect(
      resolveAppNamespaceForInstance(undefined, 'default-ns', {
        prod: 'prod-ns',
      }),
    ).toBe('default-ns');
  });
});

describe('useArgoCDAppData', () => {
  it('surfaces both the default appNamespace and the per-instance map', () => {
    const entity = makeEntity({
      'argocd/app-selector': 'app=guestbook',
      'argocd/app-namespace': 'default-ns',
      'argocd/app-namespace/myprod-cluster': 'prod-mynamespace-gitops',
      'argocd/app-namespace/my-nonprod-cluster': 'npr-mynamespace-gitops',
    });

    const result = useArgoCDAppData({ entity });

    expect(result.appSelector).toBe('app=guestbook');
    expect(result.appNamespace).toBe('default-ns');
    expect(result.appNamespaces).toEqual({
      'myprod-cluster': 'prod-mynamespace-gitops',
      'my-nonprod-cluster': 'npr-mynamespace-gitops',
    });
  });

  it('keeps backwards compatibility when only the legacy annotation is set', () => {
    const entity = makeEntity({
      'argocd/app-name': 'guestbook',
      'argocd/app-namespace': 'my-test-ns',
    });

    const result = useArgoCDAppData({ entity });

    expect(result.appName).toBe('guestbook');
    expect(result.appNamespace).toBe('my-test-ns');
    expect(result.appNamespaces).toEqual({});
  });

  it('throws when the argocd annotations are missing', () => {
    expect(() => useArgoCDAppData({ entity: makeEntity({}) })).toThrow(
      "'argocd' annotation is missing",
    );
  });
});
