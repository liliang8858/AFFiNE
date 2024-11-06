import { Tooltip } from '@affine/component/ui/tooltip';
import { useCatchEventCallback } from '@affine/core/components/hooks/use-catch-event-hook';
import { GlobalDialogService } from '@affine/core/modules/dialogs';
import { SubscriptionPlan } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService, useServices } from '@toeverything/infra';
import { useEffect } from 'react';

import {
  ServerConfigService,
  SubscriptionService,
} from '../../../modules/cloud';
import * as styles from './style.css';

export const UserPlanButton = () => {
  const { serverConfigService, subscriptionService } = useServices({
    ServerConfigService,
    SubscriptionService,
  });

  const hasPayment = useLiveData(
    serverConfigService.serverConfig.features$.map(r => r?.payment)
  );
  const plan = useLiveData(
    subscriptionService.subscription.pro$.map(subscription =>
      subscription !== null ? subscription?.plan : null
    )
  );
  const isBeliever = useLiveData(subscriptionService.subscription.isBeliever$);
  const isLoading = plan === null;

  useEffect(() => {
    // revalidate subscription to get the latest status
    subscriptionService.subscription.revalidate();
  }, [subscriptionService]);

  const globalDialogService = useService(GlobalDialogService);
  const handleClick = useCatchEventCallback(() => {
    globalDialogService.open('setting', {
      activeTab: 'plans',
      scrollAnchor: 'cloudPricingPlan',
    });
  }, [globalDialogService]);

  const t = useI18n();

  if (!hasPayment) {
    // no payment feature
    return;
  }

  if (isLoading) {
    // loading, do nothing
    return;
  }

  const planLabel = isBeliever ? 'Believer' : (plan ?? SubscriptionPlan.Free);

  return (
    <Tooltip content={t['com.affine.payment.tag-tooltips']()} side="top">
      <div
        data-is-believer={isBeliever ? 'true' : undefined}
        className={styles.userPlanButton}
        onClick={handleClick}
        data-event-props="$.settingsPanel.profileAndBadge.viewPlans"
      >
        {planLabel}
      </div>
    </Tooltip>
  );
};
