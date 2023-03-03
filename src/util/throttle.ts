import dayjs from 'dayjs';
/**
 * Throttling refers to executing a function only once within a certain period of time,
 * usually used to handle events that are frequently triggered,
 * such as window scrolling, mouse movement, and so on.
 * @public
 */
function throttle<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeoutId: NodeJS.Timeout | undefined;
  let previous: number = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = dayjs().valueOf();
    const remaining = wait - (now - previous);
    if (remaining <= 0) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        previous = dayjs().valueOf();
        timeoutId = undefined;
        func.apply(this, args);
      }, remaining);
    }
  } as T;
}

export default throttle;
