import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import ReportsYearlyTable from "@components/PageMonitoring/PageReports/ReportsYearlyTable";

export default function SavingsYearlyTable() {
	const { interest, save, withdraw } = useSelector((state: RootState) => state.savings.savingsUserTable);
	return <ReportsYearlyTable save={save} interest={interest} withdraw={withdraw} />;
}
