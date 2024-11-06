import { Button } from '@affine/component/ui/button';
import { resolveLinkToDoc } from '@affine/core/modules/navigation';
import { appIconMap, appNames } from '@affine/core/utils/channel';
import { Trans, useI18n } from '@affine/i18n';
import { Logo1Icon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import type { MouseEvent } from 'react';
import { useCallback } from 'react';

import { GlobalDialogService } from '../../dialogs';
import { getOpenUrlInDesktopAppLink } from '../utils';
import * as styles from './open-in-app-page.css';

let lastOpened = '';

interface OpenAppProps {
  urlToOpen?: string | null;
  openHereClicked?: (e: MouseEvent) => void;
}

export const OpenInAppPage = ({ urlToOpen, openHereClicked }: OpenAppProps) => {
  // default to open the current page in desktop app
  urlToOpen ??= getOpenUrlInDesktopAppLink(window.location.href, true);
  const globalDialogService = useService(GlobalDialogService);
  const t = useI18n();
  const channel = BUILD_CONFIG.appBuildType;
  const openDownloadLink = useCallback(() => {
    const url =
      'https://affine.pro/download' +
      (channel !== 'stable' ? '/beta-canary' : '');
    open(url, '_blank');
  }, [channel]);

  const appIcon = appIconMap[channel];
  const appName = appNames[channel];

  const maybeDocLink = urlToOpen ? resolveLinkToDoc(urlToOpen) : null;

  const goToDocPage = useCallback(
    (e: MouseEvent) => {
      if (!maybeDocLink) {
        return;
      }
      openHereClicked?.(e);
    },
    [maybeDocLink, openHereClicked]
  );

  const goToAppearanceSetting = useCallback(
    (e: MouseEvent) => {
      openHereClicked?.(e);
      globalDialogService.open('setting', {
        activeTab: 'appearance',
      });
    },
    [globalDialogService, openHereClicked]
  );

  if (urlToOpen && lastOpened !== urlToOpen) {
    lastOpened = urlToOpen;
    location.href = urlToOpen;
  }

  if (!urlToOpen) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.topNav}>
        <a href="/" rel="noreferrer" className={styles.affineLogo}>
          <Logo1Icon width={24} height={24} />
        </a>

        <div className={styles.topNavLinks}>
          <a
            href="https://affine.pro"
            target="_blank"
            rel="noreferrer"
            className={styles.topNavLink}
          >
            Official Website
          </a>
          <a
            href="https://community.affine.pro/home"
            target="_blank"
            rel="noreferrer"
            className={styles.topNavLink}
          >
            AFFiNE Community
          </a>
          <a
            href="https://affine.pro/blog"
            target="_blank"
            rel="noreferrer"
            className={styles.topNavLink}
          >
            Blog
          </a>
          <a
            href="https://affine.pro/about-us"
            target="_blank"
            rel="noreferrer"
            className={styles.topNavLink}
          >
            Contact us
          </a>
        </div>

        <Button onClick={openDownloadLink}>
          {t['com.affine.auth.open.affine.download-app']()}
        </Button>
      </div>

      <div className={styles.centerContent}>
        <img src={appIcon} alt={appName} width={120} height={120} />

        <div className={styles.prompt}>
          {openHereClicked ? (
            <Trans i18nKey="com.affine.auth.open.affine.open-doc-prompt">
              This doc is now opened in {appName}
            </Trans>
          ) : (
            <Trans i18nKey="com.affine.auth.open.affine.prompt">
              Open {appName} app now
            </Trans>
          )}
        </div>

        <div className={styles.promptLinks}>
          {openHereClicked && (
            <a
              className={styles.promptLink}
              onClick={goToDocPage}
              target="_blank"
              rel="noreferrer"
            >
              {t['com.affine.auth.open.affine.doc.open-here']()}
            </a>
          )}
          <a
            className={styles.promptLink}
            href={urlToOpen}
            target="_blank"
            rel="noreferrer"
          >
            {t['com.affine.auth.open.affine.try-again']()}
          </a>
        </div>
      </div>

      {maybeDocLink ? (
        <a
          className={styles.editSettingsLink}
          onClick={goToAppearanceSetting}
          target="_blank"
          rel="noreferrer"
        >
          {t['com.affine.auth.open.affine.doc.edit-settings']()}
        </a>
      ) : null}
    </div>
  );
};
