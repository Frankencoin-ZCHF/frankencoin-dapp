import Link from "next/link";
import { SOCIAL } from "../utils";

interface ButtonProps {
  link: string
  text: string
  icon: string
}

const FooterButton = ({
  link,
  text,
  icon
}: ButtonProps) => {
  return (
    <Link href={link} target="_blank" rel="noreferrer" className="flex gap-3 underline hover:opacity-70">
      <picture>
        <img src={icon} alt={text} className="h-6 w-6" />
      </picture>
      {text}
    </Link>
  )
}

export default function Footer() {
  return (
    <ul className="mt-12 mb-4 flex items-center justify-center gap-8">
      <li>
        <FooterButton
          link={SOCIAL.Github}
          text="Github"
          icon="/assets/github.svg"
        />
      </li>
      <li>
        <FooterButton
          link={SOCIAL.Docs}
          text="Doc"
          icon="/assets/doc.svg"
        />
      </li>
      <li>
        <FooterButton
          link={SOCIAL.SubStack}
          text="Blog"
          icon="/assets/blog.svg"
        />
      </li>
      <li>
        <FooterButton
          link={SOCIAL.Forum}
          text="Forum"
          icon="/assets/forum.svg"
        />
      </li>
      <li>
        <FooterButton
          link={SOCIAL.Twitter}
          text="Twitter"
          icon="/assets/twitter.svg"
        />
      </li>
      <li>
        <FooterButton
          link={SOCIAL.Telegram}
          text="Telegram"
          icon="/assets/telegram.svg"
        />
      </li>
    </ul>
  )
}