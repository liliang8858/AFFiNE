import { EditorSettingService } from '@affine/core/modules/editor-setting';
import { JournalService } from '@affine/core/modules/journal';
import { i18nTime } from '@affine/i18n';
import { track } from '@affine/track';
import { Text } from '@blocksuite/affine/store';
import {
  type DocProps,
  DocsService,
  initDocFromProps,
  useService,
  useServices,
} from '@toeverything/infra';
import dayjs from 'dayjs';
import { useCallback, useMemo } from 'react';

import { WorkbenchService } from '../../modules/workbench';

type MaybeDate = Date | string | number;
export const JOURNAL_DATE_FORMAT = 'YYYY-MM-DD';

function isJournalString(j?: string | false) {
  return j ? !!j?.match(/^\d{4}-\d{2}-\d{2}$/) : false;
}

function toDayjs(j?: string | false) {
  if (!j || !isJournalString(j)) return null;
  const day = dayjs(j);
  if (!day.isValid()) return null;
  return day;
}

/**
 * @deprecated use `JournalService` directly
 */
export const useJournalHelper = () => {
  const { docsService, editorSettingService, journalService } = useServices({
    DocsService,
    EditorSettingService,
    JournalService,
  });

  /**
   * @internal
   */
  const _createJournal = useCallback(
    (maybeDate: MaybeDate) => {
      const day = dayjs(maybeDate);
      const title = day.format(JOURNAL_DATE_FORMAT);
      const docRecord = docsService.createDoc();
      const { doc, release } = docsService.open(docRecord.id);
      docsService.list.setPrimaryMode(docRecord.id, 'page');
      // set created date to match the journal date
      docRecord.setMeta({
        createDate: dayjs()
          .set('year', day.year())
          .set('month', day.month())
          .set('date', day.date())
          .toDate()
          .getTime(),
      });
      const docProps: DocProps = {
        page: { title: new Text(title) },
        note: editorSettingService.editorSetting.get('affine:note'),
      };
      initDocFromProps(doc.blockSuiteDoc, docProps);
      release();
      journalService.setJournalDate(docRecord.id, title);
      return docRecord;
    },
    [docsService, editorSettingService.editorSetting, journalService]
  );

  /**
   * query all journals by date
   */
  const getJournalsByDate = useCallback(
    (maybeDate: MaybeDate) => {
      return journalService.getJournalsByDate(
        dayjs(maybeDate).format(JOURNAL_DATE_FORMAT)
      );
    },
    [journalService]
  );

  /**
   * get journal by date, create one if not exist
   */
  const getJournalByDate = useCallback(
    (maybeDate: MaybeDate) => {
      const pages = getJournalsByDate(maybeDate);
      if (pages.length) return pages[0];
      return _createJournal(maybeDate);
    },
    [_createJournal, getJournalsByDate]
  );

  return useMemo(
    () => ({
      getJournalsByDate,
      getJournalByDate,
    }),
    [getJournalsByDate, getJournalByDate]
  );
};

// split useJournalRouteHelper since it requires a <Route /> context, which may not work in lit
export const useJournalRouteHelper = () => {
  const { getJournalByDate } = useJournalHelper();
  const workbench = useService(WorkbenchService).workbench;
  /**
   * open journal by date, create one if not exist
   */
  const openJournal = useCallback(
    (maybeDate: MaybeDate, newTab?: boolean) => {
      const page = getJournalByDate(maybeDate);
      workbench.openDoc(page.id, {
        at: newTab ? 'new-tab' : 'active',
      });
      track.$.navigationPanel.journal.navigate({
        to: 'journal',
      });
      return page.id;
    },
    [getJournalByDate, workbench]
  );

  /**
   * open today's journal
   */
  const openToday = useCallback(
    (newTab?: boolean) => {
      const date = dayjs().format(JOURNAL_DATE_FORMAT);
      return openJournal(date, newTab);
    },
    [openJournal]
  );

  return useMemo(
    () => ({
      openJournal,
      openToday,
    }),
    [openJournal, openToday]
  );
};

/**
 * @deprecated use `JournalService` directly
 */
export const useJournalInfoHelper = (pageId?: string | null) => {
  const journalService = useService(JournalService);

  const isPageJournal = useCallback(
    (pageId: string) => {
      return !!journalService.journalDate$(pageId).value;
    },
    [journalService]
  );

  const isPageTodayJournal = useCallback(
    (pageId: string) => {
      const date = dayjs().format(JOURNAL_DATE_FORMAT);
      const d = journalService.journalDate$(pageId).value;
      return isPageJournal(pageId) && d === date;
    },
    [isPageJournal, journalService]
  );

  const getJournalDateString = useCallback(
    (pageId: string) => {
      return journalService.journalDate$(pageId).value;
    },
    [journalService]
  );

  const getLocalizedJournalDateString = useCallback(
    (pageId: string) => {
      const journalDateString = getJournalDateString(pageId);
      if (!journalDateString) return null;
      return i18nTime(journalDateString, { absolute: { accuracy: 'day' } });
    },
    [getJournalDateString]
  );

  return useMemo(
    () => ({
      isJournal: pageId ? isPageJournal(pageId) : false,
      journalDate: pageId ? toDayjs(getJournalDateString(pageId)) : null,
      localizedJournalDate: pageId
        ? getLocalizedJournalDateString(pageId)
        : null,
      isTodayJournal: pageId ? isPageTodayJournal(pageId) : false,
      isPageJournal,
      isPageTodayJournal,
      getJournalDateString,
      getLocalizedJournalDateString,
    }),
    [
      getJournalDateString,
      getLocalizedJournalDateString,
      isPageJournal,
      isPageTodayJournal,
      pageId,
    ]
  );
};
