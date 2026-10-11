import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { writeFileSync } from "fs";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Hosted behind a reverse proxy (Render/Vercel), so req.ip is the proxy's
  // address unless Express is told to read X-Forwarded-For. Trust exactly one
  // hop — never `true`, which would let clients spoof req.ip via a forged
  // header and bypass the global rate limiter in app.module.ts.
  app.set("trust proxy", 1);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle("My API")
    .setDescription("API documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "bearer", // This is the name you'll reference in @ApiBearerAuth()
    )
    .addCookieAuth(
      "refresh_token", // Cookie name
      {
        type: "apiKey",
        in: "cookie",
        name: "refresh_token",
      },
      "refresh_token", // This is the name you'll reference in @ApiCookieAuth()
    )
    .addCookieAuth(
      "reset_token",
      {
        type: "apiKey",
        in: "cookie",
        name: "reset_token",
      },
      "reset_token",
    )
    .addCookieAuth(
      "google_link_token",
      {
        type: "apiKey",
        in: "cookie",
        name: "google_link_token",
      },
      "google_link_token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  writeFileSync("./openapi.json", JSON.stringify(document, null, 2));
  SwaggerModule.setup("docs", app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
