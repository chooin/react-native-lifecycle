/**
 * Debouncing refers to canceling the previous operation and restarting the timer
 * if an event is triggered again within a certain time period.
 * It is usually used to handle rapid button clicks,
 * and other scenarios.
 * @public
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeoutId: NodeJS.Timeout | undefined;

  return function (this: any, ...args: Parameters<T>) {
    if (!timeoutId) func.apply(this, args);
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => (timeoutId = undefined), wait);
  } as T;
}

export default debounce;
