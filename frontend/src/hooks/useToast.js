import { toast } from 'sonner';

/**
 * Custom hook for showing toast notifications using sonner
 */
export const useToast = () => {
  return {
    success: (message, options = {}) => toast.success(message, options),
    error: (message, options = {}) => toast.error(message, options),
    loading: (message, options = {}) => toast.loading(message, options),
    info: (message, options = {}) => toast.info(message, options),
    promise: (promise, messages, options = {}) => toast.promise(promise, messages, options),
    custom: (component, options = {}) => toast.custom(component, options),
    dismiss: (toastId) => toast.dismiss(toastId),
  };
};
