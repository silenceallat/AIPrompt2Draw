# 🔧 本地配置说明

## 配置文件结构

项目现在使用分层配置，确保数据库信息安全：

```
src/main/resources/
├── application.yml          # 主配置文件（安全，可提交）
├── application-local.yml    # 本地数据库配置（已忽略，不提交）
└── static/                  # 前端静态资源
```

## 🚀 快速启动

### 方式1：使用启动脚本（推荐）
```bash
# 双击运行 start.bat
# 或在命令行中执行：
./start.bat
```

### 方式2：手动启动
```bash
# 进入项目目录
cd D:\code\Cursor_Code\02_Web开发项目\AIPrompt2Draw\backend

# 启动应用
mvn spring-boot:run
```

## 📝 配置说明

### 本地配置文件 (application-local.yml)


### 主配置文件 (application.yml)
默认使用 `local` profile：
```yaml
spring:
  profiles:
    active: local  # 使用本地配置
```

## 🔒 安全特性

✅ **已配置 .gitignore**
- `application-local.yml` 已被忽略
- `logs/` 目录已忽略
- 其他敏感文件已忽略

✅ **配置分离**
- 敏感信息在本地文件
- 主配置文件安全可提交
- 支持环境变量覆盖

✅ **团队协作友好**
- 每个开发者有自己的配置
- 不会因为配置冲突
- 保护生产环境信息

## 🔧 自定义配置

### 修改数据库连接
编辑 `application-local.yml` 文件：
```yaml
spring:
  datasource:
    url: jdbc:mysql://你的数据库地址:3306/aiprompt2draw?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: 你的用户名
    password: 你的密码
```

### 使用环境变量
```bash
# Windows
set SPRING_DATASOURCE_PASSWORD=你的密码 && mvn spring-boot:run

# Linux/Mac
export SPRING_DATASOURCE_PASSWORD=你的密码
mvn spring-boot:run
```

## 🌐 访问应用

启动成功后，可以通过以下地址访问：
- **前端页面**: http://localhost:8080/
- **健康检查**: http://localhost:8080/actuator/health

## 📋 注意事项

1. **不要提交** `application-local.yml` 到版本控制系统
2. **定期检查** `.gitignore` 是否正确配置
3. **团队协作时** 每个成员都需要自己的 `application-local.yml`
4. **生产环境** 使用环境变量或配置中心管理敏感信息

* * *

🎯 已完成的主要工作

1. 架构重构 ✅

- 将传统多页面架构升级为现代SPA（单页应用）架构
- 实现了模块化的组件系统
- 建立了清晰的代码组织和依赖管理

2. CSS样式模块化 ✅

- 创建了 main-layout.css - 主界面布局样式
- 创建了 dark-theme.css - 深色主题适配
- 支持完整的主题切换功能

3. JavaScript核心模块拆分 ✅

- ai-config.js - AI服务商配置管理
- chat-manager.js - 聊天消息管理
- drawio-manager.js - DrawIO集成管理
- chat-service.js - 聊天服务（支持后端集成）
- quota-service.js - 配额管理服务

4. 后端API集成 ✅

- 创建了 UserGenerateRequest.java DTO
- 添加了JWT认证的用户流程图生成端点 (/api/v1/user/generate)
- 添加了JWT认证的用户配额查询端点 (/api/v1/user/quota)
- 实现了前端配置与后端API的双向同步

5. 用户认证和权限管理 ✅

- 集成了现有的JWT认证系统
- 实现了基于用户身份的API访问控制
- 添加了配额管理功能

6. 代码优化和清理 ✅

- 移除了重复和过时的代码
- 优化了API调用流程
- 统一了错误处理和日志记录

🏗️ 新的项目结构

backend/src/main/resources/static/
├── index.html                 # SPA应用入口
├── css/
│   ├── app.css                # 统一样式框架
│   ├── main-layout.css        # 主界面布局样式
│   └── dark-theme.css         # 深色主题样式
├── js/
│   ├── app.js                 # 应用主入口
│   ├── auth.js                # 认证管理
│   ├── router.js              # SPA路由系统
│   ├── api.js                 # 统一API客户端
│   └── services/              # 服务模块
│       ├── ai-config.js       # AI配置管理
│       ├── chat-manager.js    # 聊天管理
│       ├── drawio-manager.js  # DrawIO管理
│       ├── chat-service.js    # 聊天服务
│       └── quota-service.js   # 配额服务
└── components/                # 组件模块
├── base/component.js     # 基础组件类
├── login.js              # 登录组件
├── main.js               # 主界面组件
├── profile.js            # 个人中心组件
└── admin.js              # 管理后台组件

🔧 技术特性

前端特性

- SPA架构: 客户端路由，无刷新页面切换
- 组件化: ES6类基础的组件系统
- 服务化: 模块化的业务逻辑服务
- 事件驱动: 统一的事件管理和响应
- 主题系统: 完整的明暗主题切换
- 响应式设计: 移动端适配

后端集成

- JWT认证: 基于Token的用户认证
- 配额管理: 用户使用配额追踪
- API代理: 安全的后端API调用
- 配置同步: 前后端配置数据同步

🚀 使用方式

1. 启动后端服务:
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=local
2. 访问应用:
   - 主页面: http://localhost:8080
   - 登录页面: http://localhost:8080/login
   - 个人中心: http://localhost:8080/profile
   - 管理后台: http://localhost:8080/admin (需要管理员权限)

📝 后续优化建议

1. API Key管理: 实现用户级别的API Key存储和管理
2. 流式处理: 完善Server-Sent Events流式响应
3. 错误处理: 增强用户友好的错误提示
4. 性能优化: 实现代码分割和懒加载
5. 测试覆盖: 添加单元测试和集成测试

项目现在已经具备了完整的SPA架构，支持用户认证、配额管理、主题切换等现代Web应用特性，可以投入生产使
用。
