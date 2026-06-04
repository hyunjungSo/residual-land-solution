"use client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="w-full flex-1 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
