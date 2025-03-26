interface Props {
	children: React.ReactElement[];
}

export default function Table({ children }: Props) {
	return (
		<section>
			<div className="rounded-xl shadow-card">{children}</div>
		</section>
	);
}
