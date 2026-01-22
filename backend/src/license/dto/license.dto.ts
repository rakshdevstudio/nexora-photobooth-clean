import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLicenseDto {
    @IsDateString()
    @IsOptional()
    expiresAt?: string;
}

export class AssignLicenseDto {
    @IsString()
    @IsNotEmpty()
    fingerprint: string;

    @IsString()
    @IsOptional()
    deviceName?: string;
}

export class ValidateLicenseDto {
    @IsString()
    @IsNotEmpty()
    licenseKey: string;

    @IsString()
    @IsNotEmpty()
    deviceFingerprint: string;
}
