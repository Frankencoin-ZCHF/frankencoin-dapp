import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { SOCIAL } from "../utils/constant";
import { version } from "../package.json";
import { faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

interface ButtonProps {
	link: string;
	text: string;
	icon: IconProp;
}

const FooterButton = ({ link, text, icon }: ButtonProps) => {
	return (
		<Link href={link} target="_blank" rel="noreferrer" className="flex gap-2 hover:opacity-70">
			<FontAwesomeIcon icon={icon} className="w-6 h-6" />
			<div className="hidden sm:block">{text}</div>
		</Link>
	);
};

export default function LoadingScreen() {
	return (
		<>
			<div className="flex items-center justify-center gap-4 h-screen">
				<div className="flex flex-col items-center gap-8">
					<div className="flex flex-row items-center">
						<picture>
							<img className="h-10 mr-4" src="/assets/logoSquare.svg" alt="Logo" />
						</picture>
						<h1>Frankencoin is loading...</h1>
					</div>
					<div className="absolute bottom-10">
						<SubmitIssue />
					</div>
				</div>
			</div>
		</>
	);
}

export function SubmitIssue() {
	return (
		<ul className="flex items-center justify-center gap-8">
			<li>
				<FooterButton link={SOCIAL.Github_dapp_new_issue} text="Submit an Issue" icon={faGithub} />
			</li>
			<li>
				<FooterButton link={SOCIAL.Github_dapp} text={version} icon={faCodeCommit} />
			</li>
		</ul>
	);
}
