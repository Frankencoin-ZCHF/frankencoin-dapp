import type { GetServerSideProps } from "next";

/** New visitors land on /start (paths, calculator, steps) instead of the Borrow table. Server-side so it needs no hydration. */
export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: { destination: "/start", permanent: false },
});

export default function MainPage() {
	return null;
}
