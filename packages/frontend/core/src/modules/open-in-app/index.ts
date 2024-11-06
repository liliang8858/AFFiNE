import {
  type Framework,
  GlobalState,
  WorkspacesService,
} from '@toeverything/infra';

import { OpenInAppService } from './services';

export { OpenInAppService, OpenLinkMode } from './services';
export * from './utils';
export * from './views/open-in-app-guard';

export const configureOpenInApp = (framework: Framework) => {
  framework.service(OpenInAppService, [GlobalState, WorkspacesService]);
};
