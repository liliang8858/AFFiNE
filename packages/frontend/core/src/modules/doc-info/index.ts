import {
  DocsService,
  type Framework,
  WorkspaceScope,
} from '@toeverything/infra';

import { DocsSearchService } from '../docs-search';
import { DocDatabaseBacklinksService } from './services/doc-database-backlinks';

export { DocDatabaseBacklinkInfo } from './views/database-properties/doc-database-backlink-info';

export function configureDocInfoModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(DocDatabaseBacklinksService, [DocsService, DocsSearchService]);
}
