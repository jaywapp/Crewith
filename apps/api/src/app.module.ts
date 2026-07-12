import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { MvpRepository } from "./mvp.repository";
import { PrismaRepository } from "./prisma.repository";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_ACCESS_SECRET");
        if (!secret) {
          throw new Error("JWT_ACCESS_SECRET is required");
        }
        return { secret, signOptions: { expiresIn: "7d" } };
      },
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: MvpRepository,
      useClass: PrismaRepository,
    },
  ],
})
export class AppModule {}
