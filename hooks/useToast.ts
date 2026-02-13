
import { useToastContext } from '../contexts/ToastContext';

// Ten hook teraz jest tylko wrapperem na kontekst,
// dzięki czemu nie musimy zmieniać importów w komponentach, które używały useToast.
export const useToast = () => {
  const { addToast, removeToast } = useToastContext();
  return { addToast, removeToast };
};
