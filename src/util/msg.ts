import mitt from 'mitt';

const msg = mitt();
/**
 * Implement global messages: Publish Subscription
 * @public
 */

/**
 * subscribe and return to unsubscribe function
 * @public
 */
export const on = (
  key: string,
  fn: (event: any) => void,
): { remove: () => void } => {
  msg.on(key, fn);
  return { remove: exist(key) ? () => off(key) : () => {} };
};

/**
 * unsubscribe
 * @public
 */
export const off = (key: string) => exist(key) && msg.off(key);

/**
 * Send message to subscription, Returns the boolean value of whether the message was sent successfully
 * @public
 */
export const emit = (type: string, event: any): boolean => {
  if (exist(type)) {
    msg.emit(type, event);
    return true;
  }
  return false;
};

/**
 * Get the Map value of all subscriptions
 * @public
 */
export const all = msg.all;

/**
 * Whether subscription exists
 * @public
 */
export const exist = (key: string) => !!all.get(key)?.length;
