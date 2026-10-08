import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { TOPPING_VALUES, type Size } from '../pricing';

export class CreateOrderItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsIn(['S', 'M', 'L'])
  size!: Size;

  @IsArray()
  @ArrayUnique()
  @IsIn(TOPPING_VALUES, { each: true })
  toppings!: string[];

  @IsInt()
  @Min(1)
  @Max(20)
  qty!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}