"use client";

import AppShell from "../../../components/shell/AppShell";

/**
 * Every authenticated section of the app renders inside this one layout.
 *
 * `(shell)` is a route group, so it contributes nothing to the URL — /khynalt,
 * /tulbur and friends keep their exact paths. What changes is that React now
 * mounts the shell a single time and keeps it alive across navigations, instead
 * of tearing down and rebuilding the whole navbar (three SWR hooks, a socket
 * subscription and ten effects) every time you crossed from one section to
 * another.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
