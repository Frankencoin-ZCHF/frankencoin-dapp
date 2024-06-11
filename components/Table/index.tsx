interface Props {
	children: React.ReactElement[];
}

export default function Table({ children }: Props) {
	return (
		<section>
			<div className="">{children}</div>
		</section>
	);
}
