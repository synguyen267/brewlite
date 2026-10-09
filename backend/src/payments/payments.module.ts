import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MockGatewayService } from './mock-gateway.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
    imports: [AuthModule],
    controllers: [PaymentsController],
    providers: [PaymentsService, MockGatewayService],
})
export class PaymentsModule {}