export interface AdminPermissions {
    canRevokeLicense?: boolean;
    canViewAuditLog?: boolean;
    canManageDevices?: boolean;
}

export interface AdminUser {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN';
    permissions?: AdminPermissions;
    name?: string;
    isActive?: boolean;
}

export interface AuthResponse {
    access_token: string;
}
