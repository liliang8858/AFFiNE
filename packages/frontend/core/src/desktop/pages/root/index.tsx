import { NotificationCenter } from '@affine/component';
import { Outlet } from 'react-router-dom';

import { GlobalDialogs } from '../../dialogs';
import { CustomThemeModifier } from './custom-theme';
import { FindInPageModal } from './find-in-page/find-in-page-modal';

export const RootWrapper = () => {
  return (
    <>
      <GlobalDialogs />
      <NotificationCenter />
      <Outlet />
      <CustomThemeModifier />
      {BUILD_CONFIG.isElectron && <FindInPageModal />}
    </>
  );
};
