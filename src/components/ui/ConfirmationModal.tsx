import { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmationModalProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-error-600',
          iconBg: 'bg-error-100',
          confirmButton: 'error' as const
        };
      case 'warning':
        return {
          iconColor: 'text-warning-600',
          iconBg: 'bg-warning-100',
          confirmButton: 'warning' as const
        };
      case 'info':
        return {
          iconColor: 'text-primary-600',
          iconBg: 'bg-primary-100',
          confirmButton: 'primary' as const
        };
      default:
        return {
          iconColor: 'text-error-600',
          iconBg: 'bg-error-100',
          confirmButton: 'error' as const
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} mb-4`}>
          <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-primary-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <div className="text-primary-600 mb-6">
          {typeof message === 'string' ? (
            <p>{message}</p>
          ) : (
            message
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={styles.confirmButton}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;