import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'maxDecimals', async: false })
class MaxDecimalsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'number' || !isFinite(value)) {
      return false;
    }

    const [maxDecimals] = args.constraints as [number];
    const parts = value.toString().split('.');

    if (parts.length === 1) {
      return true; // No decimals
    }

    return parts[1].length <= maxDecimals;
  }

  defaultMessage(args: ValidationArguments): string {
    const [maxDecimals] = args.constraints as [number];
    return `${args.property} must have at most ${maxDecimals} decimal places`;
  }
}

export function MaxDecimals(maxDecimals: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [maxDecimals],
      validator: MaxDecimalsConstraint,
    });
  };
}
