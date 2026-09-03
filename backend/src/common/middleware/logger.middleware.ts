import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  private readonly logDir = path.join(process.cwd(), "logs");
  private readonly logFile = path.join(this.logDir, "requests.txt");

  constructor() {
    fs.mkdirSync(this.logDir, { recursive: true });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const client = req.ip ?? req.socket?.remoteAddress ?? "-";
    const { method, originalUrl } = req;

    res.on("finish", () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;

      const statusCode = res.statusCode;
      const statusPhrase = http.STATUS_CODES[statusCode] ?? "Unknown Status";

      const now = new Date();

      const timestamp =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-` +
        `${String(now.getDate()).padStart(2, "0")} ` +
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}:` +
        `${String(now.getSeconds()).padStart(2, "0")}`;

      const message =
        `${timestamp} FROM: app.main : ${client} - ` +
        `"${method} ${originalUrl} HTTP/${req.httpVersion}" ` +
        `${statusCode} ${statusPhrase} in ${(durationMs / 1000).toFixed(3)}s`;

      // Console
      this.logger.log(message);

      // File: logs/requests.txt
      fs.appendFile(this.logFile, `${message}\n`, (err) => {
        if (err) {
          this.logger.error(`Failed to write request log: ${err.message}`);
        }
      });
    });

    next();
  }
}
