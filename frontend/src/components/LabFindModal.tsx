import { useState, type FormEvent, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import { Search, Mail, User, Key, Copy, Check, ArrowRight, Shield, AlertCircle, Loader2 } from "lucide-react";

type LookupResult = { username: string; password: string };

function CredentialRow({ icon: Icon, label, value, mono }: { icon: typeof User; label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  function onCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-canvas px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="size-4 shrink-0 text-iris-600" />
        <span className="text-label text-muted-foreground shrink-0">{label}</span>
        <span className={`truncate text-body text-foreground ${mono ? "font-mono tracking-tight" : "font-medium"}`}>
          {value}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={onCopy}
        className="ml-2 shrink-0 size-8 p-0"
      >
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

interface LabFindModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabFindModal({ open, onOpenChange }: LabFindModalProps) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setEmail("");
    setResult(null);
    setError(null);
    setLoading(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const data = await api<LookupResult>("/lab-find", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[28rem]">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Find your credentials</DialogTitle>
              <DialogDescription>
                Enter the email your instructor registered for your account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-xs">
                <label htmlFor="lab-find-email" className="text-label text-muted-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
                  <Input
                    id="lab-find-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                    aria-invalid={!!error}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <AlertCircle className="size-4 shrink-0 text-destructive" />
                  <p className="text-body-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" variant="primary" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Find credentials
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 mb-2">
                <Shield className="size-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-center">Your credentials</DialogTitle>
              <DialogDescription className="text-center">
                Use these to sign in to the workshop platform
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <CredentialRow icon={User} label="Username" value={result.username} />
              <CredentialRow icon={Key} label="Password" value={result.password} mono />

              <Separator className="my-1" />

              <Link to="/login" onClick={() => handleOpenChange(false)} className="w-full">
                <Button variant="primary" className="w-full gap-2">
                  Sign in now
                  <ArrowRight className="size-4" />
                </Button>
              </Link>

              <p className="text-center text-caption text-muted-foreground">
                Copy your credentials before signing in.
              </p>

              <Button
                variant="ghost"
                className="mx-auto text-blue-600"
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setEmail("");
                }}
              >
                Look up another
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
