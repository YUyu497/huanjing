/**
 * 主题切换管理器
 * 实现明暗主题切换功能
 */
class ThemeManager {
    constructor() {
        this.isInitialized = false;
        this.currentTheme = 'light'; // 默认浅色主题
        this.themes = {
            light: {
                name: '浅色主题',
                icon: 'fas fa-sun',
                class: 'theme-light'
            },
            dark: {
                name: '深色主题',
                icon: 'fas fa-moon',
                class: 'theme-dark'
            }
        };
        this.init();
    }

    init() {
        if (this.isInitialized) return;

        console.log('🎨 主题切换管理器初始化');
        this.loadSavedTheme();
        this.createThemeToggle();
        this.applyTheme();
        this.isInitialized = true;
        console.log('✅ 主题切换管理器初始化完成');
    }

    // 加载保存的主题
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('huanjing-theme');
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
                console.log(`🎨 加载保存的主题: ${savedTheme}`);
            }
        } catch (error) {
            console.warn('⚠️ 无法加载保存的主题:', error);
        }
    }

    // 创建主题切换按钮
    createThemeToggle() {
        // 查找导航栏
        const navbar = document.querySelector('.navbar .container');
        if (!navbar) {
            console.warn('⚠️ 未找到导航栏，无法创建主题切换按钮');
            return;
        }

        // 创建主题切换按钮容器
        const themeContainer = document.createElement('div');
        themeContainer.className = 'theme-toggle-container';

        // 创建主题切换按钮
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle-btn';
        themeToggle.id = 'theme-toggle';
        themeToggle.title = this.themes[this.currentTheme].name;
        themeToggle.innerHTML = `<i class="${this.themes[this.currentTheme].icon}"></i>`;

        // 绑定点击事件
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 添加到导航栏
        themeContainer.appendChild(themeToggle);
        navbar.appendChild(themeContainer);

        console.log('🎨 主题切换按钮已创建');
    }

    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // 设置主题
    setTheme(theme) {
        if (!this.themes[theme]) {
            console.warn(`⚠️ 未知主题: ${theme}`);
            return;
        }

        console.log(`🎨 切换到主题: ${theme}`);

        // 移除当前主题类
        document.body.classList.remove(this.themes[this.currentTheme].class);

        // 设置新主题
        this.currentTheme = theme;
        document.body.classList.add(this.themes[theme].class);

        // 更新按钮图标和标题
        this.updateToggleButton();

        // 保存主题选择
        this.saveTheme();

        // 触发主题切换事件
        this.triggerThemeChangeEvent();
    }

    // 更新切换按钮
    updateToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const theme = this.themes[this.currentTheme];
            toggleBtn.innerHTML = `<i class="${theme.icon}"></i>`;
            toggleBtn.title = theme.name;
        }
    }

    // 应用主题
    applyTheme() {
        // 移除所有主题类
        Object.values(this.themes).forEach(theme => {
            document.body.classList.remove(theme.class);
        });

        // 添加当前主题类
        document.body.classList.add(this.themes[this.currentTheme].class);

        console.log(`🎨 应用主题: ${this.currentTheme}`);
    }

    // 保存主题选择
    saveTheme() {
        try {
            localStorage.setItem('huanjing-theme', this.currentTheme);
            console.log(`🎨 主题已保存: ${this.currentTheme}`);
        } catch (error) {
            console.warn('⚠️ 无法保存主题:', error);
        }
    }

    // 触发主题切换事件
    triggerThemeChangeEvent() {
        const event = new CustomEvent('themeChange', {
            detail: {
                theme: this.currentTheme,
                themeData: this.themes[this.currentTheme]
            }
        });
        document.dispatchEvent(event);
    }

    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    }

    // 获取主题数据
    getThemeData(theme = null) {
        const targetTheme = theme || this.currentTheme;
        return this.themes[targetTheme];
    }

    // 检查是否为深色主题
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    // 检查是否为浅色主题
    isLightTheme() {
        return this.currentTheme === 'light';
    }

    // 手动切换主题（供外部调用）
    switchToTheme(theme) {
        this.setTheme(theme);
    }

    // 销毁管理器
    destroy() {
        this.isInitialized = false;
        console.log('🗑️ 主题切换管理器已销毁');
    }
}

// 创建全局实例
window.themeManager = new ThemeManager();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
