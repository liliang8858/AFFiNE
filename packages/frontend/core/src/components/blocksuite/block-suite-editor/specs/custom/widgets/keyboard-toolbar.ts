import { globalVars } from '@affine/core/mobile/styles/mobile.css';
import { type KeyboardToolbarConfig } from '@blocksuite/affine/blocks';

export function createKeyboardToolbarConfig(): Partial<KeyboardToolbarConfig> {
  return {
    // TODO(@L-Sun): check android following the PR
    // https://github.com/toeverything/blocksuite/pull/8645
    useScreenHeight: BUILD_CONFIG.isIOS,
    safeBottomPadding: BUILD_CONFIG.isIOS ? globalVars.appTabHeight : '0px',
  };
}
