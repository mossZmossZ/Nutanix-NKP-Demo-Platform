import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, type NavItem } from "@/layouts/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Clock, FlaskConical, Gauge } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const nav: NavItem[] = [{ label: "My Labs", to: "/lab-access", icon: <FlaskConical /> }];

type LabSummary = {
  id: string;
  lab: {
    slug: string;
    title: string;
    summary: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    duration: string;
  };
  pageCount: number;
  completedCount: number;
};

export function LabAccessPage() {
  const [labs, setLabs] = useState<LabSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<LabSummary[]>("/me/labs")
      .then(setLabs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load labs"));
  }, []);

  return (
    <AppShell nav={nav} title="Lab Access">
      {error ? (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      ) : labs === null ? (
        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : labs.length === 0 ? (
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-xl py-xxl text-center shadow-sm">
            <h2 className="text-h3 text-foreground">No labs assigned yet</h2>
            <p className="mt-xs max-w-md text-body text-muted-foreground">
              Your labs will appear here once an admin assigns you a machine.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-xl">
          <div>
            <p className="text-label uppercase tracking-wide text-primary">Your workshops</p>
            <h2 className="mt-xxs text-h2 text-foreground">Available labs</h2>
            <p className="mt-xs text-body text-muted-foreground">
              Pick up where you left off or start a new hands-on lab.
            </p>
          </div>

          <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {labs.map(({ id, lab, pageCount, completedCount }) => (
              <Card
                key={id}
                className="shadow-sm transition-[box-shadow,transform] duration-[var(--duration-fast)] ease-standard hover:-translate-y-px hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center gap-xs">
                    <FlaskConical className="size-4 shrink-0 text-muted-foreground" />
                    <CardTitle>{lab.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-sm">
                  <CardDescription>{lab.summary}</CardDescription>
                  <div className="flex flex-wrap items-center gap-sm text-body-sm text-muted-foreground">
                    <span className="flex items-center gap-xxs">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {lab.duration}
                    </span>
                    <Badge variant="neutral">
                      <Gauge className="size-3.5" />
                      {lab.difficulty}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-xxs">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full [background:var(--gradient-prism)]"
                        style={{ width: pageCount === 0 ? "0%" : `${(completedCount / pageCount) * 100}%` }}
                      />
                    </div>
                    <Badge variant="neutral">
                      {completedCount} of {pageCount} pages
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button variant="primary" asChild>
                    <Link to={`/lab-access/${lab.slug}`}>
                      Open lab
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
