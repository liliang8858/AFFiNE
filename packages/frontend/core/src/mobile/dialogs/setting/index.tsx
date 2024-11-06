import { Modal } from '@affine/component';
import { AuthService } from '@affine/core/modules/cloud';
import type {
  DialogComponentProps,
  GLOBAL_DIALOG_SCHEMA,
} from '@affine/core/modules/dialogs';
import { useI18n } from '@affine/i18n';
import { useService } from '@toeverything/infra';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useEffect } from 'react';

import { PageHeader } from '../../components';
import { AboutGroup } from './about';
import { AppearanceGroup } from './appearance';
import { OthersGroup } from './others';
import * as styles from './style.css';
import { UserProfile } from './user-profile';
import { UserUsage } from './user-usage';

const MobileSetting = ({ onClose }: { onClose: () => void }) => {
  const t = useI18n();
  const session = useService(AuthService).session;

  useEffect(() => session.revalidate(), [session]);

  return (
    <>
      <PageHeader back backAction={onClose}>
        <span className={styles.pageTitle}>
          {t['com.affine.mobile.setting.header-title']()}
        </span>
      </PageHeader>

      <div className={styles.root}>
        <UserProfile />
        <UserUsage />
        <AppearanceGroup />
        <AboutGroup />
        <OthersGroup />
      </div>
    </>
  );
};

export const SettingDialog = ({
  close,
}: DialogComponentProps<GLOBAL_DIALOG_SCHEMA['setting']>) => {
  return (
    <Modal
      fullScreen
      animation="slideBottom"
      open
      onOpenChange={() => close()}
      contentOptions={{
        style: {
          padding: 0,
          overflowY: 'auto',
          backgroundColor: cssVarV2('layer/background/secondary'),
        },
      }}
      withoutCloseButton
    >
      <MobileSetting onClose={close} />
    </Modal>
  );
};
