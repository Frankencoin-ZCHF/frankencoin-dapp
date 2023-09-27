import Head from "next/head";
import AppPageHeader from "../components/AppPageHeader";
import PositionTable from "../components/PositionTable";

export default function Positions() {
  return (
    <>
      <Head>
        <title>FrankenCoin - Positions</title>
      </Head>
      <div>
        <AppPageHeader title="My positions" />
        <PositionTable showMyPos />
      </div>
      <div className="mt-8">
        <AppPageHeader title="Other positions" />
        <PositionTable />
      </div>
    </>
  );
}
