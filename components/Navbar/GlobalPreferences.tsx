import { Popover } from "flowbite-react";
import { useTranslation } from "next-i18next";
import LanguageSelector from "./LanguageSelector";

export const GlobalPreferences = () => {
	const { t } = useTranslation();

	return (
		<Popover
			aria-labelledby="default-popover"
			content={
				<div className="flex flex-col gap-2 p-6 pt-5">
					<LanguageSelector />
				</div>
			}
		>
			<button type="button" className="flex items-center">
				<svg width="26" height="26" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
					<style type="text/css">
						{`
							.st0-globe {
								stroke: #5D647B;
								stroke-width: 1.5;
								stroke-linecap: round;
								stroke-linejoin: round;
							}
							svg:hover .st0-globe {
								stroke: #0F80F0;
							}
							.st0-globe-clip {
								clip-path: url(#clip0_2920_18870);
							}
						`}
					</style>
					<g className="st0-globe-clip">
						<path
							d="M2.83594 12.0352C2.83594 17.5582 7.31294 22.0352 12.8359 22.0352C18.3589 22.0352 22.8359 17.5582 22.8359 12.0352C22.8359 6.51216 18.3589 2.03516 12.8359 2.03516C7.31294 2.03516 2.83594 6.51216 2.83594 12.0352Z"
							className="st0-globe"
						/>
						<path
							d="M13.8348 2.08594C13.8348 2.08594 16.8348 6.03594 16.8348 12.0359C16.8348 18.0359 13.8348 21.9859 13.8348 21.9859M11.8348 21.9859C11.8348 21.9859 8.83484 18.0359 8.83484 12.0359C8.83484 6.03594 11.8348 2.08594 11.8348 2.08594M3.46484 15.5359H22.2048M3.46484 8.53594H22.2048"
							className="st0-globe"
						/>
					</g>
					<defs>
						<clipPath id="clip0_2920_18870">
							<rect width="26" height="26" fill="white" transform="translate(0.835938 0.0351562)" />
						</clipPath>
					</defs>
				</svg>
			</button>
		</Popover>
	);
};
