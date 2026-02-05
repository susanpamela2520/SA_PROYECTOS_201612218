import { Injectable, OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

@Injectable()
export class AuthGrpcClient implements OnModuleInit {
  private client: any;

  async onModuleInit() {
    const PROTO_PATH = join(process.cwd(), 'proto/auth.proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const authProto = protoDescriptor.auth;

    this.client = new authProto.AuthService(
      process.env.AUTH_GRPC_URL || 'auth-service:50051',
      grpc.credentials.createInsecure()
    );
  }

  register(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.Register(data, (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  }

  login(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.Login(data, (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  }
}