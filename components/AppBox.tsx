interface Props {
	title?: string;
	tight?: boolean;
	children?: React.ReactNode;
	className?: string;
}

export default function AppBox({ title, tight = false, children, className }: Props) {
	return (
		<section className={`${className} rounded-xl bg-card-content-primary ${tight ? "px-3 py-2" : "p-4"}`}>
			{title && (
				<h2 className="h6 mb-6 text-text-primary text-center font-bold md:mb-8" v-if="title">
					{title}
				</h2>
			)}
			{children}
		</section>
	);
}
