"use client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background" style={{ backgroundColor: '#f3f6f9' }}>
      <main className="w-full max-w-[2000px] flex-1 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
