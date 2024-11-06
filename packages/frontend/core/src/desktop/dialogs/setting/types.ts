import type { SettingTab } from '@affine/core/modules/dialogs/constant';
import type { WorkspaceMetadata } from '@toeverything/infra';

export interface SettingState {
  activeTab: SettingTab;
  activeWorkspaceMetadata?: WorkspaceMetadata | null;
  scrollAnchor?: string;
}
