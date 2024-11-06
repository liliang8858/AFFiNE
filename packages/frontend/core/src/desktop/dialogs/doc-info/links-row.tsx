import { PropertyCollapsibleSection } from '@affine/component';
import { AffinePageReference } from '@affine/core/components/affine/reference-link';
import type { Backlink, Link } from '@affine/core/modules/doc-link';
import type { MouseEvent } from 'react';

import * as styles from './links-row.css';

export const LinksRow = ({
  references,
  label,
  className,
  onClick,
}: {
  references: Backlink[] | Link[];
  label: string;
  className?: string;
  onClick?: (e: MouseEvent) => void;
}) => {
  return (
    <PropertyCollapsibleSection
      title={`${label} · ${references.length}`}
      className={className}
    >
      {references.map((link, index) => (
        <AffinePageReference
          key={index}
          pageId={link.docId}
          params={'params' in link ? link.params : undefined}
          className={styles.wrapper}
          onClick={onClick}
        />
      ))}
    </PropertyCollapsibleSection>
  );
};
