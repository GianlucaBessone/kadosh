export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in zoom-in-[0.98] duration-300 w-full h-full">
      {children}
    </div>
  );
}
