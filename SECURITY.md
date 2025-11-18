# 🔐 安全配置说明

## 环境变量配置

为了保护敏感信息不被泄露，本项目使用环境变量来配置数据库连接等信息。

### 1. 复制环境变量模板
```bash
cp .env.example .env
```

### 2. 修改 .env 文件
编辑 `.env` 文件，填入你的实际配置：

```properties
# 数据库配置
SPRING_DATASOURCE_URL=jdbc:mysql://your-database-host:3306/aiprompt2draw?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=your-username
SPRING_DATASOURCE_PASSWORD=your-password

# 其他配置...
```

### 3. 启动应用

#### Windows (PowerShell)
```powershell
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/aiprompt2draw?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="your-password"
mvn spring-boot:run
```

#### Windows (CMD)
```cmd
set SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/aiprompt2draw?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
set SPRING_DATASOURCE_USERNAME=root
set SPRING_DATASOURCE_PASSWORD=your-password
mvn spring-boot:run
```

#### Linux/Mac
```bash
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/aiprompt2draw?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true"
export SPRING_DATASOURCE_USERNAME="root"
export SPRING_DATASOURCE_PASSWORD="your-password"
mvn spring-boot:run
```

## ⚠️ 重要提醒

1. **永远不要将 `.env` 文件提交到版本控制系统**
2. **不要在代码中硬编码敏感信息**
3. **定期更换数据库密码和其他敏感凭据**
4. **在生产环境中使用强密码和加密连接**

## Git 配置

项目已配置 `.gitignore` 文件，会自动忽略以下文件：
- `.env`
- `application-local.yml`
- `application-prod.yml`
- `logs/` 目录
- 其他敏感配置文件

确保你的 Git 仓库配置正确：
```bash
git status  # 检查是否有敏感文件被跟踪
git add .gitignore  # 添加 gitignore
git commit -m "Add gitignore for security"  # 提交
```