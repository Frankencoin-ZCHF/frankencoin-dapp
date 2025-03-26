import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

export default function DistributionDEURO() {
	const eco = useSelector((state: RootState) => state.ecosystem);
	return <></>;
}
