import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
    @IsInt()
    @Min(1)
    orderId!: number;

    @IsIn(['WALLET','CARD'])
    method!: 'WALLET' | 'CARD';

    @IsOptional()
    @IsBoolean()
    simulateFailure?: boolean;
}