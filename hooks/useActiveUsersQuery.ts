import { gql, useQuery } from "@apollo/client";

export const useActiveUsersQuery = () => {
	const { data, loading } = useQuery(
		gql`
			query {
				activeUsers {
					items {
						id
						lastActiveTime
					}
				}
			}
		`
	);

	if (!data || !data.activeUsers) {
		return {
			loading,
			activeUsers: [],
		};
	}

	return {
		loading,
		activeUsers: data.activeUsers.items,
	};
};
