import { bodyEmphasized, bodyRegular } from '@toeverything/theme/typography';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const pageTitle = style([bodyEmphasized]);

export const root = style({
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const baseSettingItem = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 32,
  padding: '8px 0',
});
export const baseSettingItemName = style([
  bodyRegular,
  {
    color: cssVarV2('text/primary'),
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
]);
export const baseSettingItemAction = style([
  baseSettingItemName,
  {
    color: cssVarV2('text/placeholder'),
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    flexShrink: 1,
  },
]);

export const linkIcon = style({
  fontSize: 24,
  color: cssVarV2('icon/primary'),
});
