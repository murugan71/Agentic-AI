// Global error handler for ResizeObserver errors
// This should be imported as early as possible in the application

const setupGlobalErrorHandling = () => {
  // Store original methods
  const originalConsoleError = console.error;
  const originalWindowError = window.onerror;
  const originalUnhandledRejection = window.onunhandledrejection;

  // Override console.error
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' && 
      (message.includes('ResizeObserver loop completed with undelivered notifications') ||
       message.includes('ResizeObserver loop limit exceeded'))
    ) {
      // Silently ignore ResizeObserver errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Override window.onerror
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      typeof message === 'string' && 
      (message.includes('ResizeObserver loop completed with undelivered notifications') ||
       message.includes('ResizeObserver loop limit exceeded'))
    ) {
      return true; // Prevent default error handling
    }
    
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Override unhandled promise rejections
  window.onunhandledrejection = (event) => {
    if (
      event.reason?.message && 
      (event.reason.message.includes('ResizeObserver loop completed with undelivered notifications') ||
       event.reason.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.preventDefault();
      return;
    }
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };

  // Add event listeners for additional coverage
  window.addEventListener('error', (event) => {
    if (
      event.error?.message && 
      (event.error.message.includes('ResizeObserver loop completed with undelivered notifications') ||
       event.error.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message && 
      (event.reason.message.includes('ResizeObserver loop completed with undelivered notifications') ||
       event.reason.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  console.log('Global ResizeObserver error handling initialized');
};

// Initialize immediately when this module is loaded
setupGlobalErrorHandling();

export default setupGlobalErrorHandling;