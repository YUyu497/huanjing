/**
 * 新闻资讯页面JavaScript
 */

class NewsPage {
    constructor() {
        // 防止重复初始化
        if (window.newsPageInstance) {
            console.log('⚠️ 新闻页面已初始化，跳过重复初始化');
            return;
        }

        this.currentPage = 1;
        this.pageSize = 10;
        this.filters = {
            category: '',
            tag: '',
            sort: 'latest',
            search: ''
        };
        this.categories = [];
        this.tags = [];
        this.newsData = {
            articles: [],
            pagination: {}
        };

        // 标记为已初始化
        window.newsPageInstance = this;

        this.init();
    }

    init() {
        this.bindEvents();
        this.initSmartNavigation();
        this.checkUserAuth();
        console.log('✅ 新闻资讯页面初始化完成');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索按钮
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // 搜索输入框回车
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // 筛选条件变化
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.category = categoryFilter.value;
                this.loadNews();
            });
        }

        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.filters.sort = sortFilter.value;
                this.loadNews();
            });
        }

        const tagFilter = document.getElementById('tagFilter');
        if (tagFilter) {
            tagFilter.addEventListener('change', () => {
                this.filters.tag = tagFilter.value;
                this.loadNews();
            });
        }

        // 模态框关闭
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeArticleModal();
            });
        }

        // 点击模态框遮罩关闭
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                this.closeArticleModal();
            });
        }

        // 登录模态框关闭按钮
        const closeLoginModal = document.getElementById('closeLoginModal');
        if (closeLoginModal) {
            closeLoginModal.addEventListener('click', () => {
                this.closeLoginRequiredModal();
            });
        }

        // 登录模态框遮罩关闭
        const loginModalOverlay = document.querySelector('#loginRequiredModal .modal-overlay');
        if (loginModalOverlay) {
            loginModalOverlay.addEventListener('click', () => {
                this.closeLoginRequiredModal();
            });
        }
    }

    /**
     * 初始化智能导航
     */
    initSmartNavigation() {
        const newsLinks = document.querySelectorAll('a[href*="news.html"], a[href*="news/news.html"]');
        newsLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (window.location.pathname.includes('news.html')) {
                    e.preventDefault();
                    console.log('📍 已在新闻页面，跳过重复导航');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return false;
                }
            });
        });
        console.log('🧭 智能导航已初始化，防止重复页面加载');
    }

    /**
     * 检查用户登录状态
     */
    async checkUserAuth() {
        // 使用认证验证器
        if (!window.authValidator) {
            console.warn('⚠️ 认证验证器未加载');
            return;
        }

        // 创建页面认证保护器
        const pageProtector = window.authValidator.createPageProtector({
            pageName: '新闻资讯',
            onSuccess: () => {
                console.log('✅ 用户认证有效，允许访问新闻资讯');
                this.loadInitialData();
            },
            onFailure: () => {
                console.log('🔒 用户认证无效，显示登录提示');
                this.showLoginRequiredModal();
            },
            showLoginModal: () => {
                this.showLoginRequiredModal();
            }
        });

        // 保护页面
        await pageProtector.protect();
    }

    /**
     * 显示登录提示模态框
     */
    showLoginRequiredModal() {
        const modal = document.getElementById('loginRequiredModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('🔒 显示登录提示模态框');
        }
    }

    /**
     * 关闭登录提示模态框
     */
    closeLoginRequiredModal() {
        const modal = document.getElementById('loginRequiredModal');
        if (modal) {
            modal.style.display = 'none';
            console.log('🔒 关闭登录提示模态框');
        }
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        try {
            // 并行加载数据
            await Promise.all([
                this.loadNewsStats(),
                this.loadCategories(),
                this.loadTags(),
                this.loadFeaturedArticles(),
                this.loadHotArticles(),
                this.loadNews()
            ]);
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    }

    /**
     * 加载新闻统计信息
     */
    async loadNewsStats() {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/news/stats'));
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.updateStatsDisplay(result.data);
                }
            }
        } catch (error) {
            console.error('加载新闻统计失败:', error);
        }
    }

    /**
     * 更新统计显示
     */
    updateStatsDisplay(stats) {
        document.getElementById('totalArticles').textContent = stats.total_articles;
        document.getElementById('totalViews').textContent = stats.total_views.toLocaleString();
        document.getElementById('todayArticles').textContent = stats.today_articles;
        document.getElementById('totalCategories').textContent = stats.category_stats.length;

        // 更新最新发布时间
        if (stats.latest_article && stats.latest_article.publish_at) {
            const latestPublishElement = document.getElementById('latestPublish');
            if (latestPublishElement) {
                latestPublishElement.textContent = this.formatDate(stats.latest_article.publish_at);
            }
        }
    }

    /**
     * 加载新闻分类
     */
    async loadCategories() {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/news/categories'));
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.categories = result.data;
                    this.populateCategoryFilter();
                }
            }
        } catch (error) {
            console.error('加载新闻分类失败:', error);
        }
    }

    /**
     * 填充分类筛选器
     */
    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
    }

    /**
     * 加载新闻标签
     */
    async loadTags() {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/news/tags'));
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.tags = result.data;
                    this.populateTagFilter();
                    this.populatePopularTags();
                }
            }
        } catch (error) {
            console.error('加载新闻标签失败:', error);
        }
    }

    /**
     * 填充标签筛选器
     */
    populateTagFilter() {
        const tagFilter = document.getElementById('tagFilter');
        if (tagFilter) {
            this.tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                tagFilter.appendChild(option);
            });
        }
    }

    /**
     * 填充热门标签
     */
    populatePopularTags() {
        const popularTags = document.getElementById('popularTags');
        if (popularTags) {
            // 显示前8个标签
            const displayTags = this.tags.slice(0, 8);
            popularTags.innerHTML = displayTags.map(tag => `
                <span class="popular-tag" style="border-left: 3px solid ${tag.color}">
                    ${tag.name}
                </span>
            `).join('');

            // 绑定标签点击事件
            const tagElements = popularTags.querySelectorAll('.popular-tag');
            tagElements.forEach((tagElement, index) => {
                tagElement.addEventListener('click', () => {
                    this.filters.tag = displayTags[index].id;
                    document.getElementById('tagFilter').value = displayTags[index].id;
                    this.loadNews();
                });
            });
        }
    }

    /**
     * 加载置顶文章
     */
    async loadFeaturedArticles() {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/news/featured'));
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.length > 0) {
                    this.displayFeaturedArticles(result.data);
                }
            }
        } catch (error) {
            console.error('加载置顶文章失败:', error);
        }
    }

    /**
     * 显示置顶文章
     */
    displayFeaturedArticles(articles) {
        const featuredSection = document.getElementById('featuredSection');
        const featuredGrid = document.getElementById('featuredGrid');

        if (featuredSection && featuredGrid) {
            featuredSection.style.display = 'block';
            featuredGrid.innerHTML = articles.map(article => `
                <div class="featured-article" onclick="newsPage.showArticleModal('${article.slug}')">
                    <div class="featured-image">
                        ${article.featured_image ?
                    `<img src="${article.featured_image}" alt="${article.title}">` :
                    `<i class="fas fa-newspaper"></i>`
                }
                        <span class="featured-badge">置顶</span>
                    </div>
                    <div class="featured-content">
                        <h3 class="featured-title">${article.title}</h3>
                        <p class="featured-summary">${article.summary}</p>
                        <div class="featured-meta">
                            <span><i class="fas fa-tag"></i> ${article.category_name}</span>
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(article.publish_at)}</span>
                            <span><i class="fas fa-clock"></i> ${this.formatSpecificTime(article.publish_at)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 加载热门文章
     */
    async loadHotArticles() {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/news/hot'));
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.displayHotArticles(result.data);
                }
            }
        } catch (error) {
            console.error('加载热门文章失败:', error);
        }
    }

    /**
     * 显示热门文章
     */
    displayHotArticles(articles) {
        const hotArticles = document.getElementById('hotArticles');
        if (hotArticles) {
            hotArticles.innerHTML = articles.map(article => `
                <div class="hot-article" onclick="newsPage.showArticleModal('${article.slug}')">
                    <div class="hot-article-image">
                        ${article.featured_image ?
                    `<img src="${article.featured_image}" alt="${article.title}">` :
                    `<i class="fas fa-newspaper"></i>`
                }
                    </div>
                    <div class="hot-article-content">
                        <h4 class="hot-article-title">${article.title}</h4>
                        <div class="hot-article-meta">
                            <span><i class="fas fa-eye"></i> ${article.view_count}</span>
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(article.publish_at)}</span>
                            <span><i class="fas fa-clock"></i> ${this.formatSpecificTime(article.publish_at)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 加载新闻列表
     */
    async loadNews() {
        try {
            this.showLoadingState();

            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                sort: this.filters.sort
            });

            if (this.filters.category) {
                params.append('category', this.filters.category);
            }
            if (this.filters.tag) {
                params.append('tag', this.filters.tag);
            }

            const response = await fetch(API_CONFIG.buildApiUrl(`/api/news/articles?${params}`));
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.newsData = result.data;
                    this.displayNews();
                    this.renderPagination();
                }
            }
        } catch (error) {
            console.error('加载新闻列表失败:', error);
            this.showErrorState();
        }
    }

    /**
     * 显示新闻列表
     */
    displayNews() {
        const newsGrid = document.getElementById('newsGrid');
        if (!newsGrid) return;

        if (this.newsData.articles.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-news">
                    <i class="fas fa-inbox"></i>
                    <p>暂无相关新闻</p>
                </div>
            `;
            return;
        }

        newsGrid.innerHTML = this.newsData.articles.map(article => `
            <div class="news-article" onclick="newsPage.showArticleModal('${article.slug}')">
                <div class="article-category-badge" style="background: linear-gradient(135deg, ${article.category_color}, ${this.adjustColor(article.category_color, -20)})">
                    ${article.category_name}
                </div>
                <div class="article-header">
                    <div class="article-image">
                        ${article.featured_image ?
                `<img src="${article.featured_image}" alt="${article.title}">` :
                `<i class="fas fa-newspaper"></i>`
            }
                    </div>
                    <div class="article-content">
                        <h3 class="article-title">${article.title}</h3>
                        <p class="article-summary">${article.summary}</p>
                        <div class="article-meta">
                            <div class="article-meta-item">
                                <i class="fas fa-user"></i>
                                <span>${article.author_display_name || article.author_name}</span>
                            </div>
                            <div class="article-meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${this.formatDate(article.publish_at)}</span>
                            </div>
                            <div class="article-meta-item">
                                <i class="fas fa-clock"></i>
                                <span>发布时间: ${this.formatSpecificTime(article.publish_at)}</span>
                            </div>
                            <div class="article-meta-item">
                                <i class="fas fa-eye"></i>
                                <span>${article.view_count}</span>
                            </div>
                        </div>
                        ${article.tags && article.tags.length > 0 ? `
                            <div class="article-tags">
                                ${article.tags.map(tag => `
                                    <span class="article-tag" style="border-left: 3px solid ${tag.color}">
                                        ${tag.name}
                                    </span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染分页
     */
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const { page, pages } = this.newsData.pagination;

        if (pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // 上一页按钮
        paginationHTML += `
            <button ${page === 1 ? 'disabled' : ''} onclick="newsPage.goToPage(${page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // 页码按钮
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
                paginationHTML += `
                    <button class="${i === page ? 'active' : ''}" onclick="newsPage.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === page - 3 || i === page + 3) {
                paginationHTML += '<span>...</span>';
            }
        }

        // 下一页按钮
        paginationHTML += `
            <button ${page === pages ? 'disabled' : ''} onclick="newsPage.goToPage(${page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    /**
     * 跳转到指定页面
     */
    goToPage(page) {
        this.currentPage = page;
        this.loadNews();
        // 滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 执行搜索
     */
    performSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.filters.search = searchInput.value.trim();
            if (this.filters.search) {
                this.searchNews();
            } else {
                this.loadNews();
            }
        }
    }

    /**
     * 搜索新闻
     */
    async searchNews() {
        try {
            this.showLoadingState();

            const params = new URLSearchParams({
                q: this.filters.search,
                page: 1,
                limit: this.pageSize
            });

            const response = await fetch(API_CONFIG.buildApiUrl(`/api/news/search?${params}`));
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.newsData = result.data;
                    this.currentPage = 1;
                    this.displayNews();
                    this.renderPagination();

                    // 显示搜索结果提示
                    this.showSearchResultInfo();
                }
            }
        } catch (error) {
            console.error('搜索新闻失败:', error);
            this.showErrorState();
        }
    }

    /**
     * 显示搜索结果信息
     */
    showSearchResultInfo() {
        const newsGrid = document.getElementById('newsGrid');
        if (newsGrid && this.filters.search) {
            const searchInfo = document.createElement('div');
            searchInfo.className = 'search-info';
            searchInfo.innerHTML = `
                <div class="search-result-header">
                    <i class="fas fa-search"></i>
                    <span>搜索 "${this.filters.search}" 的结果：共 ${this.newsData.pagination.total} 条</span>
                    <button onclick="newsPage.clearSearch()" class="clear-search-btn">
                        <i class="fas fa-times"></i> 清除搜索
                    </button>
                </div>
            `;
            newsGrid.insertBefore(searchInfo, newsGrid.firstChild);
        }
    }

    /**
     * 清除搜索
     */
    clearSearch() {
        this.filters.search = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        this.loadNews();
    }

    /**
     * 显示文章详情模态框
     */
    async showArticleModal(slug) {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl(`/api/news/articles/${slug}`));
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.displayArticleModal(result.data);
                }
            }
        } catch (error) {
            console.error('获取文章详情失败:', error);
        }
    }

    /**
     * 显示文章模态框
     */
    displayArticleModal(article) {
        const modal = document.getElementById('articleModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const modalDate = document.getElementById('modalDate');
        const modalViews = document.getElementById('modalViews');
        const modalTags = document.getElementById('modalTags');
        const modalContent = document.getElementById('modalContent');

        if (modal && modalTitle && modalCategory && modalDate && modalViews && modalTags && modalContent) {
            modalTitle.textContent = article.title;
            modalCategory.textContent = article.category_name;
            modalDate.textContent = `${this.formatDate(article.publish_at)} | 发布时间: ${this.formatSpecificTime(article.publish_at)}`;
            modalViews.textContent = `${article.view_count} 次浏览`;

            // 显示标签
            if (article.tags && article.tags.length > 0) {
                modalTags.innerHTML = article.tags.map(tag => `
                    <span class="article-tag" style="border-left: 3px solid ${tag.color}">
                        ${tag.name}
                    </span>
                `).join('');
            } else {
                modalTags.innerHTML = '';
            }

            // 显示内容
            modalContent.innerHTML = article.content;

            // 显示模态框
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * 关闭文章模态框
     */
    closeArticleModal() {
        const modal = document.getElementById('articleModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * 显示加载状态
     */
    showLoadingState() {
        const newsGrid = document.getElementById('newsGrid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>正在加载新闻...</p>
                </div>
            `;
        }
    }

    /**
     * 显示错误状态
     */
    showErrorState() {
        const newsGrid = document.getElementById('newsGrid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载失败，请稍后重试</p>
                    <button onclick="newsPage.loadNews()" class="retry-btn">
                        <i class="fas fa-redo"></i> 重试
                    </button>
                </div>
            `;
        }
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // 相对时间显示
        let relativeTime = '';
        if (diff < 60000) relativeTime = '刚刚';
        else if (diff < 3600000) relativeTime = `${Math.floor(diff / 60000)}分钟前`;
        else if (diff < 86400000) relativeTime = `${Math.floor(diff / 3600000)}小时前`;
        else if (diff < 2592000000) relativeTime = `${Math.floor(diff / 86400000)}天前`;
        else relativeTime = `${Math.floor(diff / 2592000000)}个月前`;

        // 具体时间显示
        const specificTime = date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `${relativeTime} (${specificTime})`;
    }

    /**
     * 格式化具体时间（只显示具体时间，不显示相对时间）
     */
    formatSpecificTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 调整颜色亮度
     */
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// 创建全局实例
window.newsPage = new NewsPage();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 实例已在上面创建
});
