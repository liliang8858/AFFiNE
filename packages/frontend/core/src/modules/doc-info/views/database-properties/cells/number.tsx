import { NumberValue } from '@affine/core/components/doc-properties/types/number';
import { useLiveData } from '@toeverything/infra';

import type { DatabaseCellRendererProps } from '../../../types';

export const NumberCell = ({
  cell,
  rowId,
  dataSource,
  onChange,
}: DatabaseCellRendererProps) => {
  const value = useLiveData(cell.value$);
  return (
    <NumberValue
      value={value}
      onChange={v => {
        dataSource.cellValueChange(rowId, cell.property.id, v);
        onChange?.(v);
      }}
    />
  );
};
