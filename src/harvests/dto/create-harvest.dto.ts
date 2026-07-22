import { IsInt, IsNumber, IsString, IsIn, Min, Max, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'isLessThanOrEqualQuantityObtained', async: false })
class IsLessThanOrEqualQuantityObtained implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    const obj = args.object as CreateHarvestDto;
    return value <= obj.quantityObtained;
  }

  defaultMessage() {
    return 'quantitySold cannot exceed quantityObtained';
  }
}


export class CreateHarvestDto {
  @ApiProperty({ description: 'ID of the production cycle', example: 1 })
  @IsInt()
  @Min(1)
  cycleId: number;

  @ApiProperty({ description: 'Quantity obtained (qq)', example: 25.5 })
  @IsNumber()
  @Min(0.01, { message: 'quantityObtained must be greater than 0' })
  @Max(100000, { message: 'quantityObtained exceeds realistic maximum' })
  quantityObtained: number;

  @ApiProperty({ description: 'Quality grade', enum: ['A', 'B', 'C'], example: 'A' })
  @IsString()
  @IsIn(['A', 'B', 'C'], { message: 'quality must be A, B, or C' })
  quality: string;

  @ApiProperty({ description: 'Unit sale price per qq', example: 120.0 })
  @IsNumber()
  @Min(0.01, { message: 'unitSalePrice must be greater than 0' })
  unitSalePrice: number;

  @ApiProperty({ description: 'Quantity sold (qq)', example: 22.0 })
  @IsNumber()
  @Min(0, { message: 'quantitySold cannot be negative' })
  @Validate(IsLessThanOrEqualQuantityObtained)
  quantitySold: number;
}
