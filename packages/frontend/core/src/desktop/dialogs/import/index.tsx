import { Button, IconButton, Modal } from '@affine/component';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import type {
  DialogComponentProps,
  GLOBAL_DIALOG_SCHEMA,
} from '@affine/core/modules/dialogs';
import { UrlService } from '@affine/core/modules/url';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { useI18n } from '@affine/i18n';
import {
  MarkdownTransformer,
  NotionHtmlTransformer,
  openFileOrFiles,
} from '@blocksuite/affine/blocks';
import type { DocCollection } from '@blocksuite/affine/store';
import {
  ExportToMarkdownIcon,
  HelpIcon,
  NotionIcon,
} from '@blocksuite/icons/rc';
import { useService, WorkspaceService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { type ReactElement, useCallback, useState } from 'react';

import * as style from './styles.css';

type ImportType = 'markdown' | 'markdownZip' | 'notion';
type AcceptType = 'Markdown' | 'Zip';
type Status = 'idle' | 'importing' | 'success' | 'error';

type ImportConfig = {
  fileOptions: { acceptType: AcceptType; multiple: boolean };
  importFunction: (
    docCollection: DocCollection,
    file: File | File[]
  ) => Promise<string[]>;
};

const DISCORD_URL = 'https://discord.gg/whd5mjYqVw';

const importOptions = [
  {
    label: 'com.affine.import.markdown-files',
    prefixIcon: (
      <ExportToMarkdownIcon
        color={cssVarV2('icon/primary')}
        width={20}
        height={20}
      />
    ),
    testId: 'editor-option-menu-import-markdown-files',
    type: 'markdown' as ImportType,
  },
  {
    label: 'com.affine.import.markdown-with-media-files',
    prefixIcon: (
      <ExportToMarkdownIcon
        color={cssVarV2('icon/primary')}
        width={20}
        height={20}
      />
    ),
    testId: 'editor-option-menu-import-markdown-with-media',
    type: 'markdownZip' as ImportType,
  },
  {
    label: 'com.affine.import.notion',
    prefixIcon: <NotionIcon color={cssVar('black')} width={20} height={20} />,
    suffixIcon: (
      <HelpIcon color={cssVarV2('icon/primary')} width={20} height={20} />
    ),
    suffixTooltip: 'com.affine.import.notion.tooltip',
    testId: 'editor-option-menu-import-notion',
    type: 'notion' as ImportType,
  },
];

const importConfigs: Record<ImportType, ImportConfig> = {
  markdown: {
    fileOptions: { acceptType: 'Markdown', multiple: true },
    importFunction: async (docCollection, files) => {
      if (!Array.isArray(files)) {
        throw new Error('Expected an array of files for markdown files import');
      }
      const pageIds: string[] = [];
      for (const file of files) {
        const text = await file.text();
        const fileName = file.name.split('.').slice(0, -1).join('.');
        const pageId = await MarkdownTransformer.importMarkdownToDoc({
          collection: docCollection,
          markdown: text,
          fileName,
        });
        if (pageId) pageIds.push(pageId);
      }
      return pageIds;
    },
  },
  markdownZip: {
    fileOptions: { acceptType: 'Zip', multiple: false },
    importFunction: async (docCollection, file) => {
      if (Array.isArray(file)) {
        throw new Error('Expected a single zip file for markdownZip import');
      }
      return MarkdownTransformer.importMarkdownZip({
        collection: docCollection,
        imported: file,
      });
    },
  },
  notion: {
    fileOptions: { acceptType: 'Zip', multiple: false },
    importFunction: async (docCollection, file) => {
      if (Array.isArray(file)) {
        throw new Error('Expected a single zip file for notion import');
      }
      const { pageIds } = await NotionHtmlTransformer.importNotionZip({
        collection: docCollection,
        imported: file,
      });
      return pageIds;
    },
  },
};

const ImportOptionItem = ({
  label,
  prefixIcon,
  suffixIcon,
  suffixTooltip,
  type,
  onImport,
}: {
  label: string;
  prefixIcon: ReactElement;
  suffixIcon?: ReactElement;
  suffixTooltip?: string;
  type: ImportType;
  onImport: (type: ImportType) => void;
}) => {
  const t = useI18n();
  return (
    <div className={style.importItem} onClick={() => onImport(type)}>
      {prefixIcon}
      <div className={style.importItemLabel}>{t[label]()}</div>
      {suffixIcon && (
        <IconButton
          className={style.importItemSuffix}
          icon={suffixIcon}
          tooltip={suffixTooltip ? t[suffixTooltip]() : undefined}
        />
      )}
    </div>
  );
};

const ImportOptions = ({
  onImport,
}: {
  onImport: (type: ImportType) => void;
}) => {
  const t = useI18n();
  return (
    <>
      <div className={style.importModalTitle}>{t['Import']()}</div>
      <div className={style.importModalContent}>
        {importOptions.map(
          ({ label, prefixIcon, suffixIcon, suffixTooltip, testId, type }) => (
            <ImportOptionItem
              key={testId}
              prefixIcon={prefixIcon}
              suffixIcon={suffixIcon}
              suffixTooltip={suffixTooltip}
              label={label}
              data-testid={testId}
              type={type}
              onImport={onImport}
            />
          )
        )}
      </div>
      <div className={style.importModalTip}>
        {t['com.affine.import.modal.tip']()}{' '}
        <a
          className={style.link}
          href="https://discord.gg/whd5mjYqVw"
          target="_blank"
          rel="noreferrer"
        >
          Discord
        </a>{' '}
        .
      </div>
    </>
  );
};

const ImportingStatus = () => {
  const t = useI18n();
  return (
    <>
      <div className={style.importModalTitle}>
        {t['com.affine.import.status.importing.title']()}
      </div>
      <p className={style.importStatusContent}>
        {t['com.affine.import.status.importing.message']()}
      </p>
    </>
  );
};

const SuccessStatus = ({ onComplete }: { onComplete: () => void }) => {
  const t = useI18n();
  return (
    <>
      <div className={style.importModalTitle}>
        {t['com.affine.import.status.success.title']()}
      </div>
      <p className={style.importStatusContent}>
        {t['com.affine.import.status.success.message']()}{' '}
        <a
          className={style.link}
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
        >
          Discord
        </a>
        .
      </p>
      <div className={style.importModalButtonContainer}>
        <Button onClick={onComplete} variant="primary">
          {t['Complete']()}
        </Button>
      </div>
    </>
  );
};

const ErrorStatus = ({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) => {
  const t = useI18n();
  const urlService = useService(UrlService);
  return (
    <>
      <div className={style.importModalTitle}>
        {t['com.affine.import.status.failed.title']()}
      </div>
      <p className={style.importStatusContent}>
        {error || 'Unknown error occurred'}
      </p>
      <div className={style.importModalButtonContainer}>
        <Button
          onClick={() => {
            urlService.openPopupWindow(DISCORD_URL);
          }}
          variant="secondary"
        >
          {t['Feedback']()}
        </Button>
        <Button onClick={onRetry} variant="primary">
          {t['Retry']()}
        </Button>
      </div>
    </>
  );
};

export const ImportDialog = ({
  close,
}: DialogComponentProps<GLOBAL_DIALOG_SCHEMA['import']>) => {
  const t = useI18n();
  const [status, setStatus] = useState<Status>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [pageIds, setPageIds] = useState<string[]>([]);
  const workspace = useService(WorkspaceService).workspace;
  const workbench = useService(WorkbenchService).workbench;
  const docCollection = workspace.docCollection;

  const handleImport = useAsyncCallback(
    async (type: ImportType) => {
      setImportError(null);
      try {
        const importConfig = importConfigs[type];
        const file = await openFileOrFiles(importConfig.fileOptions);

        if (!file || (Array.isArray(file) && file.length === 0)) {
          throw new Error(
            t['com.affine.import.status.failed.message.no-file-selected']()
          );
        }

        setStatus('importing');

        const pageIds = await importConfig.importFunction(docCollection, file);

        setPageIds(pageIds);
        setStatus('success');
      } catch (error) {
        setImportError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
        setStatus('error');
      }
    },
    [docCollection, t]
  );

  const handleComplete = useCallback(() => {
    if (pageIds.length > 1) {
      workbench.openAll();
    } else if (pageIds.length === 1) {
      workbench.openDoc(pageIds[0]);
    }
    close();
  }, [pageIds, close, workbench]);

  const handleRetry = () => {
    setStatus('idle');
  };

  const statusComponents = {
    idle: <ImportOptions onImport={handleImport} />,
    importing: <ImportingStatus />,
    success: <SuccessStatus onComplete={handleComplete} />,
    error: <ErrorStatus error={importError} onRetry={handleRetry} />,
  };

  return (
    <Modal
      open
      onOpenChange={() => {
        close();
      }}
      width={480}
      contentOptions={{
        ['data-testid' as string]: 'import-modal',
        style: {
          maxHeight: '85vh',
          maxWidth: '70vw',
          minHeight: '126px',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          background: cssVarV2('layer/background/primary'),
        },
      }}
      closeButtonOptions={{
        className: style.closeButton,
      }}
      withoutCloseButton={status === 'importing'}
      persistent={status === 'importing'}
    >
      <div className={style.importModalContainer}>
        {statusComponents[status]}
      </div>
    </Modal>
  );
};
