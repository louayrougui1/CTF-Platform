import {
  IsDate,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Custom decorator enforcing a minimum gap (in minutes) between
 * startDate and the decorated field (endDate).
 * Only runs when both dates are present — other validators handle
 * the missing-value cases.
 */
function MinDurationFromStart(
  minutes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'minDurationFromStart',
      target: (object as any).constructor,
      propertyName,
      options: {
        message: `endDate must be at least ${minutes} minutes after startDate`,
        ...validationOptions,
      },
      validator: {
        validate(endDate: any, args: ValidationArguments) {
          const { startDate } = args.object as CreateEventDto;
          if (!(startDate instanceof Date) || !(endDate instanceof Date))
            return true;
          return endDate.getTime() - startDate.getTime() >= minutes * 60 * 1000;
        },
      },
    });
  };
}

export class CreateEventDto {
  @IsString()
  @Length(3, 100)
  title: string;

  @IsString()
  @Length(0, 500)
  description: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  @MinDurationFromStart(30)
  endDate: Date;
}
