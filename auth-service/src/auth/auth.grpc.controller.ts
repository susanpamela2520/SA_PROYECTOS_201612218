import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';


@Controller()
export class AuthGrpcController {
  constructor(private auth: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  register(data: any) {
    return this.auth.register(data);
  }

  @GrpcMethod('AuthService', 'Login')
  login(data: any) {
    return this.auth.login(data);
  }
}
