import Link from "next/link";
import { SOCIAL } from "@utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBook, faBookmark, faComments, faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTelegram, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { SubmitIssue } from "./LoadingScreen";
import { usePathname } from "next/navigation";

interface ButtonProps {
	link: string;
	text: string;
	icon: IconProp;
}

const FooterButton = ({ link, text, icon }: ButtonProps) => {
	return (
		<Link href={link} target="_blank" rel="noreferrer" className="flex gap-1 hover:opacity-70">
			<FontAwesomeIcon icon={icon} className="w-6 h-6" />
			<div className="hidden sm:block">{text}</div>
		</Link>
	);
};

const DynamicDocs = (): string => {
	const p = usePathname();
	let link: string = SOCIAL.Docs;

	if (p === "/mint") link += "/positions/open";
	else if (p === "/mypositions") link += "/positions/adjust";
	else if (p === "/monitoring") link += "/positions/auctions";
	else if (p === "/challenges") link += "/positions/auctions";
	else if (p === "/pool") link += "/pool-shares";
	else if (p === "/governance") link += "/governance";
	else if (p === "/swap") link += "/swap";

	return link;
};

export default function Footer() {
	return (
		<>
			<ul className="mt-12 mb-4 flex items-center justify-center gap-8">
				<li>
					<FooterButton link={DynamicDocs()} text="Doc" icon={faBook} />
				</li>
				<li>
					<FooterButton link={SOCIAL.SubStack} text="Blog" icon={faBookmark} />
				</li>
				<li>
					<FooterButton link={SOCIAL.Forum} text="Forum" icon={faComments} />
				</li>
				<li>
					<FooterButton link={SOCIAL.Twitter} text="Twitter" icon={faXTwitter} />
				</li>
				<li>
					<FooterButton link={SOCIAL.Telegram} text="Telegram" icon={faTelegram} />
				</li>
			</ul>
			<div className="mb-8 mt-8">
				<SubmitIssue />
			</div>
		</>
	);
}
