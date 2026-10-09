import { Injectable } from '@nestjs/common';

@Injectable()
export class MockGatewayService {
    //Mô phỏng cổng thanh toán 
    async charge(input: {
        amount: number;
        method: 'WALLET' | 'CARD';
        simulateFailure?: boolean;
    }): Promise<boolean> {
        await new Promise ((resolve) => setTimeout(resolve, 300));
        return !input.simulateFailure;
    }
}