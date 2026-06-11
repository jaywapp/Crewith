import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { MvpRepository } from "./mvp.repository";
import { PrismaRepository } from "./prisma.repository";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    {
      provide: MvpRepository,
      useClass: PrismaRepository,
    },
  ],
})
export class AppModule {}
