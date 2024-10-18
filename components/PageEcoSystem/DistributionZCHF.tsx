import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

export default function DistributionZCHF() {
	const eco = useSelector((state: RootState) => state.ecosystem);
	return <></>;
}
