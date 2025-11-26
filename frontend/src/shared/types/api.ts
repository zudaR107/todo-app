
export type Role = 'superadmin' | 'user';

export interface Me {
	id: string;
	email: string;
	displayName: string;
	role: Role;
}
