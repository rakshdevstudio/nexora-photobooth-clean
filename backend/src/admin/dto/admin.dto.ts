import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class UpdateAdminPermissionsDto {
    @IsBoolean()
    @IsOptional()
    canRevokeLicense?: boolean;

    @IsBoolean()
    @IsOptional()
    canViewAuditLog?: boolean;

    @IsBoolean()
    @IsOptional()
    canManageDevices?: boolean;
}

export class UpdateAdminStatusDto {
    @IsBoolean()
    isActive: boolean;
}
