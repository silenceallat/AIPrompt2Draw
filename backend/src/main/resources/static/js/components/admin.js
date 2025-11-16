/**
 * 管理后台组件
 * 包含用户管理、API密钥管理、AI模型管理、系统配置等功能
 */

class AdminComponent extends BaseComponent {
    constructor() {
        super();
        this.activeTab = 'overview';
        this.isLoading = false;
        this.users = [];
        this.apiKeys = [];
        this.models = [];
        this.systemConfig = {};
        this.currentPage = 1;
        this.pageSize = 20;
    }

    /**
     * 初始化状态
     */
    initState() {
        const authManager = window.authManager || window.AuthManager;
        this.state = {
            user: authManager?.getCurrentUser() || null,
            tabs: [
                {
                    id: 'overview',
                    title: '系统概览',
                    icon: '📊',
                    description: '查看系统整体运行状况'
                },
                {
                    id: 'users',
                    title: '用户管理',
                    icon: '👥',
                    description: '管理系统用户'
                },
                {
                    id: 'apikeys',
                    title: 'API密钥',
                    icon: '🔑',
                    description: '管理API密钥'
                },
                {
                    id: 'models',
                    title: 'AI模型',
                    icon: '🤖',
                    description: '配置AI模型'
                },
                {
                    id: 'settings',
                    title: '系统设置',
                    icon: '⚙️',
                    description: '系统参数配置'
                }
            ],
            userForm: {
                username: '',
                nickname: '',
                email: '',
                role: AppConfig.USER_ROLES.USER,
                status: 'active'
            },
            apiKeyForm: {
                name: '',
                description: '',
                permissions: ['read'],
                status: 'active'
            },
            modelForm: {
                name: '',
                provider: '',
                modelId: '',
                apiKey: '',
                description: '',
                status: 'active'
            }
        };
    }

    /**
     * 执行渲染
     */
    async doRender(container) {
        // 确保状态已初始化
        if (!this.state) {
            this.initState();
        }

        // 检查管理员权限
        const authManager = window.authManager || window.AuthManager;
        if (!authManager?.isAdmin()) {
            container.innerHTML = `
                <div class="access-denied">
                    <h1>❌ 访问被拒绝</h1>
                    <p>您没有权限访问管理后台</p>
                    <button class="btn btn-primary" onclick="window.location.href='#${AppConfig.ROUTES.MAIN}'">
                        返回首页
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.getAdminHTML();

        // 绑定事件
        this.bindEvents();

        // 加载初始标签页
        await this.loadTabContent(this.activeTab);
    }

    /**
     * 获取管理后台HTML
     */
    getAdminHTML() {
        const user = this.state.user;
        const tabs = this.state.tabs;

        return `
            <div class="admin-container">
                <!-- 管理员头部 -->
                <div class="admin-header">
                    <div class="admin-title-section">
                        <h1 class="admin-title">🛠️ 管理后台</h1>
                        <p class="admin-subtitle">系统管理和配置中心</p>
                    </div>
                    <div class="admin-user-info">
                        <span class="admin-badge">👑 管理员</span>
                        <span class="admin-username">${user?.nickname || user?.username}</span>
                    </div>
                </div>

                <!-- 快速操作卡片 -->
                <div class="admin-quick-actions">
                    <div class="quick-action-card" data-action="refresh-stats">
                        <div class="quick-action-icon">🔄</div>
                        <div class="quick-action-title">刷新统计</div>
                        <div class="quick-action-desc">更新系统数据</div>
                    </div>
                    <div class="quick-action-card" data-action="clear-cache">
                        <div class="quick-action-icon">🧹</div>
                        <div class="quick-action-title">清理缓存</div>
                        <div class="quick-action-desc">清理系统缓存</div>
                    </div>
                    <div class="quick-action-card" data-action="backup-data">
                        <div class="quick-action-icon">💾</div>
                        <div class="quick-action-title">数据备份</div>
                        <div class="quick-action-desc">创建系统备份</div>
                    </div>
                    <div class="quick-action-card" data-action="view-logs">
                        <div class="quick-action-icon">📋</div>
                        <div class="quick-action-title">系统日志</div>
                        <div class="quick-action-desc">查看运行日志</div>
                    </div>
                </div>

                <!-- 标签页导航 -->
                <div class="admin-tabs">
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
                <div class="admin-content">
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
                ${this.getAdminCSS()}
            </style>
        `;
    }

    /**
     * 获取管理后台CSS
     */
    getAdminCSS() {
        return `
            .admin-container {
                max-width: 1200px;
                margin: 0 auto;
            }

            /* 管理员头部 */
            .admin-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-8) 0;
                border-bottom: 1px solid var(--border-primary);
                margin-bottom: var(--spacing-8);
            }

            .admin-title-section {
                flex: 1;
            }

            .admin-title {
                font-size: var(--text-4xl);
                font-weight: 700;
                color: var(--text-primary);
                margin: 0 0 var(--spacing-2) 0;
            }

            .admin-subtitle {
                font-size: var(--text-lg);
                color: var(--text-secondary);
                margin: 0;
            }

            .admin-user-info {
                display: flex;
                align-items: center;
                gap: var(--spacing-3);
            }

            .admin-badge {
                background: linear-gradient(135deg, var(--warning-color), #f59e0b);
                color: white;
                padding: var(--spacing-2) var(--spacing-4);
                border-radius: var(--radius-full);
                font-size: var(--text-sm);
                font-weight: 600;
            }

            .admin-username {
                font-size: var(--text-base);
                font-weight: 500;
                color: var(--text-secondary);
            }

            /* 快速操作卡片 */
            .admin-quick-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--spacing-6);
                margin-bottom: var(--spacing-8);
            }

            .quick-action-card {
                background: linear-gradient(135deg, var(--bg-primary), var(--bg-tertiary));
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-xl);
                padding: var(--spacing-6);
                cursor: pointer;
                transition: all var(--transition-fast);
                text-align: center;
            }

            .quick-action-card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
                border-color: var(--primary-color);
            }

            .quick-action-icon {
                font-size: var(--text-3xl);
                margin-bottom: var(--spacing-3);
            }

            .quick-action-title {
                font-size: var(--text-lg);
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: var(--spacing-1);
            }

            .quick-action-desc {
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            /* 标签页样式 */
            .admin-tabs {
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

            /* 管理内容 */
            .admin-content {
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
                width: 48px;
                height: 48px;
                border: 3px solid var(--border-primary);
                border-top-color: var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: var(--spacing-4);
            }

            /* 概览页面样式 */
            .overview-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: var(--spacing-6);
                margin-bottom: var(--spacing-8);
            }

            .overview-card {
                background: linear-gradient(135deg, var(--bg-primary), var(--bg-tertiary));
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-xl);
                padding: var(--spacing-6);
            }

            .overview-card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--spacing-4);
            }

            .overview-card-title {
                font-size: var(--text-lg);
                font-weight: 600;
                color: var(--text-primary);
            }

            .overview-card-icon {
                font-size: var(--text-2xl);
                opacity: 0.7;
            }

            .overview-stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: var(--spacing-4);
                margin-top: var(--spacing-4);
            }

            .stat-item {
                text-align: center;
            }

            .stat-value {
                font-size: var(--text-2xl);
                font-weight: 700;
                color: var(--primary-color);
                margin-bottom: var(--spacing-1);
            }

            .stat-label {
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            /* 表格样式 */
            .admin-table-container {
                background-color: var(--bg-primary);
                border-radius: var(--radius-xl);
                border: 1px solid var(--border-primary);
                overflow: hidden;
                margin-bottom: var(--spacing-6);
            }

            .admin-table-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-4) var(--spacing-6);
                background-color: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-primary);
            }

            .admin-table-title {
                font-size: var(--text-lg);
                font-weight: 600;
                color: var(--text-primary);
            }

            .admin-table-actions {
                display: flex;
                gap: var(--spacing-3);
            }

            .admin-table {
                width: 100%;
                border-collapse: collapse;
            }

            .admin-table th,
            .admin-table td {
                text-align: left;
                padding: var(--spacing-4);
                border-bottom: 1px solid var(--border-primary);
            }

            .admin-table th {
                font-size: var(--text-sm);
                font-weight: 600;
                color: var(--text-secondary);
                background-color: var(--bg-secondary);
            }

            .admin-table td {
                font-size: var(--text-sm);
                color: var(--text-primary);
            }

            .admin-table tr:hover {
                background-color: var(--bg-secondary);
            }

            /* 表单样式 */
            .admin-form {
                background-color: var(--bg-primary);
                border-radius: var(--radius-xl);
                border: 1px solid var(--border-primary);
                padding: var(--spacing-6);
                margin-bottom: var(--spacing-6);
            }

            .form-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--spacing-4);
                margin-bottom: var(--spacing-4);
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

            .form-input,
            .form-select,
            .form-textarea {
                padding: var(--spacing-3) var(--spacing-4);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-lg);
                font-size: var(--text-base);
                background-color: var(--bg-primary);
                color: var(--text-primary);
                transition: all var(--transition-fast);
            }

            .form-textarea {
                resize: vertical;
                min-height: 100px;
            }

            .form-input:focus,
            .form-select:focus,
            .form-textarea:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .form-checkbox-group {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
            }

            .form-checkbox {
                width: 18px;
                height: 18px;
                accent-color: var(--primary-color);
            }

            /* 操作按钮 */
            .action-buttons {
                display: flex;
                gap: var(--spacing-2);
            }

            .action-btn {
                padding: var(--spacing-2) var(--spacing-3);
                border: none;
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
            }

            .action-btn.edit {
                background-color: var(--info-color);
                color: white;
            }

            .action-btn.edit:hover {
                background-color: #2563eb;
            }

            .action-btn.delete {
                background-color: var(--error-color);
                color: white;
            }

            .action-btn.delete:hover {
                background-color: #dc2626;
            }

            .action-btn.view {
                background-color: var(--success-color);
                color: white;
            }

            .action-btn.view:hover {
                background-color: #059669;
            }

            /* 状态标签 */
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-1);
                padding: var(--spacing-1) var(--spacing-2);
                border-radius: var(--radius-full);
                font-size: var(--text-xs);
                font-weight: 500;
            }

            .status-badge.active {
                background-color: rgba(16, 185, 129, 0.1);
                color: var(--success-color);
            }

            .status-badge.inactive {
                background-color: rgba(239, 68, 68, 0.1);
                color: var(--error-color);
            }

            .status-badge.pending {
                background-color: rgba(245, 158, 11, 0.1);
                color: var(--warning-color);
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

            /* 访问拒绝页面 */
            .access-denied {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-12);
                text-align: center;
            }

            .access-denied h1 {
                font-size: var(--text-4xl);
                color: var(--error-color);
                margin-bottom: var(--spacing-4);
            }

            .access-denied p {
                font-size: var(--text-lg);
                color: var(--text-secondary);
                margin-bottom: var(--spacing-6);
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .admin-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: var(--spacing-4);
                }

                .admin-quick-actions {
                    grid-template-columns: repeat(2, 1fr);
                    gap: var(--spacing-4);
                }

                .overview-grid {
                    grid-template-columns: 1fr;
                }

                .admin-table-container {
                    overflow-x: auto;
                }

                .admin-table {
                    min-width: 600px;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .action-buttons {
                    flex-direction: column;
                }
            }

            @media (max-width: 480px) {
                .admin-quick-actions {
                    grid-template-columns: 1fr;
                }

                .tab-nav {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .tab-btn {
                    min-width: 120px;
                }

                .overview-stats {
                    grid-template-columns: 1fr;
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

        // 快速操作
        const quickActionCards = this.container.querySelectorAll('.quick-action-card');
        quickActionCards.forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // 全局事件监听（动态内容）
        this.container.addEventListener('click', (e) => {
            // 用户操作
            if (e.target.classList.contains('edit-user-btn')) {
                this.editUser(e.target.dataset.userId);
            }
            if (e.target.classList.contains('delete-user-btn')) {
                this.deleteUser(e.target.dataset.userId);
            }
            if (e.target.classList.contains('add-user-btn')) {
                this.showAddUserForm();
            }

            // API密钥操作
            if (e.target.classList.contains('edit-apikey-btn')) {
                this.editApiKey(e.target.dataset.keyId);
            }
            if (e.target.classList.contains('delete-apikey-btn')) {
                this.deleteApiKey(e.target.dataset.keyId);
            }
            if (e.target.classList.contains('add-apikey-btn')) {
                this.showAddApiKeyForm();
            }

            // AI模型操作
            if (e.target.classList.contains('edit-model-btn')) {
                this.editModel(e.target.dataset.modelId);
            }
            if (e.target.classList.contains('delete-model-btn')) {
                this.deleteModel(e.target.dataset.modelId);
            }
            if (e.target.classList.contains('add-model-btn')) {
                this.showAddModelForm();
            }
            if (e.target.classList.contains('test-model-btn')) {
                this.testModel(e.target.dataset.modelId);
            }

            // 系统设置操作
            if (e.target.classList.contains('save-settings-btn')) {
                this.saveSystemSettings();
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
                case 'overview':
                    await this.loadOverview(contentElement);
                    break;
                case 'users':
                    await this.loadUsers(contentElement);
                    break;
                case 'apikeys':
                    await this.loadApiKeys(contentElement);
                    break;
                case 'models':
                    await this.loadModels(contentElement);
                    break;
                case 'settings':
                    await this.loadSettings(contentElement);
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
     * 加载系统概览
     */
    async loadOverview(container) {
        try {
            const overviewData = await this.fetchOverviewData();

            container.innerHTML = `
                <div class="overview-grid">
                    <div class="overview-card">
                        <div class="overview-card-header">
                            <h3 class="overview-card-title">用户统计</h3>
                            <span class="overview-card-icon">👥</span>
                        </div>
                        <div class="overview-stats">
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.totalUsers || 0}</div>
                                <div class="stat-label">总用户数</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.activeUsers || 0}</div>
                                <div class="stat-label">活跃用户</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.newUsersToday || 0}</div>
                                <div class="stat-label">今日新增</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.onlineUsers || 0}</div>
                                <div class="stat-label">在线用户</div>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card">
                        <div class="overview-card-header">
                            <h3 class="overview-card-title">生成统计</h3>
                            <span class="overview-card-icon">🎨</span>
                        </div>
                        <div class="overview-stats">
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.totalGenerations || 0}</div>
                                <div class="stat-label">总生成数</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.todayGenerations || 0}</div>
                                <div class="stat-label">今日生成</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.successRate || 0}%</div>
                                <div class="stat-label">成功率</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.avgProcessTime || 0}s</div>
                                <div class="stat-label">平均处理时间</div>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card">
                        <div class="overview-card-header">
                            <h3 class="overview-card-title">系统状态</h3>
                            <span class="overview-card-icon">⚡</span>
                        </div>
                        <div class="overview-stats">
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.systemStatus || '正常'}</div>
                                <div class="stat-label">系统状态</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.cpuUsage || 0}%</div>
                                <div class="stat-label">CPU使用率</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.memoryUsage || 0}%</div>
                                <div class="stat-label">内存使用率</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overviewData.diskUsage || 0}%</div>
                                <div class="stat-label">磁盘使用率</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="admin-form">
                    <h3>最近系统日志</h3>
                    <div class="log-container">
                        ${this.renderSystemLogs(overviewData.recentLogs || [])}
                    </div>
                </div>
            `;

        } catch (error) {
            this.logError('加载系统概览失败', error);
            container.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载系统概览数据。</p>
                </div>
            `;
        }
    }

    /**
     * 加载用户管理
     */
    async loadUsers(container) {
        try {
            const users = await this.fetchUsers();
            this.users = users;

            container.innerHTML = `
                <div class="admin-table-container">
                    <div class="admin-table-header">
                        <h3 class="admin-table-title">用户管理</h3>
                        <div class="admin-table-actions">
                            <button class="btn btn-primary add-user-btn">
                                ➕ 添加用户
                            </button>
                            <button class="btn btn-secondary refresh-users-btn">
                                🔄 刷新
                            </button>
                        </div>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>用户名</th>
                                <th>显示名称</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>状态</th>
                                <th>注册时间</th>
                                <th>最后登录</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderUsersTable(users)}
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="usersPagination">
                    ${this.renderPagination(users.length)}
                </div>
            `;

            // 绑定刷新按钮事件
            const refreshBtn = container.querySelector('.refresh-users-btn');
            refreshBtn?.addEventListener('click', () => this.loadUsers(container));

        } catch (error) {
            this.logError('加载用户数据失败', error);
            container.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载用户数据。</p>
                </div>
            `;
        }
    }

    /**
     * 加载API密钥管理
     */
    async loadApiKeys(container) {
        try {
            const apiKeys = await this.fetchApiKeys();
            this.apiKeys = apiKeys;

            container.innerHTML = `
                <div class="admin-table-container">
                    <div class="admin-table-header">
                        <h3 class="admin-table-title">API密钥管理</h3>
                        <div class="admin-table-actions">
                            <button class="btn btn-primary add-apikey-btn">
                                🔑 添加密钥
                            </button>
                            <button class="btn btn-secondary refresh-apikeys-btn">
                                🔄 刷新
                            </button>
                        </div>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>名称</th>
                                <th>描述</th>
                                <th>密钥</th>
                                <th>权限</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>最后使用</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderApiKeysTable(apiKeys)}
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="apiKeysPagination">
                    ${this.renderPagination(apiKeys.length)}
                </div>
            `;

            // 绑定刷新按钮事件
            const refreshBtn = container.querySelector('.refresh-apikeys-btn');
            refreshBtn?.addEventListener('click', () => this.loadApiKeys(container));

        } catch (error) {
            this.logError('加载API密钥数据失败', error);
            container.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载API密钥数据。</p>
                </div>
            `;
        }
    }

    /**
     * 加载AI模型管理
     */
    async loadModels(container) {
        try {
            const models = await this.fetchModels();
            this.models = models;

            container.innerHTML = `
                <div class="admin-table-container">
                    <div class="admin-table-header">
                        <h3 class="admin-table-title">AI模型管理</h3>
                        <div class="admin-table-actions">
                            <button class="btn btn-primary add-model-btn">
                                🤖 添加模型
                            </button>
                            <button class="btn btn-secondary refresh-models-btn">
                                🔄 刷新
                            </button>
                        </div>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>模型名称</th>
                                <th>提供商</th>
                                <th>模型ID</th>
                                <th>描述</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderModelsTable(models)}
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="modelsPagination">
                    ${this.renderPagination(models.length)}
                </div>
            `;

            // 绑定刷新按钮事件
            const refreshBtn = container.querySelector('.refresh-models-btn');
            refreshBtn?.addEventListener('click', () => this.loadModels(container));

        } catch (error) {
            this.logError('加载AI模型数据失败', error);
            container.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载AI模型数据。</p>
                </div>
            `;
        }
    }

    /**
     * 加载系统设置
     */
    async loadSettings(container) {
        try {
            const config = await this.fetchSystemConfig();
            this.systemConfig = config;

            container.innerHTML = `
                <div class="admin-form">
                    <h3>系统配置</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">系统名称</label>
                            <input type="text" class="form-input" id="systemName" value="${config.systemName || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">系统描述</label>
                            <input type="text" class="form-input" id="systemDescription" value="${config.systemDescription || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">最大用户数</label>
                            <input type="number" class="form-input" id="maxUsers" value="${config.maxUsers || 1000}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">默认语言</label>
                            <select class="form-select" id="defaultLanguage">
                                <option value="zh-CN" ${config.defaultLanguage === 'zh-CN' ? 'selected' : ''}>简体中文</option>
                                <option value="en-US" ${config.defaultLanguage === 'en-US' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">启用注册</label>
                            <div class="form-checkbox-group">
                                <input type="checkbox" class="form-checkbox" id="enableRegistration" ${config.enableRegistration ? 'checked' : ''}>
                                <label for="enableRegistration">允许用户自行注册</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">启用邮件验证</label>
                            <div class="form-checkbox-group">
                                <input type="checkbox" class="form-checkbox" id="enableEmailVerification" ${config.enableEmailVerification ? 'checked' : ''}>
                                <label for="enableEmailVerification">注册时需要验证邮箱</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">系统公告</label>
                        <textarea class="form-textarea" id="systemAnnouncement" rows="4">${config.systemAnnouncement || ''}</textarea>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-primary save-settings-btn">
                            💾 保存设置
                        </button>
                        <button class="btn btn-secondary reset-settings-btn">
                            🔄 重置
                        </button>
                    </div>
                </div>
            `;

            // 绑定重置按钮事件
            const resetBtn = container.querySelector('.reset-settings-btn');
            resetBtn?.addEventListener('click', () => this.loadSettings(container));

        } catch (error) {
            this.logError('加载系统设置失败', error);
            container.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载系统设置。</p>
                </div>
            `;
        }
    }

    /**
     * 处理快速操作
     */
    async handleQuickAction(action) {
        switch (action) {
            case 'refresh-stats':
                await this.refreshAllStats();
                break;
            case 'clear-cache':
                await this.clearSystemCache();
                break;
            case 'backup-data':
                await this.createSystemBackup();
                break;
            case 'view-logs':
                this.viewSystemLogs();
                break;
            default:
                this.logInfo('未知快速操作', { action });
        }
    }

    /**
     * 渲染用户表格
     */
    renderUsersTable(users) {
        if (!users || users.length === 0) {
            return '<tr><td colspan="8" style="text-align: center;">暂无用户数据</td></tr>';
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = users.slice(start, end);

        return pageData.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.nickname || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>
                    <span class="status-badge ${user.role === AppConfig.USER_ROLES.ADMIN ? 'admin' : 'user'}">
                        ${user.role === AppConfig.USER_ROLES.ADMIN ? '👑 管理员' : '👤 普通用户'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.status === 'active' ? 'active' : 'inactive'}">
                        ${user.status === 'active' ? '✓ 活跃' : '✗ 禁用'}
                    </span>
                </td>
                <td>${this.formatDateTime(user.createTime)}</td>
                <td>${this.formatDateTime(user.lastLoginTime) || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="查看详情">👁️</button>
                        <button class="action-btn edit edit-user-btn" data-user-id="${user.id}" title="编辑">✏️</button>
                        ${user.username !== 'admin' ? `
                            <button class="action-btn delete delete-user-btn" data-user-id="${user.id}" title="删除">🗑️</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染API密钥表格
     */
    renderApiKeysTable(apiKeys) {
        if (!apiKeys || apiKeys.length === 0) {
            return '<tr><td colspan="8" style="text-align: center;">暂无API密钥数据</td></tr>';
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = apiKeys.slice(start, end);

        return pageData.map(apiKey => `
            <tr>
                <td>${apiKey.name}</td>
                <td>${apiKey.description || '-'}</td>
                <td>${this.maskApiKey(apiKey.key)}</td>
                <td>${apiKey.permissions?.join(', ') || '-'}</td>
                <td>
                    <span class="status-badge ${apiKey.status === 'active' ? 'active' : 'inactive'}">
                        ${apiKey.status === 'active' ? '✓ 活跃' : '✗ 禁用'}
                    </span>
                </td>
                <td>${this.formatDateTime(apiKey.createTime)}</td>
                <td>${this.formatDateTime(apiKey.lastUsedTime) || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="查看详情">👁️</button>
                        <button class="action-btn edit edit-apikey-btn" data-key-id="${apiKey.id}" title="编辑">✏️</button>
                        <button class="action-btn delete delete-apikey-btn" data-key-id="${apiKey.id}" title="删除">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染AI模型表格
     */
    renderModelsTable(models) {
        if (!models || models.length === 0) {
            return '<tr><td colspan="7" style="text-align: center;">暂无AI模型数据</td></tr>';
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = models.slice(start, end);

        return pageData.map(model => `
            <tr>
                <td>${model.name}</td>
                <td>${model.provider}</td>
                <td>${model.modelId}</td>
                <td>${model.description || '-'}</td>
                <td>
                    <span class="status-badge ${model.status === 'active' ? 'active' : 'inactive'}">
                        ${model.status === 'active' ? '✓ 活跃' : '✗ 禁用'}
                    </span>
                </td>
                <td>${this.formatDateTime(model.createTime)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="查看详情">👁️</button>
                        <button class="action-btn edit edit-model-btn" data-model-id="${model.id}" title="编辑">✏️</button>
                        <button class="action-btn test test-model-btn" data-model-id="${model.id}" title="测试">🧪</button>
                        <button class="action-btn delete delete-model-btn" data-model-id="${model.id}" title="删除">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染系统日志
     */
    renderSystemLogs(logs) {
        if (!logs || logs.length === 0) {
            return '<p style="text-align: center; color: var(--text-tertiary);">暂无日志记录</p>';
        }

        return logs.map(log => `
            <div class="log-entry" style="
                padding: var(--spacing-3);
                border-left: 3px solid ${this.getLogLevelColor(log.level)};
                margin-bottom: var(--spacing-2);
                background-color: var(--bg-secondary);
                border-radius: var(--radius-md);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-1);">
                    <span style="font-weight: 500; color: var(--text-primary);">${log.message}</span>
                    <span style="font-size: var(--text-xs); color: var(--text-tertiary);">${this.formatDateTime(log.timestamp)}</span>
                </div>
                ${log.details ? `<div style="font-size: var(--text-sm); color: var(--text-secondary);">${log.details}</div>` : ''}
            </div>
        `).join('');
    }

    /**
     * 获取日志级别颜色
     */
    getLogLevelColor(level) {
        switch (level) {
            case 'ERROR': return 'var(--error-color)';
            case 'WARN': return 'var(--warning-color)';
            case 'INFO': return 'var(--info-color)';
            case 'DEBUG': return 'var(--text-tertiary)';
            default: return 'var(--text-secondary)';
        }
    }

    /**
     * 掩码API密钥
     */
    maskApiKey(key) {
        if (!key) return '-';
        return key.substring(0, 8) + '***' + key.substring(key.length - 4);
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
            minute: '2-digit'
        });
    }

    /**
     * 渲染分页
     */
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
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

    // API调用方法（简化版，实际应该调用真实的后端API）
    async fetchOverviewData() {
        // 模拟数据
        return {
            totalUsers: 150,
            activeUsers: 80,
            newUsersToday: 5,
            onlineUsers: 25,
            totalGenerations: 2500,
            todayGenerations: 120,
            successRate: 95,
            avgProcessTime: 3.2,
            systemStatus: '正常',
            cpuUsage: 45,
            memoryUsage: 62,
            diskUsage: 38,
            recentLogs: [
                { level: 'INFO', message: '系统启动完成', timestamp: new Date().toISOString() },
                { level: 'INFO', message: '数据库连接成功', timestamp: new Date(Date.now() - 60000).toISOString() },
                { level: 'WARN', message: 'API调用频率较高', timestamp: new Date(Date.now() - 120000).toISOString() }
            ]
        };
    }

    async fetchUsers() {
        // 模拟数据
        return [
            { id: 1, username: 'admin', nickname: '管理员', email: 'admin@example.com', role: AppConfig.USER_ROLES.ADMIN, status: 'active', createTime: new Date(Date.now() - 86400000 * 365).toISOString(), lastLoginTime: new Date().toISOString() },
            { id: 2, username: 'user1', nickname: '用户一', email: 'user1@example.com', role: AppConfig.USER_ROLES.USER, status: 'active', createTime: new Date(Date.now() - 86400000 * 30).toISOString(), lastLoginTime: new Date(Date.now() - 3600000).toISOString() }
        ];
    }

    async fetchApiKeys() {
        // 模拟数据
        return [
            { id: 1, name: '生产环境密钥', description: '用于生产环境的API调用', key: 'sk-1234567890abcdef', permissions: ['read', 'write'], status: 'active', createTime: new Date(Date.now() - 86400000 * 7).toISOString(), lastUsedTime: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, name: '测试环境密钥', description: '用于测试环境的API调用', key: 'sk-fedcba0987654321', permissions: ['read'], status: 'active', createTime: new Date(Date.now() - 86400000 * 3).toISOString(), lastUsedTime: null }
        ];
    }

    async fetchModels() {
        // 模拟数据
        return [
            { id: 1, name: 'GPT-4', provider: 'OpenAI', modelId: 'gpt-4', description: '最新的GPT-4模型', status: 'active', createTime: new Date(Date.now() - 86400000 * 14).toISOString() },
            { id: 2, name: 'Claude-3', provider: 'Anthropic', modelId: 'claude-3-opus-20240229', description: 'Claude 3 Opus模型', status: 'active', createTime: new Date(Date.now() - 86400000 * 7).toISOString() }
        ];
    }

    async fetchSystemConfig() {
        // 模拟数据
        return {
            systemName: 'AIPrompt2Draw',
            systemDescription: 'AI流程图生成器',
            maxUsers: 1000,
            defaultLanguage: 'zh-CN',
            enableRegistration: true,
            enableEmailVerification: false,
            systemAnnouncement: '欢迎使用AIPrompt2Draw系统！'
        };
    }

    // 操作方法（简化版）
    async refreshAllStats() {
        this.showSuccess('统计数据已刷新');
        await this.loadTabContent(this.activeTab);
    }

    async clearSystemCache() {
        this.showSuccess('系统缓存已清理');
    }

    async createSystemBackup() {
        this.showSuccess('系统备份创建成功');
    }

    viewSystemLogs() {
        this.switchTab('overview');
    }

    async saveSystemSettings() {
        this.showSuccess('系统设置保存成功');
    }

    showAddUserForm() {
        this.showInfo('添加用户功能开发中...');
    }

    showAddApiKeyForm() {
        this.showInfo('添加API密钥功能开发中...');
    }

    showAddModelForm() {
        this.showInfo('添加AI模型功能开发中...');
    }

    editUser(userId) {
        this.showInfo(`编辑用户 ${userId} 功能开发中...`);
    }

    editApiKey(keyId) {
        this.showInfo(`编辑API密钥 ${keyId} 功能开发中...`);
    }

    editModel(modelId) {
        this.showInfo(`编辑AI模型 ${modelId} 功能开发中...`);
    }

    testModel(modelId) {
        this.showInfo(`测试AI模型 ${modelId} 功能开发中...`);
    }

    deleteUser(userId) {
        if (confirm('确定要删除此用户吗？')) {
            this.showSuccess(`用户 ${userId} 已删除`);
            this.loadTabContent('users');
        }
    }

    deleteApiKey(keyId) {
        if (confirm('确定要删除此API密钥吗？')) {
            this.showSuccess(`API密钥 ${keyId} 已删除`);
            this.loadTabContent('apikeys');
        }
    }

    deleteModel(modelId) {
        if (confirm('确定要删除此AI模型吗？')) {
            this.showSuccess(`AI模型 ${modelId} 已删除`);
            this.loadTabContent('models');
        }
    }

    /**
     * 显示成功信息
     */
    showSuccess(message) {
        this.logInfo(message);
        // 这里可以显示成功提示
    }

    /**
     * 显示信息
     */
    showInfo(message) {
        this.logInfo(message);
        // 这里可以显示信息提示
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

// 创建管理后台组件实例
window.adminComponent = new AdminComponent();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminComponent;
}