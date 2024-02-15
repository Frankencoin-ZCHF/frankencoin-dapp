import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import PositionTable from "@components/PositionTable";
import Link from "next/link";

export default function Positions() {
  return (
    <>
      <Head>
        <title>Frankencoin - Positions</title>
      </Head>
      <div>
        <AppPageHeader title="Your Positions" />
        <PositionTable showMyPos />
      </div>
      <div className="mt-8">
        <AppPageHeader title="Other Positions" />
        <PositionTable />
      </div>
      <div>
        <Link href={"positions/create"} className="btn btn-primary">
          Create New Position
        </Link>
      </div>
    </>
  );
}
