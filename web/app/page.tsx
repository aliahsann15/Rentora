import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  MetricCard,
  PageHeader,
  PageShell,
  RoleBadge,
  SectionGrid,
  StatusBadge,
  TextArea,
  TextField,
  UrgencyBadge,
} from "@/components/ui";

const palette = [
  ["Primary", "bg-primary"],
  ["Primary Soft", "bg-primary-soft"],
  ["Tenant", "bg-tenant"],
  ["Vendor", "bg-vendor"],
  ["Success", "bg-success"],
  ["Warning", "bg-warning"],
  ["Danger", "bg-danger"],
  ["Surface", "bg-surface"],
];

export default function Home() {
  return (
    <PageShell>
      <PageHeader
        actions={
          <>
            <Button variant="secondary">Secondary</Button>
            <Button>Primary action</Button>
          </>
        }
        eyebrow="Rentora Web"
        subtitle="A Next.js design-system foundation for the desktop command center experience."
        title="Design System Preview"
      />

      <SectionGrid>
        <div className="lg:col-span-8">
          <Card elevated>
            <CardHeader
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge status="IN_PROGRESS" />
                  <UrgencyBadge urgency="HIGH" />
                </div>
              }
            >
              <CardTitle>Request workspace pattern</CardTitle>
              <CardDescription>
                Desktop screens should use dense, scannable panels with a clear action edge.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Open requests" value="18" helper="6 unassigned" tone="primary" />
                <MetricCard label="Vacant units" value="4" helper="Across 2 properties" tone="warning" />
                <MetricCard label="Verified" value="31" helper="This month" tone="success" />
              </div>

              <div className="overflow-hidden rounded-md border border-border">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 border-b border-divider bg-surface-muted px-4 py-3 text-xs font-bold uppercase text-text-muted">
                  <span>Request</span>
                  <span>Property</span>
                  <span>Role</span>
                  <span>Status</span>
                </div>
                {[
                  ["Kitchen sink leak", "Maple Court", "TENANT", "NEW"],
                  ["Bedroom AC not cooling", "Maple Court", "VENDOR", "IN_PROGRESS"],
                  ["Hallway light flicker", "Northline Flats", "LANDLORD", "ASSIGNED"],
                ].map(([title, property, role, status]) => (
                  <div
                    className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-4 border-b border-divider px-4 py-3 last:border-b-0"
                    key={title}
                  >
                    <span className="font-semibold text-text-primary">{title}</span>
                    <span className="text-sm text-text-secondary">{property}</span>
                    <RoleBadge role={role as "LANDLORD" | "TENANT" | "VENDOR"} />
                    <StatusBadge status={status as "NEW" | "ASSIGNED" | "IN_PROGRESS"} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="grid gap-4 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Core controls</CardTitle>
              <CardDescription>Buttons, badges, and fields inherit Rentora tokens.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Save</Button>
                <Button size="sm" variant="secondary">
                  Filter
                </Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
                <Button size="sm" variant="danger">
                  Delete
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">Property Manager</Badge>
                <Badge tone="tenant">Tenant</Badge>
                <Badge tone="vendor">Vendor</Badge>
                <Badge tone="neutral">Draft</Badge>
              </div>

              <Field label="Email">
                <TextField placeholder="manager@rentora.com" type="email" />
              </Field>
              <Field label="Internal note" hint="Notes are private to managers for now.">
                <TextArea placeholder="Add request context..." />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palette</CardTitle>
              <CardDescription>Shared mobile tokens, tuned for a desktop shell.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {palette.map(([label, className]) => (
                <div className="rounded-sm border border-border bg-surface p-2" key={label}>
                  <div className={["h-10 rounded-sm border border-divider", className].join(" ")} />
                  <p className="mt-2 text-xs font-semibold text-text-secondary">{label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </SectionGrid>
    </PageShell>
  );
}
