export const SectionTitle = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`${className} mb-1 text-[1.75rem] sm:mb-5 sm:text-[1.625rem] font-black leading-[1.625rem] tracking-tight`}>
    {children}
  </div>
);
