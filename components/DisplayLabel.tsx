interface Props {
	label?: string;
	children?: React.ReactNode;
	className?: string;
}

export default function DisplayLabel({ label, children, className }: Props) {
	return (
		<div className={`${className} items-center`}>
			<div className="text-sm font-medium text-text-label">{label}</div>
			{children}
		</div>
	);
}
