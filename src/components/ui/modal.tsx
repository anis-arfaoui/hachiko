"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { cn } from "@/lib/utils";

export interface ModalProps {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  title?: ReactNode;
}

const sizeStyles: Record<NonNullable<ModalProps["size"]>, string> = {
  full: "max-w-5xl",
  lg: "max-w-2xl",
  md: "max-w-lg",
  sm: "max-w-md",
  xl: "max-w-3xl",
};

export const Modal = ({
  children,
  className,
  description,
  footer,
  isOpen,
  onClose,
  size = "md",
  title,
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onCloseRef.current()}
      aria-label="Modal"
      className="fixed inset-0 z-50 m-auto flex items-center justify-center bg-transparent p-4 backdrop:bg-black/60 backdrop:backdrop-blur-xs sm:p-6"
    >
      <div
        className={cn(
          "border-border bg-card relative z-10 w-full overflow-hidden rounded-2xl border p-6 shadow-2xl transition-all duration-200",
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="border-border flex items-start justify-between gap-4 border-b pb-4">
            <div className="space-y-1">
              {title && (
                <Heading level={2} className="text-xl">
                  {title}
                </Heading>
              )}
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Body */}
        <div className="py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
};
