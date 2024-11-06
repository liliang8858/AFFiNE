import type { WorkspaceMetadata } from '@toeverything/infra';

import type { SettingState } from '../../types';

export interface WorkspaceSettingDetailProps {
  workspaceMetadata: WorkspaceMetadata;
  onCloseSetting: () => void;
  onChangeSettingState: (settingState: SettingState) => void;
}
