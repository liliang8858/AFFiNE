export { AppThemeService } from './services/theme';

import { type Framework, WorkspaceScope } from '@toeverything/infra';

import { EditorSettingService } from '../editor-setting';
import { AppTheme } from './entities/theme';
import { EdgelessThemeService } from './services/edgeless-theme';
import { AppThemeService } from './services/theme';

export function configureAppThemeModule(framework: Framework) {
  framework
    .service(AppThemeService)
    .entity(AppTheme)
    .scope(WorkspaceScope)
    .service(EdgelessThemeService, [AppThemeService, EditorSettingService]);
}
