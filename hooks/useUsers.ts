import { api } from "@/lib/api";
import { User, UserFilters } from "@/lib/types/common";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseUsersOptions extends Partial<UserFilters> {
	initialData: User[];
}

export const useUsers = ({
	initialData = [],
	...initialFilters
}: UseUsersOptions) => {
	const [users, setUsers] = useState<User[]>(initialData);
	const [totalPages, setTotalPages] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<UserFilters>({
		page: initialFilters.page || 1,
		limit: initialFilters.limit || 10,
		search: initialFilters.search || "",
		role: initialFilters.role || "",
	});
	const abortController = useRef<AbortController | null>(null);

	const notifyUserChange = useCallback((updatedUsers: User[]) => {
		// Dispatch custom event for stats update
		const event = new CustomEvent("usersUpdated", {
			detail: { users: updatedUsers },
		});
		window.dispatchEvent(event);
	}, []);

	// Initialize state with initialData
	useEffect(() => {
		if (Array.isArray(initialData) && initialData.length > 0) {
			setUsers(initialData);
			setTotalPages(
				Math.ceil(initialData.length / (initialFilters.limit || 10))
			);
		}
	}, [initialData, initialFilters.limit]);

	// Update the effect to notify on users change
	useEffect(() => {
		notifyUserChange(users);
	}, [users, notifyUserChange]);

	const fetchUsers = useCallback(
		async (newFilters?: Partial<UserFilters>) => {
			if (abortController.current) {
				abortController.current.abort();
			}

			abortController.current = new AbortController();
			setLoading(true);

			try {
				const currentFilters = {
					...filters,
					...newFilters,
					// Only include search and role if they have values
					search: newFilters?.search?.trim() || undefined,
					role: newFilters?.role || undefined,
				};
				setFilters(currentFilters);

				const response = await api.getUsers(
					currentFilters.page,
					currentFilters.limit,
					currentFilters.search,
					currentFilters.role
				);

				if (response.data && Array.isArray(response.data.items)) {
					setUsers(response.data.items);
					setTotalPages(response.data.meta.totalPages || 1);
				}
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError(err instanceof Error ? err.message : "Failed to load users");
					setUsers([]);
					setTotalPages(1);
				}
			} finally {
				setLoading(false);
				abortController.current = null;
			}
		},
		[filters]
	);

	const deleteUser = useCallback(
		async (id: number) => {
			try {
				await api.deleteUser(id);
				await fetchUsers(filters); // Refresh with current filters
				return true;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to delete user");
				return false;
			}
		},
		[fetchUsers, filters]
	);

	const updateUser = useCallback(
		async (
			id: number,
			data: { username?: string; password?: string; role?: string }
		) => {
			try {
				await api.updateUser(id, data);
				await fetchUsers(filters); // Refresh with current filters
				return true;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to update user");
				return false;
			}
		},
		[fetchUsers, filters]
	);

	const createUser = useCallback(
		async (username: string, password: string, role: string) => {
			try {
				await api.createUserManual(username, password, "", "", role);
				await fetchUsers(filters); // Refresh with current filters
				return true;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to create user");
				return false;
			}
		},
		[fetchUsers, filters]
	);

	return {
		users,
		totalPages,
		loading,
		error,
		filters,
		fetchUsers,
		deleteUser,
		updateUser,
		createUser,
	};
};
