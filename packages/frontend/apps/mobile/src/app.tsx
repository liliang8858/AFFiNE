import { AffineContext } from '@affine/core/components/context';
import { AppFallback } from '@affine/core/mobile/components';
import { configureMobileModules } from '@affine/core/mobile/modules';
import { router } from '@affine/core/mobile/router';
import { configureCommonModules } from '@affine/core/modules';
import { I18nProvider } from '@affine/core/modules/i18n';
import { configureLocalStorageStateStorageImpls } from '@affine/core/modules/storage';
import { PopupWindowProvider } from '@affine/core/modules/url';
import { configureIndexedDBUserspaceStorageProvider } from '@affine/core/modules/userspace';
import { configureBrowserWorkbenchModule } from '@affine/core/modules/workbench';
import {
  configureBrowserWorkspaceFlavours,
  configureIndexedDBWorkspaceEngineStorageProvider,
} from '@affine/core/modules/workspace-engine';
import {
  Framework,
  FrameworkRoot,
  getCurrentStore,
  LifecycleService,
} from '@toeverything/infra';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

const future = {
  v7_startTransition: true,
} as const;

const framework = new Framework();
configureCommonModules(framework);
configureBrowserWorkbenchModule(framework);
configureLocalStorageStateStorageImpls(framework);
configureBrowserWorkspaceFlavours(framework);
configureIndexedDBWorkspaceEngineStorageProvider(framework);
configureIndexedDBUserspaceStorageProvider(framework);
configureMobileModules(framework);
framework.impl(PopupWindowProvider, {
  open: (target: string) => {
    const targetUrl = new URL(target);

    let url: string;
    // safe to open directly if in the same origin
    if (targetUrl.origin === location.origin) {
      url = target;
    } else {
      const redirectProxy = location.origin + '/redirect-proxy';
      const search = new URLSearchParams({
        redirect_uri: target,
      });

      url = `${redirectProxy}?${search.toString()}`;
    }
    window.open(url, '_blank', 'noreferrer noopener');
  },
});
const frameworkProvider = framework.provider();

// setup application lifecycle events, and emit application start event
window.addEventListener('focus', () => {
  frameworkProvider.get(LifecycleService).applicationFocus();
});
frameworkProvider.get(LifecycleService).applicationStart();

export function App() {
  return (
    <Suspense>
      <FrameworkRoot framework={frameworkProvider}>
        <I18nProvider>
          <AffineContext store={getCurrentStore()}>
            <RouterProvider
              fallbackElement={<AppFallback />}
              router={router}
              future={future}
            />
          </AffineContext>
        </I18nProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
