/**
 * 主界面组件
 * 包含导航栏、侧边栏和主要内容区域
 */

class MainComponent extends BaseComponent {
    constructor() {
        super();
        this.sidebarCollapsed = false;
        this.activeSection = 'flowchart';
        this.isLoading = false;
        this.userMenuOpen = false;
    }

    /**
     * 初始化状态
     */
    initState() {
        this.state = {
            user: window.authManager?.getCurrentUser() || null,
            menuItems: [
                {
                    id: 'flowchart',
                    title: '流程图生成',
                    icon: '🎨',
                    description: '使用AI生成流程图',
                    path: '/flowchart'
                },
                {
                    id: 'history',
                    title: '历史记录',
                    icon: '📋',
                    description: '查看生成历史',
                    path: '/history'
                },
                {
                    id: 'models',
                    title: 'AI模型管理',
                    icon: '🤖',
                    description: '管理AI模型配置',
                    path: '/models',
                    adminOnly: true
                },
                {
                    id: 'apikeys',
                    title: 'API密钥管理',
                    icon: '🔑',
                    description: '管理API密钥',
                    path: '/apikeys',
                    adminOnly: true
                },
                {
                    id: 'settings',
                    title: '系统设置',
                    icon: '⚙️',
                    description: '系统参数配置',
                    path: '/settings',
                    adminOnly: true
                }
            ],
            quickActions: [
                {
                    title: '新建流程图',
                    icon: '➕',
                    action: 'new-flowchart',
                    primary: true
                },
                {
                    title: '导入文件',
                    icon: '📁',
                    action: 'import-file'
                },
                {
                    title: '模板库',
                    icon: '📚',
                    action: 'templates'
                }
            ]
        };
    }

    /**
     * 执行渲染
     */
    async doRender(container) {
        container.innerHTML = this.getMainHTML();

        // 绑定事件
        this.bindEvents();

        // 初始化子组件
        await this.initializeSubComponents();

        // 加载初始内容
        await this.loadInitialContent();
    }

    /**
     * 获取主界面HTML
     */
    getMainHTML() {
        const user = this.state.user;
        const isAdmin = window.authManager?.isAdmin() || false;

        return `
            <div class="app">
                <!-- 顶部导航栏 -->
                <header class="app-header">
                    <div class="header-content">
                        <div class="header-left">
                            <button class="sidebar-toggle" id="sidebarToggle" title="切换侧边栏">
                                <span class="hamburger"></span>
                            </button>
                            <div class="logo">
                                <img src="assets/images/Prompt2Draw-w.png" alt="Logo" class="logo-image">
                                <h1 class="logo-text">${AppConfig.APP_NAME}</h1>
                            </div>
                        </div>

                        <div class="header-center">
                            <div class="search-bar">
                                <input type="text" placeholder="搜索流程图、模板..." id="searchInput">
                                <button class="search-btn" title="搜索">
                                    🔍
                                </button>
                            </div>
                        </div>

                        <div class="header-right">
                            <button class="header-btn" id="themeToggle" title="切换主题">
                                🌙
                            </button>

                            <button class="header-btn" id="notificationBtn" title="通知">
                                🔔
                                <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                            </button>

                            <div class="user-menu" id="userMenu">
                                <button class="user-avatar" id="userAvatar" title="用户菜单">
                                    <div class="avatar-circle">
                                        ${user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <span class="user-name">${user?.nickname || user?.username || '用户'}</span>
                                    ${isAdmin ? '<span class="admin-badge">管理员</span>' : ''}
                                    <span class="dropdown-arrow">▼</span>
                                </button>

                                <div class="user-dropdown" id="userDropdown">
                                    <div class="dropdown-header">
                                        <div class="user-info">
                                            <div class="user-avatar-large">
                                                ${user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div class="user-details">
                                                <div class="user-name-large">${user?.nickname || user?.username || '用户'}</div>
                                                <div class="user-role">${user?.role === AppConfig.USER_ROLES.ADMIN ? '系统管理员' : '普通用户'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="dropdown-divider"></div>

                                    <a href="#${AppConfig.ROUTES.PROFILE}" class="dropdown-item">
                                        👤 个人中心
                                    </a>

                                    ${isAdmin ? `
                                        <a href="#${AppConfig.ROUTES.ADMIN}" class="dropdown-item">
                                            🛠️ 管理后台
                                        </a>
                                    ` : ''}

                                    <div class="dropdown-divider"></div>

                                    <button class="dropdown-item" id="helpBtn">
                                        ❓ 帮助中心
                                    </button>

                                    <button class="dropdown-item" id="settingsBtn">
                                        ⚙️ 设置
                                    </button>

                                    <div class="dropdown-divider"></div>

                                    <button class="dropdown-item logout-item" id="logoutBtn">
                                        🚪 退出登录
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- 主体内容 -->
                <div class="app-main">
                    <!-- 侧边栏 -->
                    <aside class="app-sidebar" id="appSidebar">
                        <div class="sidebar-content">
                            <nav class="sidebar-nav">
                                <ul class="nav-list" id="navList">
                                    ${this.state.menuItems.map(item => {
                                        if (item.adminOnly && !isAdmin) return '';
                                        return `
                                            <li class="nav-item">
                                                <a href="#${item.path}" class="nav-link ${item.id === this.activeSection ? 'active' : ''}"
                                                   data-section="${item.id}" title="${item.description}">
                                                    <span class="nav-icon">${item.icon}</span>
                                                    <span class="nav-text">${item.title}</span>
                                                    ${item.adminOnly ? '<span class="nav-badge">管理员</span>' : ''}
                                                </a>
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            </nav>

                            <div class="sidebar-footer">
                                <div class="quick-actions">
                                    <h3 class="quick-actions-title">快速操作</h3>
                                    <div class="quick-actions-list">
                                        ${this.state.quickActions.map(action => `
                                            <button class="quick-action-btn ${action.primary ? 'primary' : ''}"
                                                    data-action="${action.action}"
                                                    title="${action.title}">
                                                <span class="action-icon">${action.icon}</span>
                                                <span class="action-text">${action.title}</span>
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <!-- 主要内容区域 -->
                    <main class="app-content">
                        <div class="content-wrapper">
                            <!-- 面包屑导航 -->
                            <div class="breadcrumb" id="breadcrumb">
                                <div class="breadcrumb-list">
                                    <a href="#${AppConfig.ROUTES.MAIN}" class="breadcrumb-item">首页</a>
                                    <span class="breadcrumb-separator">/</span>
                                    <span class="breadcrumb-item current" id="breadcrumbCurrent">流程图生成</span>
                                </div>
                            </div>

                            <!-- 页面标题 -->
                            <div class="page-header">
                                <div class="page-title-section">
                                    <h1 class="page-title" id="pageTitle">流程图生成</h1>
                                    <p class="page-description" id="pageDescription">使用AI技术快速生成专业的流程图</p>
                                </div>

                                <div class="page-actions">
                                    <button class="btn btn-secondary" id="helpPageBtn">
                                        ❓ 帮助
                                    </button>
                                </div>
                            </div>

                            <!-- 动态内容区域 -->
                            <div class="page-content" id="pageContent">
                                <div class="loading-placeholder">
                                    <div class="loading-spinner"></div>
                                    <p>正在加载...</p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <style>
                ${this.getMainCSS()}
            </style>
        `;
    }

    /**
     * 获取主界面CSS
     */
    getMainCSS() {
        return `
            .app {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
            }

            /* 顶部导航栏 */
            .app-header {
                background-color: var(--bg-primary);
                border-bottom: 1px solid var(--border-primary);
                position: sticky;
                top: 0;
                z-index: var(--z-sticky);
                backdrop-filter: blur(8px);
                background-color: rgba(255, 255, 255, 0.95);
            }

            [data-theme="dark"] .app-header {
                background-color: rgba(31, 41, 55, 0.95);
            }

            .header-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 var(--spacing-6);
                height: 64px;
                max-width: 100%;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: var(--spacing-4);
            }

            .header-center {
                flex: 1;
                max-width: 600px;
                margin: 0 var(--spacing-8);
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: var(--spacing-3);
            }

            .sidebar-toggle {
                width: 40px;
                height: 40px;
                border: none;
                background: none;
                border-radius: var(--radius-lg);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color var(--transition-fast);
            }

            .sidebar-toggle:hover {
                background-color: var(--bg-tertiary);
            }

            .hamburger {
                display: block;
                width: 20px;
                height: 2px;
                background-color: var(--text-primary);
                position: relative;
                transition: all var(--transition-fast);
            }

            .hamburger::before,
            .hamburger::after {
                content: '';
                position: absolute;
                width: 20px;
                height: 2px;
                background-color: var(--text-primary);
                transition: all var(--transition-fast);
            }

            .hamburger::before {
                top: -6px;
            }

            .hamburger::after {
                top: 6px;
            }

            .logo {
                display: flex;
                align-items: center;
                gap: var(--spacing-3);
            }

            .logo-image {
                height: 32px;
                width: 32px;
                border-radius: var(--radius-md);
            }

            .logo-text {
                font-size: var(--text-xl);
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
            }

            .search-bar {
                position: relative;
                display: flex;
                align-items: center;
            }

            .search-bar input {
                width: 100%;
                padding: var(--spacing-3) var(--spacing-4);
                padding-right: 48px;
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-full);
                background-color: var(--bg-secondary);
                font-size: var(--text-sm);
                transition: all var(--transition-fast);
            }

            .search-bar input:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                background-color: var(--bg-primary);
            }

            .search-btn {
                position: absolute;
                right: 4px;
                top: 50%;
                transform: translateY(-50%);
                width: 36px;
                height: 36px;
                border: none;
                background: none;
                border-radius: var(--radius-full);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color var(--transition-fast);
            }

            .search-btn:hover {
                background-color: var(--bg-tertiary);
            }

            .header-btn {
                width: 40px;
                height: 40px;
                border: none;
                background: none;
                border-radius: var(--radius-lg);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--text-lg);
                transition: background-color var(--transition-fast);
                position: relative;
            }

            .header-btn:hover {
                background-color: var(--bg-tertiary);
            }

            .notification-badge {
                position: absolute;
                top: 6px;
                right: 6px;
                background-color: var(--error-color);
                color: white;
                font-size: 10px;
                font-weight: 600;
                padding: 2px 4px;
                border-radius: var(--radius-full);
                min-width: 16px;
                text-align: center;
            }

            /* 用户菜单 */
            .user-menu {
                position: relative;
            }

            .user-avatar {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                padding: var(--spacing-2) var(--spacing-3);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-lg);
                background-color: var(--bg-primary);
                cursor: pointer;
                transition: all var(--transition-fast);
            }

            .user-avatar:hover {
                background-color: var(--bg-tertiary);
                border-color: var(--border-secondary);
            }

            .avatar-circle {
                width: 32px;
                height: 32px;
                border-radius: var(--radius-full);
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: var(--text-sm);
            }

            .user-name {
                font-size: var(--text-sm);
                font-weight: 500;
                color: var(--text-primary);
            }

            .admin-badge {
                background-color: var(--warning-color);
                color: white;
                font-size: 10px;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: var(--radius-full);
            }

            .dropdown-arrow {
                font-size: 10px;
                color: var(--text-tertiary);
                transition: transform var(--transition-fast);
            }

            .user-menu.open .dropdown-arrow {
                transform: rotate(180deg);
            }

            .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: var(--spacing-2);
                min-width: 280px;
                background-color: var(--bg-primary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-lg);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-8px);
                transition: all var(--transition-fast);
                z-index: var(--z-dropdown);
            }

            .user-menu.open .user-dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .dropdown-header {
                padding: var(--spacing-4);
                border-bottom: 1px solid var(--border-primary);
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: var(--spacing-3);
            }

            .user-avatar-large {
                width: 48px;
                height: 48px;
                border-radius: var(--radius-full);
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: var(--text-lg);
            }

            .user-details {
                flex: 1;
            }

            .user-name-large {
                font-size: var(--text-base);
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: var(--spacing-1);
            }

            .user-role {
                font-size: var(--text-sm);
                color: var(--text-tertiary);
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-3);
                width: 100%;
                padding: var(--spacing-3) var(--spacing-4);
                border: none;
                background: none;
                text-align: left;
                color: var(--text-primary);
                font-size: var(--text-sm);
                cursor: pointer;
                transition: background-color var(--transition-fast);
                text-decoration: none;
            }

            .dropdown-item:hover {
                background-color: var(--bg-tertiary);
            }

            .logout-item {
                color: var(--error-color);
            }

            .logout-item:hover {
                background-color: rgba(239, 68, 68, 0.1);
            }

            .dropdown-divider {
                height: 1px;
                background-color: var(--border-primary);
                margin: var(--spacing-1) 0;
            }

            /* 主体布局 */
            .app-main {
                flex: 1;
                display: flex;
                min-height: 0;
            }

            /* 侧边栏 */
            .app-sidebar {
                width: 260px;
                background-color: var(--bg-primary);
                border-right: 1px solid var(--border-primary);
                transition: width var(--transition-normal), transform var(--transition-normal);
                flex-shrink: 0;
            }

            .app-sidebar.collapsed {
                width: 0;
                overflow: hidden;
            }

            .sidebar-content {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .sidebar-nav {
                flex: 1;
                padding: var(--spacing-4);
                overflow-y: auto;
            }

            .nav-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .nav-item {
                margin-bottom: var(--spacing-1);
            }

            .nav-link {
                display: flex;
                align-items: center;
                gap: var(--spacing-3);
                padding: var(--spacing-3) var(--spacing-4);
                border-radius: var(--radius-lg);
                color: var(--text-secondary);
                text-decoration: none;
                font-size: var(--text-sm);
                font-weight: 500;
                transition: all var(--transition-fast);
                position: relative;
            }

            .nav-link:hover {
                background-color: var(--bg-tertiary);
                color: var(--text-primary);
            }

            .nav-link.active {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                font-weight: 600;
            }

            .nav-icon {
                font-size: var(--text-lg);
                flex-shrink: 0;
            }

            .nav-text {
                flex: 1;
            }

            .nav-badge {
                background-color: var(--warning-color);
                color: white;
                font-size: 10px;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: var(--radius-full);
            }

            .sidebar-footer {
                padding: var(--spacing-4);
                border-top: 1px solid var(--border-primary);
            }

            .quick-actions-title {
                font-size: var(--text-xs);
                font-weight: 600;
                color: var(--text-tertiary);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: var(--spacing-3);
            }

            .quick-actions-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2);
            }

            .quick-action-btn {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                padding: var(--spacing-2) var(--spacing-3);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-md);
                background-color: var(--bg-primary);
                color: var(--text-secondary);
                font-size: var(--text-xs);
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-fast);
            }

            .quick-action-btn:hover {
                background-color: var(--bg-tertiary);
                border-color: var(--border-secondary);
                color: var(--text-primary);
            }

            .quick-action-btn.primary {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                border-color: var(--primary-color);
                color: white;
            }

            .quick-action-btn.primary:hover {
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }

            /* 主内容区域 */
            .app-content {
                flex: 1;
                min-width: 0;
                background-color: var(--bg-secondary);
            }

            .content-wrapper {
                max-width: 1200px;
                margin: 0 auto;
                padding: var(--spacing-6);
            }

            /* 面包屑导航 */
            .breadcrumb {
                margin-bottom: var(--spacing-4);
            }

            .breadcrumb-list {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                font-size: var(--text-sm);
            }

            .breadcrumb-item {
                color: var(--text-tertiary);
                text-decoration: none;
                transition: color var(--transition-fast);
            }

            .breadcrumb-item:hover {
                color: var(--primary-color);
            }

            .breadcrumb-item.current {
                color: var(--text-primary);
                font-weight: 500;
            }

            .breadcrumb-separator {
                color: var(--text-quaternary);
            }

            /* 页面标题 */
            .page-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: var(--spacing-6);
                padding-bottom: var(--spacing-4);
                border-bottom: 1px solid var(--border-primary);
            }

            .page-title-section {
                flex: 1;
            }

            .page-title {
                font-size: var(--text-3xl);
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: var(--spacing-2);
            }

            .page-description {
                font-size: var(--text-base);
                color: var(--text-secondary);
                margin: 0;
            }

            .page-actions {
                display: flex;
                align-items: center;
                gap: var(--spacing-3);
            }

            /* 页面内容 */
            .page-content {
                min-height: 400px;
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

            /* 响应式设计 */
            @media (max-width: 1024px) {
                .header-center {
                    display: none;
                }

                .app-sidebar {
                    position: fixed;
                    left: 0;
                    top: 64px;
                    height: calc(100vh - 64px);
                    z-index: var(--z-fixed);
                    transform: translateX(-100%);
                }

                .app-sidebar:not(.collapsed) {
                    transform: translateX(0);
                    box-shadow: var(--shadow-xl);
                }

                .content-wrapper {
                    padding: var(--spacing-4);
                }
            }

            @media (max-width: 640px) {
                .header-content {
                    padding: 0 var(--spacing-4);
                }

                .user-name {
                    display: none;
                }

                .page-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: var(--spacing-3);
                }

                .page-title {
                    font-size: var(--text-2xl);
                }
            }

            /* 侧边栏收起状态 */
            .app-sidebar.collapsed .quick-actions,
            .app-sidebar.collapsed .sidebar-footer {
                display: none;
            }
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 侧边栏切换
        const sidebarToggle = this.container.querySelector('#sidebarToggle');
        sidebarToggle?.addEventListener('click', () => this.toggleSidebar());

        // 用户菜单
        const userAvatar = this.container.querySelector('#userAvatar');
        userAvatar?.addEventListener('click', () => this.toggleUserMenu());

        // 点击外部关闭用户菜单
        document.addEventListener('click', (e) => {
            const userMenu = this.container.querySelector('#userMenu');
            if (userMenu && !userMenu.contains(e.target)) {
                this.closeUserMenu();
            }
        });

        // 导航菜单
        const navLinks = this.container.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // 快速操作
        const quickActionBtns = this.container.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // 主题切换
        const themeToggle = this.container.querySelector('#themeToggle');
        themeToggle?.addEventListener('click', () => {
            window.app?.toggleTheme();
            this.updateThemeIcon();
        });

        // 搜索功能
        const searchInput = this.container.querySelector('#searchInput');
        searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // 退出登录
        const logoutBtn = this.container.querySelector('#logoutBtn');
        logoutBtn?.addEventListener('click', () => this.handleLogout());

        // 帮助按钮
        const helpBtn = this.container.querySelector('#helpBtn');
        helpBtn?.addEventListener('click', () => this.showHelp());

        // 设置按钮
        const settingsBtn = this.container.querySelector('#settingsBtn');
        settingsBtn?.addEventListener('click', () => this.showSettings());
    }

    /**
     * 初始化子组件
     */
    async initializeSubComponents() {
        // 根据当前活动区域加载对应的子组件
        if (this.activeSection) {
            await this.loadSectionComponent(this.activeSection);
        }
    }

    /**
     * 加载初始内容
     */
    async loadInitialContent() {
        try {
            this.showLoading();

            // 获取URL中的路由参数
            const hash = window.location.hash.substring(1);
            if (hash) {
                const section = this.extractSectionFromPath(hash);
                if (section) {
                    this.activeSection = section;
                }
            }

            // 加载对应的内容
            await this.loadSectionContent(this.activeSection);

            this.hideLoading();
        } catch (error) {
            this.logError('加载初始内容失败', error);
            this.showError('加载失败，请刷新页面重试');
        }
    }

    /**
     * 切换侧边栏
     */
    toggleSidebar() {
        const sidebar = this.container.querySelector('#appSidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            this.sidebarCollapsed = sidebar.classList.contains('collapsed');
        }
    }

    /**
     * 切换用户菜单
     */
    toggleUserMenu() {
        const userMenu = this.container.querySelector('#userMenu');
        if (userMenu) {
            userMenu.classList.toggle('open');
            this.userMenuOpen = userMenu.classList.contains('open');
        }
    }

    /**
     * 关闭用户菜单
     */
    closeUserMenu() {
        const userMenu = this.container.querySelector('#userMenu');
        if (userMenu) {
            userMenu.classList.remove('open');
            this.userMenuOpen = false;
        }
    }

    /**
     * 导航到指定区域
     */
    async navigateToSection(sectionId) {
        if (sectionId === this.activeSection) return;

        try {
            this.showLoading();

            // 更新导航状态
            this.updateNavigation(sectionId);

            // 更新面包屑
            this.updateBreadcrumb(sectionId);

            // 加载内容
            await this.loadSectionContent(sectionId);

            this.activeSection = sectionId;
            this.hideLoading();

        } catch (error) {
            this.logError('导航失败', error);
            this.showError('页面加载失败');
        }
    }

    /**
     * 更新导航状态
     */
    updateNavigation(sectionId) {
        const navLinks = this.container.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * 更新面包屑
     */
    updateBreadcrumb(sectionId) {
        const menuItem = this.state.menuItems.find(item => item.id === sectionId);
        if (menuItem) {
            const currentElement = this.container.querySelector('#breadcrumbCurrent');
            const titleElement = this.container.querySelector('#pageTitle');
            const descElement = this.container.querySelector('#pageDescription');

            if (currentElement) currentElement.textContent = menuItem.title;
            if (titleElement) titleElement.textContent = menuItem.title;
            if (descElement) descElement.textContent = menuItem.description;
        }
    }

    /**
     * 加载区域内容
     */
    async loadSectionContent(sectionId) {
        const contentElement = this.container.querySelector('#pageContent');
        if (!contentElement) return;

        try {
            await this.loadSectionComponent(sectionId);
        } catch (error) {
            this.logError('加载区域内容失败', error);
            contentElement.innerHTML = `
                <div class="error-content">
                    <h3>加载失败</h3>
                    <p>无法加载 ${sectionId} 的内容，请稍后重试。</p>
                    <button class="btn btn-primary" onclick="location.reload()">刷新页面</button>
                </div>
            `;
        }
    }

    /**
     * 加载区域组件
     */
    async loadSectionComponent(sectionId) {
        // 这里可以根据不同的 sectionId 加载对应的组件
        // 暂时显示占位内容
        const contentElement = this.container.querySelector('#pageContent');
        if (contentElement) {
            const menuItem = this.state.menuItems.find(item => item.id === sectionId);
            contentElement.innerHTML = `
                <div class="section-placeholder">
                    <h2>${menuItem?.title || sectionId}</h2>
                    <p>${menuItem?.description || '功能开发中...'}</p>
                    <div class="placeholder-content">
                        <p>该功能正在开发中，敬请期待。</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 处理快速操作
     */
    handleQuickAction(action) {
        switch (action) {
            case 'new-flowchart':
                this.createNewFlowchart();
                break;
            case 'import-file':
                this.importFile();
                break;
            case 'templates':
                this.showTemplates();
                break;
            default:
                this.logInfo('未知快速操作', { action });
        }
    }

    /**
     * 创建新流程图
     */
    createNewFlowchart() {
        this.navigateToSection('flowchart');
        // 这里可以添加更多创建流程图的逻辑
    }

    /**
     * 导入文件
     */
    importFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.txt,.md';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.logInfo('用户导入文件', { file: file.name });
                // 处理文件导入逻辑
            }
        };
        input.click();
    }

    /**
     * 显示模板库
     */
    showTemplates() {
        this.logInfo('显示模板库');
        // 显示模板库对话框或页面
    }

    /**
     * 处理搜索
     */
    handleSearch(query) {
        if (query.trim()) {
            this.logInfo('用户搜索', { query });
            // 执行搜索逻辑
        }
    }

    /**
     * 处理退出登录
     */
    async handleLogout() {
        try {
            this.showLoading();
            await window.authManager?.logout();
            // 认证管理器会自动处理路由跳转
        } catch (error) {
            this.logError('退出登录失败', error);
            this.showError('退出失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示帮助
     */
    showHelp() {
        this.logInfo('显示帮助中心');
        // 显示帮助内容
    }

    /**
     * 显示设置
     */
    showSettings() {
        this.logInfo('显示设置');
        // 显示设置页面
    }

    /**
     * 更新主题图标
     */
    updateThemeIcon() {
        const themeToggle = this.container.querySelector('#themeToggle');
        if (themeToggle) {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    /**
     * 从路径中提取区域ID
     */
    extractSectionFromPath(path) {
        // 简单的路径解析逻辑
        const pathParts = path.split('/');
        return pathParts[0] || 'flowchart';
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        this.isLoading = true;
        const contentElement = this.container.querySelector('#pageContent');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                    <p>正在加载...</p>
                </div>
            `;
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        this.isLoading = false;
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        const contentElement = this.container.querySelector('#pageContent');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="error-content">
                    <h3>❌ 出错了</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">重试</button>
                </div>
            `;
        }
    }
}

// 创建主界面组件实例
window.mainComponent = new MainComponent();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainComponent;
}