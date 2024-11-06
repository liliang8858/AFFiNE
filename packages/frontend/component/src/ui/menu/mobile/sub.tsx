import { ArrowRightSmallPlusIcon } from '@blocksuite/icons/rc';
import { Slot } from '@radix-ui/react-slot';
import { type MouseEvent, useCallback, useContext } from 'react';

import type { MenuSubProps } from '../menu.types';
import { useMenuItem } from '../use-menu-item';
import { MobileMenuContext } from './context';

export const MobileMenuSub = ({
  title,
  children: propsChildren,
  items,
  triggerOptions,
  subContentOptions: contentOptions = {},
}: MenuSubProps & { title?: string }) => {
  const {
    className,
    children,
    otherProps: { onClick, ...otherTriggerOptions },
  } = useMenuItem({
    children: propsChildren,
    suffixIcon: <ArrowRightSmallPlusIcon />,
    ...triggerOptions,
  });

  return (
    <MobileMenuSubRaw
      onClick={onClick}
      items={items}
      subContentOptions={contentOptions}
      title={title}
    >
      <div className={className} {...otherTriggerOptions}>
        {children}
      </div>
    </MobileMenuSubRaw>
  );
};

export const MobileMenuSubRaw = ({
  title,
  onClick,
  children,
  items,
  subContentOptions: contentOptions = {},
}: MenuSubProps & {
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  title?: string;
}) => {
  const { setSubMenus } = useContext(MobileMenuContext);

  const onItemClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      setSubMenus(prev => [...prev, { items, contentOptions, title }]);
    },
    [contentOptions, items, onClick, setSubMenus, title]
  );

  return <Slot onClick={onItemClick}>{children}</Slot>;
};
