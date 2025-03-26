interface Props {
	title?: string;
	tight?: boolean;
	gray?: boolean;
	children?: React.ReactNode;
	className?: string;
}

export default function AppBox({ title, tight, gray, children, className }: Props) {
	return (
		<section className={`${className} rounded-xl bg-layout-primary ${tight ? "p-4" : "p-4"}`}>
			{title && (
				<h2 className="h6 mb-6 text-text-primary text-center font-bold md:mb-8" v-if="title">
					{title}
				</h2>
			)}
			{children}
		</section>
	);
}
