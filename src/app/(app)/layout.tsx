import DriverShell from "@/driver/DriverShell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <DriverShell>{children}</DriverShell>;
}
