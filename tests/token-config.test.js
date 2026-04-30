const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND_MAX_TOKENS = 8192;
const BACKEND_MAX_TOKENS = 8192;

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertContains(file, text, message) {
  assert(read(file).includes(text), message);
}

[
  'src/js/core.js',
  'backend/src/main/resources/static/js/core.js'
].forEach(file => {
  assertContains(file, 'max_tokens:', `${file} 请求体缺少 max_tokens`);
  assertContains(file, 'streamBuffer', `${file} 流式解析缺少残留 buffer`);
});

[
  'src/js/config.js',
  'backend/src/main/resources/static/js/components/config.js',
  'backend/src/main/resources/static/js/services/ai-config.js'
].forEach(file => {
  assertContains(file, String(FRONTEND_MAX_TOKENS), `${file} 默认 maxTokens 未调整为 ${FRONTEND_MAX_TOKENS}`);
});

[
  'src/js/config.js',
  'backend/src/main/resources/static/js/components/config.js'
].forEach(file => {
  assertContains(file, 'savedMaxTokens >= DEFAULT_MAX_TOKENS', `${file} 未迁移旧的低 maxTokens 配置`);
});

assertContains(
  'backend/src/main/resources/static/js/services/ai-config.js',
  'this.config.maxTokens < this.defaultConfig.maxTokens',
  'ai-config.js 未迁移旧的低 maxTokens 配置'
);

[
  'src/js/config.js',
  'backend/src/main/resources/static/js/components/config.js',
  'backend/src/main/resources/static/js/services/ai-config.js',
  'backend/src/main/resources/static/index.html',
  'backend/src/main/resources/static/Prompt2Draw-v2.1.html',
  'backend/src/main/java/com/aiprompt2draw/controller/UserConfigController.java'
].forEach(file => {
  assertContains(file, 'LongCat-Flash-Chat', `${file} 缺少 LongCat 模型预设`);
  assertContains(file, 'LongCat-2.0-Preview', `${file} 缺少 LongCat 2.0 模型预设`);
  assertContains(file, 'mimo-v2.5-pro', `${file} 缺少小米 MiMo 模型预设`);
  assertContains(file, 'mimo-v2.5', `${file} 缺少小米 MiMo v2.5 模型预设`);
});

[
  'src/js/config.js',
  'backend/src/main/resources/static/js/components/config.js',
  'backend/src/main/resources/static/js/services/ai-config.js'
].forEach(file => {
  assertContains(file, 'xiaomi-token-sgp', `${file} 缺少小米 Token Plan SGP 预设`);
  assertContains(file, 'xiaomi-token-ams', `${file} 缺少小米 Token Plan AMS 预设`);
});

[
  'src/js/core.js',
  'backend/src/main/resources/static/js/core.js'
].forEach(file => {
  assertContains(file, '模型服务商可能未允许浏览器跨域访问', `${file} 缺少 CORS 错误提示`);
  assertContains(file, '当前是 file:// 直接打开', `${file} 缺少 file 协议错误提示`);
  assertContains(file, "headers['api-key'] = apiKey", `${file} 小米请求缺少 api-key 鉴权头`);
  assertContains(file, '当前配置：provider=', `${file} 401 错误缺少当前配置诊断信息`);
});

[
  'src/js/ui.js',
  'backend/src/main/resources/static/js/ui.js'
].forEach(file => {
  assertContains(file, "!this.themeToggleBtn.getAttribute('onclick')", `${file} 主题按钮可能被重复绑定点击事件`);
});

assertContains(
  'backend/src/main/resources/static/js/components/main.js',
  'toggleTheme()',
  'MainComponent 缺少主题切换方法'
);

assertContains(
  'backend/src/main/java/com/aiprompt2draw/dto/UserGenerateRequest.java',
  'Integer maxTokens = AIModelConstant.DEFAULT_MAX_TOKENS',
  'UserGenerateRequest 默认 maxTokens 未调整'
);

assertContains(
  'backend/src/main/java/com/aiprompt2draw/constant/AIModelConstant.java',
  `DEFAULT_MAX_TOKENS = ${BACKEND_MAX_TOKENS}`,
  '后端默认最大Token常量未调整'
);

assertContains(
  'backend/src/main/resources/init.sql',
  `max_tokens\` INT DEFAULT ${BACKEND_MAX_TOKENS}`,
  'init.sql 建表默认 max_tokens 未调整'
);

console.log('token config checks passed');
