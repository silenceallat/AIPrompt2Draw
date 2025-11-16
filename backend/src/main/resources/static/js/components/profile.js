/**
 * 个人中心组件
 * 包含用户信息、密码修改、使用统计、登录历史等功能
 */

class ProfileComponent extends BaseComponent {
    constructor() {
        super();
        this.activeTab = 'info';
        this.isLoading = false;
        this.profileData = {};
        this.usageData = {};
        this.loginHistory = [];
        this.currentPage = 1;
        this.pageSize = 10;
    }

    /**
     * 初始化状态
     */
    initState() {
        this.state = {
            user: window.authManager?.getCurrentUser() || null,
            tabs: [
                {
                    id: 'info',
                    title: '基本信息',
                    icon: '👤',
                    description: '查看和编辑个人资料'
                },
                {
                    id: 'security',
                    title: '安全设置',
                    icon: '🔐',
                    description: '修改密码和安全设置'
                },
                {
                    id: 'usage',
                    title: '使用统计',
                    icon: '📊',
                    description: '查看使用情况统计'
                },
                {
                    id: 'history',
                    title: '登录历史',
                    icon: '🕐',
                    description: '查看登录记录'
                }
            ],
            passwordForm: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            profileForm: {
                nickname: '',
                email: '',
                phone: ''
            }
        };
    }

    /**
     * 执行渲染
     */
    async doRender(container) {
        // 加载用户数据
        await this.loadUserData();

        container.innerHTML = this.getProfileHTML();

        // 绑定事件
        this.bindEvents();

        // 加载初始标签页
        await this.loadTabContent(this.activeTab);
    }

    /**
     * 获取个人中心HTML
     */
    getProfileHTML() {
        const user = this.state.user;
        const tabs = this.state.tabs;

        return `
            <div class="profile-container">
                <!-- 用户信息卡片 -->
                <div class="profile-header-card">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar">
                            <div class="avatar-circle large">
                                ${user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <button class="avatar-edit-btn" id="avatarEditBtn" title="更换头像">
                                📷
                            </button>
                        </div>
                        <div class="profile-info">
                            <h2 class="profile-name">${user?.nickname || user?.username || '用户'}</h2>
                            <p class="profile-username">@${user?.username || 'user'}</p>
                            <div class="profile-meta">
                                <span class="profile-role ${user?.role === AppConfig.USER_ROLES.ADMIN ? 'admin' : ''}">
                                    ${user?.role === AppConfig.USER_ROLES.ADMIN ? '👑 管理员' : '👤 普通用户'}
                                </span>
                                <span class="profile-join-date">
                                    加入时间：${user?.createTime || '未知'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-stats">
                        <div class="stat-item">
                            <div class="stat-value" id="totalGenerations">0</div>
                            <div class="stat-label">生成总数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="thisMonthGenerations">0</div>
                            <div class="stat-label">本月生成</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="totalLogins">0</div>
                            <div class="stat-label">登录次数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="lastLoginDays">0</div>
                            <div class="stat-label">距离上次登录</div>
                        </div>
                    </div>
                </div>

                <!-- 标签页导航 -->
                <div class="profile-tabs">
                    <div class="tab-nav">
                        ${tabs.map(tab => `
                            <button class="tab-btn ${tab.id === this.activeTab ? 'active' : ''}"
                                    data-tab="${tab.id}"
                                    title="${tab.description}">
                                <span class="tab-icon">${tab.icon}</span>
                                <span class="tab-text">${tab.title}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- 标签页内容 -->
                <div class="profile-content">
                    <div class="tab-content" id="tabContent">
                        <!-- 动态内容将在这里加载 -->
                        <div class="loading-placeholder">
                            <div class="loading-spinner"></div>
                            <p>正在加载...</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                ${this.getProfileCSS()}
            </style>
        `;
    }

    /**
     * 获取个人中心CSS
     */
    getProfileCSS() {
        return `
            .profile-container {
                max-width: 1000px;
                margin: 0 auto;
            }

            /* 用户信息卡片 */
            .profile-header-card {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                border-radius: var(--radius-2xl);
                padding: var(--spacing-8);
                margin-bottom: var(--spacing-8);
                box-shadow: var(--shadow-lg);
            }

            .profile-avatar-section {
                display: flex;
                align-items: center;
                gap: var(--spacing-6);
                margin-bottom: var(--spacing-8);
            }

            .profile-avatar {
                position: relative;
            }

            .avatar-circle.large {
                width: 120px;
                height: 120px;
                border-radius: var(--radius-full);
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--text-4xl);
                font-weight: 600;
                border: 4px solid rgba(255, 255, 255, 0.3);
            }

            .avatar-edit-btn {
                position: absolute;
                bottom: 8px;
                right: 8px;
                width: 36px;
                height: 36px;
                border: none;
                border-radius: var(--radius-full);
                background: rgba(255, 255, 255, 0.9);
                color: var(--primary-color);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--text-lg);
                transition: all var(--transition-fast);
                box-shadow: var(--shadow-md);
            }

            .avatar-edit-btn:hover {
                background: white;
                transform: scale(1.1);
            }

            .profile-info {
                flex: 1;
            }

            .profile-name {
                font-size: var(--text-3xl);
                font-weight: 600;
                margin: 0 0 var(--spacing-2) 0;
            }

            .profile-username {
                font-size: var(--text-lg);
                opacity: 0.9;
                margin: 0 0 var(--spacing-4) 0;
            }

            .profile-meta {
                display: flex;
                align-items: center;
                gap: var(--spacing-4);
                font-size: var(--text-sm);
                opacity: 0.8;
            }

            .profile-role {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-1);
                padding: var(--spacing-1) var(--spacing-3);
                background: rgba(255, 255, 255, 0.2);
                border-radius: var(--radius-full);
            }

            .profile-role.admin {
                background: rgba(251, 191, 36, 0.2);
            }

            .profile-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: var(--spacing-4);
            }

            .stat-item {
                text-align: center;
                padding: var(--spacing-4);
                background: rgba(255, 255, 255, 0.1);
                border-radius: var(--radius-xl);
                backdrop-filter: blur(10px);
            }

            .stat-value {
                font-size: var(--text-3xl);
                font-weight: 700;
                margin-bottom: var(--spacing-2);
            }

            .stat-label {
                font-size: var(--text-sm);
                opacity: 0.8;
            }

            /* 标签页 */
            .profile-tabs {
                background-color: var(--bg-primary);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-sm);
                margin-bottom: var(--spacing-6);
                overflow: hidden;
            }

            .tab-nav {
                display: flex;
                background-color: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-primary);
            }

            .tab-btn {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                padding: var(--spacing-4) var(--spacing-6);
                border: none;
                background: none;
                color: var(--text-secondary);
                font-size: var(--text-sm);
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-fast);
                position: relative;
            }

            .tab-btn:hover {
                color: var(--text-primary);
                background-color: var(--bg-secondary);
            }

            .tab-btn.active {
                color: var(--primary-color);
                background-color: var(--bg-primary);
            }

            .tab-btn.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                border-radius: var(--radius-sm) var(--radius-sm) 0 0;
            }

            .tab-icon {
                font-size: var(--text-lg);
            }

            .tab-text {
                white-space: nowrap;
            }

            /* 标签页内容 */
            .profile-content {
                background-color: var(--bg-primary);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-sm);
                overflow: hidden;
            }

            .tab-content {
                padding: var(--spacing-8);
            }

            .loading-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-12);
                color: var(--text-tertiary);
            }

            .loading-placeholder .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--border-primary);
                border-top-color: var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: var(--spacing-4);
            }

            /* 表单样式 */
            .profile-form {
                max-width: 600px;
            }

            .form-section {
                margin-bottom: var(--spacing-8);
            }

            .form-section h3 {
                font-size: var(--text-xl);
                font-weight: 600;
                margin-bottom: var(--spacing-4);
                color: var(--text-primary);
            }

            .form-grid {
                display: grid;
                gap: var(--spacing-4);
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2);
            }

            .form-label {
                font-size: var(--text-sm);
                font-weight: 500;
                color: var(--text-secondary);
            }

            .form-input {
                padding: var(--spacing-3) var(--spacing-4);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-lg);
                font-size: var(--text-base);
                background-color: var(--bg-primary);
                color: var(--text-primary);
                transition: all var(--transition-fast);
            }

            .form-input:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .form-input.error {
                border-color: var(--error-color);
            }

            .form-error {
                font-size: var(--text-sm);
                color: var(--error-color);
            }

            .form-actions {
                display: flex;
                gap: var(--spacing-3);
                margin-top: var(--spacing-6);
            }

            /* 密码强度指示器 */
            .password-strength {
                display: flex;
                gap: var(--spacing-1);
                margin-top: var(--spacing-2);
            }

            .strength-bar {
                flex: 1;
                height: 4px;
                background-color: var(--border-primary);
                border-radius: var(--radius-full);
                transition: background-color var(--transition-fast);
            }

            .strength-bar.active {
                background-color: var(--success-color);
            }

            .strength-bar.weak {
                background-color: var(--error-color);
            }

            .strength-bar.medium {
                background-color: var(--warning-color);
            }

            .strength-bar.strong {
                background-color: var(--success-color);
            }

            .password-hint {
                font-size: var(--text-xs);
                color: var(--text-tertiary);
                margin-top: var(--spacing-1);
            }

            /* 统计卡片 */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--spacing-6);
            }

            .stats-card {
                background: linear-gradient(135deg, var(--bg-primary), var(--bg-tertiary));
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-xl);
                padding: var(--spacing-6);
                transition: all var(--transition-fast);
            }

            .stats-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }

            .stats-card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--spacing-4);
            }

            .stats-card-title {
                font-size: var(--text-lg);
                font-weight: 600;
                color: var(--text-primary);
            }

            .stats-card-icon {
                font-size: var(--text-2xl);
                opacity: 0.6;
            }

            .stats-card-value {
                font-size: var(--text-3xl);
                font-weight: 700;
                color: var(--primary-color);
                margin-bottom: var(--spacing-2);
            }

            .stats-card-description {
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            /* 历史记录表格 */
            .history-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: var(--spacing-4);
            }

            .history-table th,
            .history-table td {
                text-align: left;
                padding: var(--spacing-3) var(--spacing-4);
                border-bottom: 1px solid var(--border-primary);
            }

            .history-table th {
                font-size: var(--text-sm);
                font-weight: 600;
                color: var(--text-secondary);
                background-color: var(--bg-tertiary);
            }

            .history-table td {
                font-size: var(--text-sm);
                color: var(--text-primary);
            }

            .history-table tr:hover {
                background-color: var(--bg-secondary);
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-1);
                padding: var(--spacing-1) var(--spacing-2);
                border-radius: var(--radius-full);
                font-size: var(--text-xs);
                font-weight: 500;
            }

            .status-badge.success {
                background-color: rgba(16, 185, 129, 0.1);
                color: var(--success-color);
            }

            .status-badge.failed {
                background-color: rgba(239, 68, 68, 0.1);
                color: var(--error-color);
            }

            /* 分页 */
            .pagination {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-2);
                margin-top: var(--spacing-6);
            }

            .pagination-btn {
                padding: var(--spacing-2) var(--spacing-3);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                background-color: var(--bg-primary);
                color: var(--text-primary);
                font-size: var(--text-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
            }

            .pagination-btn:hover:not(:disabled) {
                background-color: var(--bg-tertiary);
            }

            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .pagination-btn.active {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                border-color: var(--primary-color);
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .profile-header-card {
                    padding: var(--spacing-6);
                }

                .profile-avatar-section {
                    flex-direction: column;
                    text-align: center;
                    gap: var(--spacing-4);
                }

                .profile-stats {
                    grid-template-columns: repeat(2, 1fr);
                }

                .tab-nav {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .tab-content {
                    padding: var(--spacing-4);
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                }

                .form-actions {
                    flex-direction: column;
                }
            }

            @media (max-width: 480px) {
                .profile-stats {
                    grid-template-columns: 1fr;
                }

                .tab-btn {
                    padding: var(--spacing-3) var(--spacing-4);
                    min-width: 120px;
                }

                .tab-text {
                    display: none;
                }
            }
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 标签页切换
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // 头像编辑
        const avatarEditBtn = this.container.querySelector('#avatarEditBtn');
        avatarEditBtn?.addEventListener('click', () => this.handleAvatarEdit());

        // 全局事件监听（动态内容）
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'saveProfileBtn') {
                this.handleProfileSave();
            }
            if (e.target.id === 'changePasswordBtn') {
                this.handlePasswordChange();
            }
            if (e.target.id === 'refreshUsageBtn') {
                this.refreshUsageData();
            }
            if (e.target.id === 'refreshHistoryBtn') {
                this.refreshLoginHistory();
            }
        });

        // 密码强度检测
        this.container.addEventListener('input', (e) => {
            if (e.target.id === 'newPassword') {
                this.checkPasswordStrength(e.target.value);
            }
        });
    }

    /**
     * 切换标签页
     */
    async switchTab(tabId) {
        if (tabId === this.activeTab) return;

        try {
            this.showLoading();

            // 更新标签状态
            this.updateTabState(tabId);

            // 加载内容
            await this.loadTabContent(tabId);

            this.activeTab = tabId;
            this.hideLoading();

        } catch (error) {
            this.logError('切换标签页失败', error);
            this.showError('切换失败，请重试');
        }
    }

    /**
     * 更新标签状态
     */
    updateTabState(tabId) {
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * 加载标签页内容
     */
    async loadTabContent(tabId) {
        const contentElement = this.container.querySelector('#tabContent');
        if (!contentElement) return;

        try {
            switch (tabId) {
                case 'info':
                    await this.loadProfileInfo(contentElement);
                    break;
                case 'security':
                    await this.loadSecuritySettings(contentElement);
                    break;
                case 'usage':
                    await this.loadUsageStats(contentElement);
                    break;
                case 'history':
                    await this.loadLoginHistory(contentElement);
                    break;
                default:
                    this.showError('未知标签页');
            }
        } catch (error) {
            this.logError('加载标签页内容失败', error);
            contentElement.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载内容，请稍后重试。</p>
                </div>
            `;
        }
    }

    /**
     * 加载个人信息
     */
    async loadProfileInfo(container) {
        const user = this.state.user;

        container.innerHTML = `
            <div class="profile-form">
                <div class="form-section">
                    <h3>基本信息</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-input" value="${user?.username || ''}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">显示名称</label>
                            <input type="text" class="form-input" id="nicknameInput" value="${user?.nickname || ''}" placeholder="请输入显示名称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">邮箱地址</label>
                            <input type="email" class="form-input" id="emailInput" value="${this.profileData.email || ''}" placeholder="请输入邮箱地址">
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号码</label>
                            <input type="tel" class="form-input" id="phoneInput" value="${this.profileData.phone || ''}" placeholder="请输入手机号码">
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" id="saveProfileBtn">
                        保存修改
                    </button>
                    <button class="btn btn-secondary" id="cancelProfileBtn">
                        取消
                    </button>
                </div>
            </div>
        `;

        // 绑定取消按钮事件
        const cancelBtn = container.querySelector('#cancelProfileBtn');
        cancelBtn?.addEventListener('click', () => this.loadProfileInfo(container));
    }

    /**
     * 加载安全设置
     */
    async loadSecuritySettings(container) {
        container.innerHTML = `
            <div class="profile-form">
                <div class="form-section">
                    <h3>修改密码</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">当前密码</label>
                            <input type="password" class="form-input" id="currentPasswordInput" placeholder="请输入当前密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input type="password" class="form-input" id="newPasswordInput" placeholder="请输入新密码">
                            <div class="password-strength" id="passwordStrength">
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                            </div>
                            <div class="password-hint">密码长度至少8位，包含字母和数字</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认新密码</label>
                            <input type="password" class="form-input" id="confirmPasswordInput" placeholder="请再次输入新密码">
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" id="changePasswordBtn">
                        修改密码
                    </button>
                    <button class="btn btn-secondary" id="clearPasswordBtn">
                        清空
                    </button>
                </div>
            </div>
        `;

        // 绑定清空按钮事件
        const clearBtn = container.querySelector('#clearPasswordBtn');
        clearBtn?.addEventListener('click', () => {
            container.querySelector('#currentPasswordInput').value = '';
            container.querySelector('#newPasswordInput').value = '';
            container.querySelector('#confirmPasswordInput').value = '';
            this.updatePasswordStrength([]);
        });
    }

    /**
     * 加载使用统计
     */
    async loadUsageStats(container) {
        try {
            // 获取使用统计数据
            const usageData = await this.fetchUsageStats();
            this.usageData = usageData;

            container.innerHTML = `
                <div class="usage-stats">
                    <div class="stats-grid">
                        <div class="stats-card">
                            <div class="stats-card-header">
                                <h4 class="stats-card-title">总生成数</h4>
                                <span class="stats-card-icon">📊</span>
                            </div>
                            <div class="stats-card-value">${usageData.totalGenerations || 0}</div>
                            <div class="stats-card-description">累计生成的流程图数量</div>
                        </div>

                        <div class="stats-card">
                            <div class="stats-card-header">
                                <h4 class="stats-card-title">本月生成</h4>
                                <span class="stats-card-icon">📈</span>
                            </div>
                            <div class="stats-card-value">${usageData.monthlyGenerations || 0}</div>
                            <div class="stats-card-description">本月生成的流程图数量</div>
                        </div>

                        <div class="stats-card">
                            <div class="stats-card-header">
                                <h4 class="stats-card-title">API调用次数</h4>
                                <span class="stats-card-icon">🔄</span>
                            </div>
                            <div class="stats-card-value">${usageData.apiCalls || 0}</div>
                            <div class="stats-card-description">累计API调用次数</div>
                        </div>

                        <div class="stats-card">
                            <div class="stats-card-header">
                                <h4 class="stats-card-title">平均处理时间</h4>
                                <span class="stats-card-icon">⏱️</span>
                            </div>
                            <div class="stats-card-value">${usageData.avgProcessTime || 0}s</div>
                            <div class="stats-card-description">平均处理时间（秒）</div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-secondary" id="refreshUsageBtn">
                            🔄 刷新数据
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            this.logError('加载使用统计失败', error);
            container.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载使用统计数据。</p>
                </div>
            `;
        }
    }

    /**
     * 加载登录历史
     */
    async loadLoginHistory(container) {
        try {
            // 获取登录历史数据
            const historyData = await this.fetchLoginHistory();
            this.loginHistory = historyData;

            container.innerHTML = `
                <div class="login-history">
                    <div class="history-table-container">
                        <table class="history-table">
                            <thead>
                                <tr>
                                    <th>登录时间</th>
                                    <th>IP地址</th>
                                    <th>设备信息</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody id="historyTableBody">
                                ${this.renderHistoryTable(historyData)}
                            </tbody>
                        </table>
                    </div>

                    <div class="pagination" id="pagination">
                        ${this.renderPagination()}
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-secondary" id="refreshHistoryBtn">
                            🔄 刷新记录
                        </button>
                    </div>
                </div>
            `;

            // 绑定分页事件
            this.bindPaginationEvents();

        } catch (error) {
            this.logError('加载登录历史失败', error);
            container.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载登录历史记录。</p>
                </div>
            `;
        }
    }

    /**
     * 渲染历史记录表格
     */
    renderHistoryTable(history) {
        if (!history || history.length === 0) {
            return '<tr><td colspan="4" style="text-align: center;">暂无登录记录</td></tr>';
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = history.slice(start, end);

        return pageData.map(record => `
            <tr>
                <td>${this.formatDateTime(record.loginTime)}</td>
                <td>${record.ipAddress || '-'}</td>
                <td>${record.userAgent || '-'}</td>
                <td>
                    <span class="status-badge ${record.success ? 'success' : 'failed'}">
                        ${record.success ? '✓ 成功' : '✗ 失败'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染分页
     */
    renderPagination() {
        const totalPages = Math.ceil(this.loginHistory.length / this.pageSize);
        if (totalPages <= 1) return '';

        let html = '';

        // 上一页
        html += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                上一页
            </button>
        `;

        // 页码
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // 下一页
        html += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                下一页
            </button>
        `;

        return html;
    }

    /**
     * 绑定分页事件
     */
    bindPaginationEvents() {
        const paginationBtns = this.container.querySelectorAll('.pagination-btn[data-page]');
        paginationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.currentPage = page;
                this.loadLoginHistory(this.container.querySelector('#tabContent'));
            });
        });
    }

    /**
     * 处理头像编辑
     */
    handleAvatarEdit() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadAvatar(file);
            }
        };
        input.click();
    }

    /**
     * 上传头像
     */
    async uploadAvatar(file) {
        try {
            this.showLoading();

            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${AppConfig.API_BASE_URL}/user/avatar`, {
                method: 'POST',
                headers: window.authManager.getAuthHeaders(),
                body: formData
            });

            if (response.ok) {
                this.showSuccess('头像上传成功');
                // 刷新用户信息
                await this.loadUserData();
            } else {
                throw new Error('上传失败');
            }

        } catch (error) {
            this.logError('头像上传失败', error);
            this.showError('头像上传失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 处理个人信息保存
     */
    async handleProfileSave() {
        try {
            const nickname = this.container.querySelector('#nicknameInput')?.value || '';
            const email = this.container.querySelector('#emailInput')?.value || '';
            const phone = this.container.querySelector('#phoneInput')?.value || '';

            // 验证表单
            if (!nickname.trim()) {
                this.showError('请输入显示名称');
                return;
            }

            if (email && !this.isValidEmail(email)) {
                this.showError('请输入有效的邮箱地址');
                return;
            }

            this.showLoading();

            const response = await fetch(`${AppConfig.API_BASE_URL}${ApiEndpoints.USER.UPDATE_PROFILE}`, {
                method: 'PUT',
                headers: window.authManager.getAuthHeaders(),
                body: JSON.stringify({ nickname, email, phone })
            });

            if (response.ok) {
                this.showSuccess('个人信息保存成功');
                // 更新本地用户信息
                await this.loadUserData();
            } else {
                throw new Error('保存失败');
            }

        } catch (error) {
            this.logError('保存个人信息失败', error);
            this.showError('保存失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 处理密码修改
     */
    async handlePasswordChange() {
        try {
            const currentPassword = this.container.querySelector('#currentPasswordInput')?.value || '';
            const newPassword = this.container.querySelector('#newPasswordInput')?.value || '';
            const confirmPassword = this.container.querySelector('#confirmPasswordInput')?.value || '';

            // 验证表单
            if (!currentPassword || !newPassword || !confirmPassword) {
                this.showError('请填写所有密码字段');
                return;
            }

            if (newPassword.length < 8) {
                this.showError('新密码长度至少8位');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showError('两次输入的新密码不一致');
                return;
            }

            if (currentPassword === newPassword) {
                this.showError('新密码不能与当前密码相同');
                return;
            }

            this.showLoading();

            const response = await fetch(`${AppConfig.API_BASE_URL}${ApiEndpoints.USER.CHANGE_PASSWORD}`, {
                method: 'PUT',
                headers: window.authManager.getAuthHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response.ok) {
                this.showSuccess('密码修改成功');
                // 清空表单
                this.container.querySelector('#currentPasswordInput').value = '';
                this.container.querySelector('#newPasswordInput').value = '';
                this.container.querySelector('#confirmPasswordInput').value = '';
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || '修改失败');
            }

        } catch (error) {
            this.logError('密码修改失败', error);
            this.showError(error.message || '密码修改失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 检查密码强度
     */
    checkPasswordStrength(password) {
        let strength = 0;
        const strengthBars = this.container.querySelectorAll('.strength-bar');

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        this.updatePasswordStrength(strength);
    }

    /**
     * 更新密码强度显示
     */
    updatePasswordStrength(strength) {
        const strengthBars = this.container.querySelectorAll('.strength-bar');
        strengthBars.forEach((bar, index) => {
            bar.classList.remove('active', 'weak', 'medium', 'strong');

            if (index < strength) {
                bar.classList.add('active');
                if (strength <= 1) {
                    bar.classList.add('weak');
                } else if (strength <= 2) {
                    bar.classList.add('medium');
                } else {
                    bar.classList.add('strong');
                }
            }
        });
    }

    /**
     * 加载用户数据
     */
    async loadUserData() {
        try {
            // 更新用户信息
            this.state.user = window.authManager?.getCurrentUser();

            // 获取详细的用户资料
            const response = await fetch(`${AppConfig.API_BASE_URL}${ApiEndpoints.USER.PROFILE}`, {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.profileData = data.data;
                    this.updateProfileStats();
                }
            }

        } catch (error) {
            this.logError('加载用户数据失败', error);
        }
    }

    /**
     * 获取使用统计数据
     */
    async fetchUsageStats() {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}${ApiEndpoints.USER.USAGE_STATS}`, {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : {};
            }
        } catch (error) {
            this.logError('获取使用统计失败', error);
        }

        return {};
    }

    /**
     * 获取登录历史
     */
    async fetchLoginHistory() {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}${ApiEndpoints.USER.LOGIN_HISTORY}`, {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : [];
            }
        } catch (error) {
            this.logError('获取登录历史失败', error);
        }

        return [];
    }

    /**
     * 更新个人资料统计数据
     */
    updateProfileStats() {
        const stats = this.profileData.stats || {};

        // 更新统计数据
        this.updateElement('#totalGenerations', stats.totalGenerations || 0);
        this.updateElement('#thisMonthGenerations', stats.monthlyGenerations || 0);
        this.updateElement('#totalLogins', stats.totalLogins || 0);

        // 计算距离上次登录的天数
        const lastLoginTime = stats.lastLoginTime;
        if (lastLoginTime) {
            const days = Math.floor((Date.now() - new Date(lastLoginTime).getTime()) / (1000 * 60 * 60 * 24));
            this.updateElement('#lastLoginDays', days + '天');
        } else {
            this.updateElement('#lastLoginDays', '首次登录');
        }
    }

    /**
     * 更新元素内容
     */
    updateElement(selector, value) {
        const element = this.container?.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * 刷新使用数据
     */
    async refreshUsageData() {
        const contentElement = this.container.querySelector('#tabContent');
        if (contentElement) {
            await this.loadUsageStats(contentElement);
        }
    }

    /**
     * 刷新登录历史
     */
    async refreshLoginHistory() {
        this.currentPage = 1;
        const contentElement = this.container.querySelector('#tabContent');
        if (contentElement) {
            await this.loadLoginHistory(contentElement);
        }
    }

    /**
     * 验证邮箱地址
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 格式化日期时间
     */
    formatDateTime(dateTime) {
        if (!dateTime) return '-';

        const date = new Date(dateTime);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * 显示成功信息
     */
    showSuccess(message) {
        this.logInfo(message);
        // 这里可以显示成功提示
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        this.logError(message);
        // 这里可以显示错误提示
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        this.isLoading = true;
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        this.isLoading = false;
    }
}

// 创建个人中心组件实例
window.profileComponent = new ProfileComponent();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileComponent;
}