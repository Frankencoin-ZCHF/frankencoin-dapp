import { NextRouter } from "next/router";
import { MARKETING_PARAM_NAME } from "./constant";

const PUBLIC_VIEW_ADDRESS_PARAM_NAME = 'publicView';

const carryOnQueryParams = [
	MARKETING_PARAM_NAME,
	PUBLIC_VIEW_ADDRESS_PARAM_NAME,
];

export const getPublicViewAddress = (router: NextRouter) => {
	return router.query[PUBLIC_VIEW_ADDRESS_PARAM_NAME] || '';
};

export const getCarryOnQueryParams = (router: NextRouter) => {
	return carryOnQueryParams.reduce((acc, param: string) => {
		if (router.query[param]) {
			acc[param] = router.query[param] as string;
		}
		return acc;
	}, {} as Record<string, string>);
};
