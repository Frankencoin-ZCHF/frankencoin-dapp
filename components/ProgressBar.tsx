interface Props {
  label: string;
  progress: number;
  link?: string;
}

export default function ProgressBar({ label, link, progress }: Props) {
  const onClickHandler = (e: any) => {
    if (!link) return;
    e.preventDefault();
    window.open(link, "_blank");
  };

  return (
    <div className="rounded-3xl bg-slate-600 w-full text-center relative">
      <div
        className="rounded-3xl absolute bg-rose-400 h-full"
        style={{ width: `${progress}%`, minWidth: 20 }}
      />
      <div
        className={`${link && "underline"} relative text-slate-300`}
        onClick={onClickHandler}
      >
        {label}
      </div>
    </div>
  );
}
