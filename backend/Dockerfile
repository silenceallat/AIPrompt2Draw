FROM openjdk:17-jdk-slim

LABEL maintainer="AIPrompt2Draw <support@aiprompt2draw.com>"

WORKDIR /app

# 复制jar包
COPY target/aiprompt2draw-backend-*.jar app.jar

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
