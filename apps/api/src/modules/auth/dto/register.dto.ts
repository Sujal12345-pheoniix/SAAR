import {
  IsEmail,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  /**
   * Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 symbol.
   */
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters and contain uppercase, lowercase, number, and symbol',
    },
  )
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string | undefined }) => value?.trim())
  displayName?: string;
}
