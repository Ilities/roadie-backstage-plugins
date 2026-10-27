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
  ARGOCD_ANNOTATION_APP_NAMESPACE_PREFIX,
  useArgoCDAppData,
} from './useArgoCDAppData';

const entityWithAnnotations = (
  annotations: Record<string, string>,
): Entity => ({
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'sample-service',
    namespace: 'default',
    annotations,
  },
  spec: {
    type: 'service',
    owner: 'david@roadie.io',
    lifecycle: 'experimental',
  },
});

describe('useArgoCDAppData', () => {
  it('returns the generic app namespace when only argocd/app-namespace is set', () => {
    const entity = entityWithAnnotations({
      'argocd/app-name': 'guestbook',
      'argocd/app-namespace': 'my-test-ns',
    });
    const data = useArgoCDAppData({ entity });
    expect(data.appNamespace).toBe('my-test-ns');
    expect(data.appNamespaceByInstance).toEqual({});
    expect(data.getAppNamespace('argoInstance1')).toBe('my-test-ns');
    expect(data.getAppNamespace()).toBe('my-test-ns');
  });

  it('resolves per-instance namespaces from prefixed annotations', () => {
    const entity = entityWithAnnotations({
      'argocd/app-name': 'guestbook',
      'argocd/app-namespace/argoInstance1': 'aoa1',
      'argocd/app-namespace/argoInstance2': 'aoa2',
    });
    const data = useArgoCDAppData({ entity });
    expect(data.appNamespace).toBeUndefined();
    expect(data.appNamespaceByInstance).toEqual({
      argoInstance1: 'aoa1',
      argoInstance2: 'aoa2',
    });
    expect(data.getAppNamespace('argoInstance1')).toBe('aoa1');
    expect(data.getAppNamespace('argoInstance2')).toBe('aoa2');
  });

  it('falls back to the generic namespace for unknown instances', () => {
    const entity = entityWithAnnotations({
      'argocd/app-name': 'guestbook',
      'argocd/app-namespace': 'generic-ns',
      'argocd/app-namespace/argoInstance1': 'aoa1',
    });
    const data = useArgoCDAppData({ entity });
    expect(data.getAppNamespace('argoInstance1')).toBe('aoa1');
    expect(data.getAppNamespace('argoInstance2')).toBe('generic-ns');
    expect(data.getAppNamespace()).toBe('generic-ns');
  });

  it('does not treat the bare namespace annotation as a per-instance one', () => {
    const entity = entityWithAnnotations({
      'argocd/app-name': 'guestbook',
      'argocd/app-namespace': 'generic-ns',
    });
    const data = useArgoCDAppData({ entity });
    expect(Object.keys(data.appNamespaceByInstance)).not.toContain('');
    expect(ARGOCD_ANNOTATION_APP_NAMESPACE_PREFIX).toBe(
      'argocd/app-namespace/',
    );
  });
});
