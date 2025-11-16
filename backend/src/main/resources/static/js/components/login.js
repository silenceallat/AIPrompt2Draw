/**
 * 登录组件
 * 处理用户登录界面的渲染和交互
 */

class LoginComponent extends BaseComponent {
    constructor() {
        super();
        this.isLoading = false;
        this.errorMessage = '';
        this.passwordVisible = false;
    }

    /**
     * 初始化状态
     */
    initState() {
        this.state = {
            username: '',
            password: '',
            rememberMe: false,
            demoAccounts: [
                {
                    type: '普通用户',
                    username: 'user',
                    password: 'user123',
                    description: '体验用户，可使用基本功能'
                },
                {
                    type: '管理员',
                    username: 'admin',
                    password: 'admin123',
                    description: '系统管理员，拥有完整权限'
                }
            ]
        };
    }

    /**
     * 执行渲染
     */
    async doRender(container) {
        container.innerHTML = this.getLoginHTML();
        this.bindLoginEvents();
        this.initPasswordToggle();
    }

    /**
     * 获取登录HTML
     */
    getLoginHTML() {
        return `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="logo">
                            <img src="assets/images/Prompt2Draw-w.png" alt="Logo" class="logo-image">
                            <h1>一语成图</h1>
                            <p class="subtitle">AI流程图生成器</p>
                        </div>
                    </div>

                    <div class="login-body">
                        <div class="error-message" id="errorMessage" style="display: ${this.errorMessage ? 'block' : 'none'}">
                            ${this.errorMessage}
                        </div>

                        <form class="login-form" id="loginForm">
                            <div class="form-group">
                                <label for="username">用户名</label>
                                <div class="input-wrapper">
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        placeholder="请输入用户名"
                                        value="${this.state.username}"
                                        required
                                        autocomplete="username"
                                    >
                                    <span class="input-icon">👤</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="password">密码</label>
                                <div class="input-wrapper">
                                    <input
                                        type="${this.passwordVisible ? 'text' : 'password'}"
                                        id="password"
                                        name="password"
                                        placeholder="请输入密码"
                                        value="${this.state.password}"
                                        required
                                        autocomplete="current-password"
                                    >
                                    <button
                                        type="button"
                                        class="password-toggle"
                                        id="passwordToggle"
                                        title="${this.passwordVisible ? '隐藏密码' : '显示密码'}"
                                    >
                                        ${this.passwordVisible ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div class="form-group checkbox-group">
                                <label class="checkbox-label">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        ${this.state.rememberMe ? 'checked' : ''}
                                    >
                                    <span class="checkbox-text">记住我</span>
                                </label>
                            </div>

                            <button type="submit" class="login-btn" id="loginBtn" ${this.isLoading ? 'disabled' : ''}>
                                ${this.isLoading ? '<span class="loading-spinner"></span>登录中...' : '登录'}
                            </button>
                        </form>
                    </div>

                    <div class="demo-accounts">
                        <h3>演示账号</h3>
                        <div class="demo-list">
                            ${this.state.demoAccounts.map(account => `
                                <div class="demo-item" data-username="${account.username}" data-password="${account.password}">
                                    <div class="demo-type">${account.type}</div>
                                    <div class="demo-credentials">
                                        <span class="demo-label">用户名:</span>
                                        <code>${account.username}</code>
                                        <span class="demo-label">密码:</span>
                                        <code>${account.password}</code>
                                    </div>
                                    <div class="demo-description">${account.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                ${this.getLoginCSS()}
            </style>
        `;
    }

    /**
     * 获取登录页面CSS
     */
    getLoginCSS() {
        return `
            .login-container {
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .login-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 420px;
                padding: 0;
                overflow: hidden;
                animation: slideInUp 0.5s ease-out;
            }

            .login-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 40px 30px;
                text-align: center;
            }

            .logo {
                margin-bottom: 20px;
            }

            .logo-image {
                height: 60px;
                width: 60px;
                margin-bottom: 12px;
                border-radius: 50%;
            }

            .login-header h1 {
                margin: 0 0 8px 0;
                font-size: 28px;
                font-weight: 600;
            }

            .subtitle {
                margin: 0;
                opacity: 0.9;
                font-size: 14px;
            }

            .login-body {
                padding: 30px 40px;
            }

            .error-message {
                background: #fee2f2;
                color: #dc2626;
                border: 1px solid #fca5a5;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 20px;
                font-size: 14px;
                text-align: center;
                animation: shake 0.5s ease-in-out;
            }

            .login-form {
                margin-bottom: 20px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #374151;
                font-size: 14px;
            }

            .input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }

            .form-group input {
                flex: 1;
                padding: 14px 16px 14px 48px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.3s ease;
                background: #ffffff;
            }

            .form-group input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .input-icon {
                position: absolute;
                left: 16px;
                color: #9ca3af;
                font-size: 18px;
                pointer-events: none;
            }

            .password-toggle {
                position: absolute;
                right: 12px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                color: #6b7280;
                font-size: 16px;
                border-radius: 4px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .password-toggle:hover {
                color: #667eea;
                background: rgba(102, 126, 234, 0.1);
            }

            .password-toggle:active {
                transform: scale(0.95);
            }

            .checkbox-group {
                margin-bottom: 24px;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                font-weight: 400;
                color: #6b7280;
                cursor: pointer;
                font-size: 14px;
            }

            .checkbox-label input[type="checkbox"] {
                width: auto;
                margin-right: 8px;
                cursor: pointer;
            }

            .checkbox-text {
                user-select: none;
            }

            .login-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .login-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
            }

            .login-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s linear infinite;
                margin-right: 8px;
                display: inline-block;
                vertical-align: middle;
            }

            .demo-accounts {
                border-top: 1px solid #f3f4f6;
                padding: 20px 40px;
                background: #fafbfc;
            }

            .demo-accounts h3 {
                margin: 0 0 16px 0;
                font-size: 14px;
                font-weight: 600;
                color: #6b7280;
            }

            .demo-item {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .demo-item:hover {
                border-color: #667eea;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
            }

            .demo-item:last-child {
                margin-bottom: 0;
            }

            .demo-type {
                font-weight: 600;
                color: #374151;
                margin-bottom: 6px;
                font-size: 14px;
            }

            .demo-credentials {
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: #6b7280;
                margin-bottom: 4px;
                line-height: 1.4;
            }

            .demo-label {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #9ca3af;
            }

            .demo-description {
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.3;
            }

            .demo-item code {
                background: #f1f5f9;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }

            /* 动画 */
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* 响应式设计 */
            @media (max-width: 480px) {
                .login-container {
                    padding: 16px;
                }

                .login-card {
                    max-width: 100%;
                }

                .login-header,
                .login-body {
                    padding: 30px 20px;
                }

                .demo-accounts {
                    padding: 20px;
                }
            }
        `;
    }

    /**
     * 绑定登录表单事件
     */
    bindLoginEvents() {
        const form = this.container.querySelector('#loginForm');
        const usernameInput = this.container.querySelector('#username');
        const passwordInput = this.container.querySelector('#password');
        const rememberCheckbox = this.container.querySelector('#rememberMe');

        // 输入变化事件
        usernameInput.addEventListener('input', (e) => {
            this.updateState({ username: e.target.value });
        });

        passwordInput.addEventListener('input', (e) => {
            this.updateState({ password: e.target.value });
        });

        rememberCheckbox.addEventListener('change', (e) => {
            this.updateState({ rememberMe: e.target.checked });
        });

        // 表单提交事件
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // 演示账号点击事件
        const demoItems = this.container.querySelectorAll('.demo-item');
        demoItems.forEach(item => {
            item.addEventListener('click', () => {
                const username = item.dataset.username;
                const password = item.dataset.password;

                this.updateState({ username, password });

                // 更新表单
                usernameInput.value = username;
                passwordInput.value = password;

                // 聚焦到密码输入框
                passwordInput.focus();
            });
        });
    }

    /**
     * 初始化密码可见性切换
     */
    initPasswordToggle() {
        const passwordToggle = this.container.querySelector('#passwordToggle');
        const passwordInput = this.container.querySelector('#password');

        passwordToggle.addEventListener('click', () => {
            this.passwordVisible = !this.passwordVisible;
            passwordInput.type = this.passwordVisible ? 'text' : 'password';
            passwordToggle.textContent = this.passwordVisible ? '🙈' : '👁️';
            passwordToggle.title = this.passwordVisible ? '隐藏密码' : '显示密码';
        });
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        const username = this.state.username.trim();
        const password = this.state.password;

        // 表单验证
        if (!username || !password) {
            this.showError('请输入用户名和密码');
            return;
        }

        try {
            this.setLoading(true);
            this.clearError();

            // 调用认证管理器进行登录
            const success = await window.authManager.login(username, password);

            if (success) {
                this.logInfo('登录成功', { username });
                // 登录成功后路由器会自动处理跳转
            } else {
                this.showError('登录失败，请检查用户名和密码');
            }

        } catch (error) {
            this.logError('登录异常', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 设置加载状态
     * @param {boolean} loading - 是否加载中
     */
    setLoading(loading) {
        this.isLoading = loading;
        const loginBtn = this.container.querySelector('#loginBtn');
        const form = this.container.querySelector('#loginForm');

        if (loading) {
            loginBtn.disabled = true;
            form.style.opacity = '0.7';
        } else {
            loginBtn.disabled = false;
            form.style.opacity = '1';
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        this.errorMessage = message;
        const errorElement = this.container.querySelector('#errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // 5秒后自动隐藏
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }

    /**
     * 清除错误信息
     */
    clearError() {
        this.errorMessage = '';
        const errorElement = this.container.querySelector('#errorMessage');
        errorElement.style.display = 'none';
    }
}

// 创建登录组件实例
window.loginComponent = new LoginComponent();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginComponent;
}