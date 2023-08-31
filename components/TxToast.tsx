export const TxToast = (props: {
  title: string;
  rows: { title: string; value: string | JSX.Element }[];
  success?: boolean;
}) => {
  const { title, rows, success = true } = props;

  return (
    <div className="flex flex-col">
      <div className="font-bold mb-2">{title}</div>
      {rows.map((row) => (
        <div
          className="flex items-center gap-1 justify-between text-sm"
          key={row.title}
        >
          <div>{row.title}</div>
          <div>{row.value}</div>
        </div>
      ))}
    </div>
  );
};
