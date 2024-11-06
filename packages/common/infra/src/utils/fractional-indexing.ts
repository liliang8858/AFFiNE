import { generateKeyBetween } from 'fractional-indexing';

export interface SortableProvider<T, K extends string | number> {
  getItems(): T[];
  getItemId(item: T): K;
  getItemOrder(item: T): string;
  setItemOrder(item: T, order: string): void;
}

// Using fractional-indexing managing orders of items in a list
/**
 * @deprecated
 */
export function createFractionalIndexingSortableHelper<
  T,
  K extends string | number,
>(provider: SortableProvider<T, K>) {
  function getOrderedItems() {
    return provider.getItems().sort((a, b) => {
      const oa = provider.getItemOrder(a);
      const ob = provider.getItemOrder(b);
      return oa > ob ? 1 : oa < ob ? -1 : 0;
    });
  }

  function getLargestOrder() {
    const lastItem = getOrderedItems().at(-1);
    return lastItem ? provider.getItemOrder(lastItem) : null;
  }

  function getSmallestOrder() {
    const firstItem = getOrderedItems().at(0);
    return firstItem ? provider.getItemOrder(firstItem) : null;
  }

  /**
   * Get a new order at the end of the list
   */
  function getNewItemOrder() {
    return generateKeyBetween(getLargestOrder(), null);
  }

  /**
   * Move item from one position to another
   *
   * in the most common sorting case, moving over will visually place the dragging item to the target position
   * the original item in the target position will either move up or down, depending on the direction of the drag
   *
   * @param fromId
   * @param toId
   */
  function move(fromId: K, toId: K) {
    const items = getOrderedItems();
    const from = items.findIndex(i => provider.getItemId(i) === fromId);
    const to = items.findIndex(i => provider.getItemId(i) === toId);
    const fromItem = items[from];
    const toItem = items[to];
    const toNextItem = items[from < to ? to + 1 : to - 1];
    const toOrder = toItem ? provider.getItemOrder(toItem) : null;
    const toNextOrder = toNextItem ? provider.getItemOrder(toNextItem) : null;
    const args: [string | null, string | null] =
      from < to ? [toOrder, toNextOrder] : [toNextOrder, toOrder];
    provider.setItemOrder(fromItem, generateKeyBetween(...args));
  }

  function moveTo(fromId: K, toId: K, position: 'before' | 'after') {
    const items = getOrderedItems();
    const from = items.findIndex(i => provider.getItemId(i) === fromId);
    const to = items.findIndex(i => provider.getItemId(i) === toId);
    const fromItem = items[from] as T | undefined;
    if (fromItem === undefined) return;
    const toItem = items[to] as T | undefined;
    const toItemPrev = items[to - 1] as T | undefined;
    const toItemNext = items[to + 1] as T | undefined;
    const toItemOrder = toItem ? provider.getItemOrder(toItem) : null;
    const toItemPrevOrder = toItemPrev
      ? provider.getItemOrder(toItemPrev)
      : null;
    const toItemNextOrder = toItemNext
      ? provider.getItemOrder(toItemNext)
      : null;
    if (position === 'before') {
      provider.setItemOrder(
        fromItem,
        generateKeyBetween(toItemPrevOrder, toItemOrder)
      );
    } else {
      provider.setItemOrder(
        fromItem,
        generateKeyBetween(toItemOrder, toItemNextOrder)
      );
    }
  }

  /**
   * Cases example:
   * Imagine we have the following items,  | a | b | c |
   * 1. insertBefore('b', undefined). before is not provided, which means insert b after c
   * | a | c |
   *         ▴
   *         b
   * result: | a | c | b |
   *
   * 2. insertBefore('b', 'a'). insert b before a
   * | a | c |
   * ▴
   * b
   *
   * result: | b | a | c |
   */
  function insertBefore(
    id: string | number,
    beforeId: string | number | undefined
  ) {
    const items = getOrderedItems();
    // assert id is in the list
    const item = items.find(i => provider.getItemId(i) === id);
    if (!item) return;

    const beforeItemIndex = items.findIndex(
      i => provider.getItemId(i) === beforeId
    );
    const beforeItem = beforeItemIndex !== -1 ? items[beforeItemIndex] : null;
    const beforeItemPrev = beforeItem ? items[beforeItemIndex - 1] : null;

    const beforeOrder = beforeItem ? provider.getItemOrder(beforeItem) : null;
    const beforePrevOrder = beforeItemPrev
      ? provider.getItemOrder(beforeItemPrev)
      : null;

    provider.setItemOrder(
      item,
      generateKeyBetween(beforePrevOrder, beforeOrder)
    );
  }

  return {
    getOrderedItems,
    getLargestOrder,
    getSmallestOrder,
    getNewItemOrder,
    move,
    moveTo,
    insertBefore,
  };
}

/**
 * generate a key between a and b, the result key is always satisfied with a < result < b.
 * the key always has a random suffix, so there is no need to worry about collision.
 *
 * make sure a and b are generated by this function.
 *
 * @param customPostfix custom postfix for the key, only letters and numbers are allowed
 */
export function generateFractionalIndexingKeyBetween(
  a: string | null,
  b: string | null
) {
  const randomSize = 32;
  function postfix(length: number = randomSize) {
    const chars =
      '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(values[i] % chars.length);
    }
    return result;
  }

  if (a !== null && b !== null && a >= b) {
    throw new Error('a should be smaller than b');
  }

  // get the subkey in full key
  // e.g.
  // a0xxxx -> a
  // a0x0xxxx -> a0x
  function subkey(key: string | null) {
    if (key === null) {
      return null;
    }
    if (key.length <= randomSize + 1) {
      // no subkey
      return key;
    }
    const splitAt = key.substring(0, key.length - randomSize - 1);
    return splitAt;
  }

  const aSubkey = subkey(a);
  const bSubkey = subkey(b);

  if (aSubkey === null && bSubkey === null) {
    // generate a new key
    return generateKeyBetween(null, null) + '0' + postfix();
  } else if (aSubkey === null && bSubkey !== null) {
    // generate a key before b
    return generateKeyBetween(null, bSubkey) + '0' + postfix();
  } else if (bSubkey === null && aSubkey !== null) {
    // generate a key after a
    return generateKeyBetween(aSubkey, null) + '0' + postfix();
  } else if (aSubkey !== null && bSubkey !== null) {
    // generate a key between a and b
    if (aSubkey === bSubkey && a !== null && b !== null) {
      // conflict, if the subkeys are the same, generate a key between fullkeys
      return generateKeyBetween(a, b) + '0' + postfix();
    } else {
      return generateKeyBetween(aSubkey, bSubkey) + '0' + postfix();
    }
  }
  throw new Error('Never reach here');
}
