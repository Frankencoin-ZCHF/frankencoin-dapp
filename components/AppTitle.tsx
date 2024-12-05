interface Props {
	title?: string;
	className?: string;
	classNameTitle?: string;
}

export default function AppTitle({ title, className, classNameTitle }: Props) {
	return (
		<div className={`${className} md:mt-10`}>
			<span className={`${classNameTitle} font-bold text-xl`}>{title}</span>
		</div>
	);
}
