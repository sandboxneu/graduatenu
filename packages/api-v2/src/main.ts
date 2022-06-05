import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { EnvironmentVariables } from "./environment-variables";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });

  /**
   * Global pipe that ensures all incoming data is validated according to the
   * class-validator decorators in the incoming data's type.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties from incoming objects that aren't decorated with class-validator
      transform: true, // transforms properties from incoming objects to the type they are decorated with by class-validator
    })
  );

  /**
   * Global intercerceptor that transforms outgoing data and strips properties
   * with the "@Exclude" decorator from being sent in the response.
   * For this to work, returned objects in controllers have to be an actual instance
   * of the type with the appropriate decorators.
   */
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  /**
   * All paths are prefixed with /api.
   */
  app.setGlobalPrefix("api");

  const configService: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  await app.listen(configService.get("PORT"));
}

bootstrap();
