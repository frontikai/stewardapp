/**
 * Production-safe logging utility.
 * Only outputs logs when running in development mode (__DEV__).
 * In production builds, all log calls are no-ops.
 */

export const log = (...args) => {
  if (__DEV__) {
    console.log(...args);
  }
};

export const warn = (...args) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

export const error = (...args) => {
  if (__DEV__) {
    console.error(...args);
  }
};

export default { log, warn, error };
