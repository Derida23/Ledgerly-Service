"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("../src/app.module");
const prisma_exception_filter_1 = require("../src/prisma/prisma-exception.filter");
let app;
async function bootstrap() {
    if (app)
        return app;
    app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: false,
    });
    app.enableCors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Ledgerly API')
        .setDescription('Personal expense tracker API')
        .setVersion('1.0')
        .addCookieAuth('better-auth.session_token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    await app.init();
    return app;
}
async function handler(req, res) {
    const app = await bootstrap();
    const instance = app.getHttpAdapter().getInstance();
    instance(req, res);
}
//# sourceMappingURL=index.js.map