import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { JsonMvpRepository, MvpRepository } from "./mvp.repository";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [
    {
      provide: MvpRepository,
      useClass: JsonMvpRepository,
    },
  ],
})
export class AppModule {}
