import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

// currently only used for delete action
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        style={{ backgroundColor: "var(--backdrop)" }}
      />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="app-panel relative w-full max-w-md overflow-hidden rounded-3xl border p-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-(--text-faint) transition-colors hover:bg-(--surface-hover) hover:text-(--app-fg)"
          >
            <X size={18} />
          </button>

          <DialogTitle className="text-xl font-bold text-(--app-fg)">
            {title}
          </DialogTitle>

          <p className="mt-3 text-sm text-(--text-muted)">
            {message}
          </p>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="app-panel-muted rounded-full border px-5 py-2.5 text-sm font-semibold text-(--text-muted) transition-colors hover:bg-(--surface-hover-strong) hover:text-(--app-fg)"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="rounded-full bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
