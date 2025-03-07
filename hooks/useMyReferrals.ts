import { useSelector, useDispatch } from "react-redux";
import { setMyReferralName, setMyFrontendCode, clearMyReferralData } from "../redux/slices/myReferrals.slice";
import { RootState, AppDispatch } from "../redux/redux.store";
import { useQuery, gql } from "@apollo/client";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { getPublicViewAddress } from "../utils/url";
import { useRouter } from "next/router";
import { zeroAddress } from "viem";

export const useMyReferrals = () => {
	const { address } = useAccount();
	const dispatch = useDispatch<AppDispatch>();
	const referrals = useSelector((state: RootState) => state.myReferrals);

	const router = useRouter();
	const overwrite = getPublicViewAddress(router);
	const account = overwrite || address || zeroAddress;

	const setReferralName = (referralName: string) => {
		dispatch(setMyReferralName(referralName));
	};

	const { data } = useQuery(
		gql`
			query {
				frontendCodeMapping(id: "${account}") {
					id
					frontendCodes
				}
			}
		`,
		{
			pollInterval: 0,
		}
	);

	useEffect(() => {
		if (!data || !data?.frontendCodeMapping) {
			dispatch(clearMyReferralData());
			return;
		}

		const [frontendCode] = data.frontendCodeMapping.frontendCodes;

		if (frontendCode) {
			dispatch(setMyFrontendCode(frontendCode));
		}
	}, [data]);

	return {
		...referrals,
		setMyReferralName: (referralName: string) => setReferralName(referralName),
	};
};
