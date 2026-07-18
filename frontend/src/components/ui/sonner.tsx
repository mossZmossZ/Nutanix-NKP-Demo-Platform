import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Wired to design.md tokens + explicit slide-from-right animation so toasts
// always enter horizontally from the right edge regardless of position.
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md group-[.toaster]:rounded-lg " +
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:fade-in-0 " +
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:fade-out-0",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-success/30 group-[.toaster]:!bg-success/5 [&_svg]:text-success",
          error:
            "group-[.toaster]:!border-danger/30 group-[.toaster]:!bg-danger/5 [&_svg]:text-danger",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
export { toast } from "sonner";
