import type { PropsWithChildren } from "react";
import { createContext, useContext, useState } from 'react';
import type { Me } from "../../shared/types/api";

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
	user: Me | null;
	status: AuthStatus;
	// TODO Step 2
	login: (user: Me, accessToken: string) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<Me | null>(null);
	const [status, setStatus] = useState<AuthStatus>('unauthenticated');

	const login = (nextUser: Me, _accessToken: string) => {
		setUser(nextUser);
		setStatus('authenticated');
	};

	const logout = () => {
		setUser(null);
		setStatus('unauthenticated');
	};

	const value: AuthContextValue = {
		user,
		status,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return ctx;
}
