# AIPrompt2Draw Backend

AI流程图生成器后端服务 - Spring Boot 3.x + MySQL + Redis

## 📋 项目简介

这是AIPrompt2Draw的后端系统,实现了以下核心功能:

- ✅ API Key管理和验证
- ✅ 基于Redis的分布式限流
- ✅ 灵活的额度控制系统
- ✅ 多AI模型适配(OpenAI/Claude/文心等)
- ✅ 完整的使用记录和统计
- ✅ 后台管理系统(JWT认证)
- ✅ Docker一键部署

## 🚀 快速开始

### 方式一: Docker Compose部署(推荐)

1. **复制环境变量配置**
```bash
cd backend
cp .env.example .env
# 编辑.env文件,设置必要的配置
```

2. **启动所有服务**
```bash
docker-compose up -d
```

3. **查看日志**
```bash
docker-compose logs -f app
```

4. **访问服务**
- API文档: http://localhost:8080/doc.html
- 健康检查: http://localhost:8080/actuator/health

### 方式二: 本地开发

#### 前置要求

- JDK 17+
- Maven 3.8+
- MySQL 8.0
- Redis 7.0

#### 步骤

1. **创建数据库**
```bash
mysql -u root -p < src/main/resources/init.sql
```

2. **修改配置**
编辑 `src/main/resources/application.yml`,修改数据库和Redis连接信息

3. **构建项目**
```bash
mvn clean package -DskipTests
```

4. **运行应用**
```bash
java -jar target/aiprompt2draw-backend-1.0.0.jar
```

## 📚 API文档

启动后访问: http://localhost:8080/doc.html

### 前端API

#### 1. 生成流程图
```http
POST /api/v1/generate
Headers:
  X-API-Key: akt_test1234567890abcdef
  Content-Type: application/json

Body:
{
  "prompt": "设计一个用户登录流程",
  "modelType": "openai"
}
```

#### 2. 查询额度
```http
GET /api/v1/quota
Headers:
  X-API-Key: akt_test1234567890abcdef
```

### 后台管理API

#### 1. 管理员登录
```http
POST /api/admin/login
Content-Type: application/json

Body:
{
  "username": "admin",
  "password": "admin123"
}
```

#### 2. 创建API Key
```http
POST /api/admin/keys
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "keyType": 1,
  "quota": 100,
  "rateLimit": 10,
  "expireDays": 30,
  "remark": "测试Key"
}
```

#### 3. API Key列表
```http
GET /api/admin/keys?page=1&size=20
Headers:
  Authorization: Bearer {token}
```

## 🔧 配置说明

### 数据库配置
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aiprompt2draw
    username: root
    password: root123
```

### Redis配置
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
```

### AI模型配置
AI模型的API Key需要在数据库的`model_config`表中配置:

```sql
INSERT INTO model_config (model_type, model_name, api_key, api_url, ...)
VALUES ('openai', 'gpt-4', 'sk-your-api-key', 'https://api.openai.com/v1/chat/completions', ...);
```

或通过后台管理界面配置(功能待完善)。

## 🔐 默认账号

**管理员账号**
- 用户名: `admin`
- 密码: `admin123`

**测试API Key**
- Key: `akt_test1234567890abcdef`
- 额度: 10次
- 限流: 10次/分钟

⚠️ **生产环境请立即修改默认密码!**

## 📊 数据库表结构

- `api_key`: API Key管理
- `usage_record`: 使用记录
- `model_config`: AI模型配置
- `admin_user`: 管理员用户

详见: `src/main/resources/init.sql`

## 🛠️ 技术栈

- **框架**: Spring Boot 3.2.0
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.x
- **限流**: Redisson
- **ORM**: MyBatis Plus 3.5.5
- **文档**: Knife4j 4.4.0
- **JWT**: jjwt 0.12.3
- **工具**: Hutool 5.8.24

## 📝 开发指南

### 项目结构
```
backend/
├── src/main/java/com/aiprompt2draw/
│   ├── adapter/          # AI模型适配器
│   ├── config/           # 配置类
│   ├── controller/       # 控制器
│   ├── dto/             # 数据传输对象
│   ├── entity/          # 实体类
│   ├── enums/           # 枚举
│   ├── exception/       # 异常处理
│   ├── interceptor/     # 拦截器
│   ├── mapper/          # MyBatis Mapper
│   ├── service/         # 服务层
│   ├── utils/           # 工具类
│   └── vo/              # 视图对象
├── src/main/resources/
│   ├── application.yml  # 应用配置
│   └── init.sql        # 数据库初始化脚本
├── Dockerfile          # Docker镜像构建
├── docker-compose.yml  # Docker编排
└── pom.xml            # Maven配置
```

### 添加新的AI模型适配器

1. 实现`AIModelAdapter`接口
```java
@Component
public class ClaudeAdapter implements AIModelAdapter {
    @Override
    public AIResponse generateFlowchart(String prompt, ModelConfig config) {
        // 实现Claude API调用
    }

    @Override
    public String getModelType() {
        return "claude";
    }
}
```

2. 在数据库中添加模型配置
```sql
INSERT INTO model_config (model_type, model_name, api_key, api_url, ...)
VALUES ('claude', 'claude-3-sonnet', 'your-api-key', 'https://api.anthropic.com/v1/messages', ...);
```

## 🐛 故障排查

### 1. 数据库连接失败
- 检查MySQL是否启动
- 检查数据库连接配置是否正确
- 检查防火墙设置

### 2. Redis连接失败
- 检查Redis是否启动
- 检查Redis连接配置
- 检查是否设置了密码

### 3. AI调用失败
- 检查模型配置表中的API Key是否正确
- 检查API URL是否可访问
- 查看详细错误日志

### 4. Docker启动失败
- 检查端口是否被占用
- 查看容器日志: `docker-compose logs app`
- 检查.env文件配置

## 📈 性能优化

- Redis缓存: API Key验证、额度查询
- 异步处理: 使用记录保存、额度同步
- 连接池: HikariCP数据库连接池
- 限流: Redisson分布式限流

## 🔒 安全建议

1. **生产环境配置**
   - 修改默认管理员密码
   - 使用强加密密钥(ENCRYPT_KEY, JWT_SECRET)
   - 配置CORS白名单
   - 启用HTTPS

2. **API Key管理**
   - 定期轮换大模型API Key
   - 严格控制试用Key额度
   - 监控异常调用

3. **数据库安全**
   - 使用独立的数据库用户
   - 定期备份数据
   - 敏感信息加密存储

## 📮 联系方式

- Email: support@aiprompt2draw.com
- GitHub: https://github.com/your-org/aiprompt2draw

## 📄 许可证

MIT License
