interface Props {
	children: React.ReactElement[];
}

export default function Table({ children }: Props) {
	return (
		<section>
			<div className="rounded-lg shadow-lg">{children}</div>
		</section>
	);
}
