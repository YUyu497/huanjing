const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { validateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// 数据库连接配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'huanjing',
    charset: 'utf8mb4'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 限流配置
const newsRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100次请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    }
});

// 应用限流
router.use(newsRateLimit);

/**
 * 获取新闻分类列表
 * GET /api/news/categories
 */
router.get('/categories', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [categories] = await connection.execute(`
            SELECT id, name, slug, description, color, icon, sort_order, is_active
            FROM news_categories 
            WHERE is_active = 1 
            ORDER BY sort_order ASC, id ASC
        `);

        connection.release();

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('获取新闻分类失败:', error);
        res.status(500).json({
            success: false,
            message: '获取新闻分类失败'
        });
    }
});

/**
 * 获取新闻标签列表
 * GET /api/news/tags
 */
router.get('/tags', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [tags] = await connection.execute(`
            SELECT id, name, slug, color
            FROM news_tags 
            ORDER BY id ASC
        `);

        connection.release();

        res.json({
            success: true,
            data: tags
        });

    } catch (error) {
        console.error('获取新闻标签失败:', error);
        res.status(500).json({
            success: false,
            message: '获取新闻标签失败'
        });
    }
});

/**
 * 获取新闻文章列表
 * GET /api/news/articles
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10）
 * - category: 分类ID
 * - tag: 标签ID
 * - search: 搜索关键词
 * - sort: 排序方式（latest, popular, featured）
 */
router.get('/articles', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            tag,
            search,
            sort = 'latest'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const connection = await pool.getConnection();

        // 构建查询条件
        let whereConditions = ['na.status = "published"'];
        let joinClause = `
            FROM news_articles na
            LEFT JOIN news_categories nc ON na.category_id = nc.id
            LEFT JOIN users u ON na.author_id = u.id
        `;

        // 分类筛选
        if (category) {
            whereConditions.push('na.category_id = ?');
        }

        // 标签筛选
        if (tag) {
            joinClause += `
                INNER JOIN news_article_tags nat ON na.id = nat.article_id
                INNER JOIN news_tags nt ON nat.tag_id = nt.id
            `;
            whereConditions.push('nt.id = ?');
        }

        // 搜索筛选
        if (search) {
            whereConditions.push('(na.title LIKE ? OR na.summary LIKE ?)');
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // 排序
        let orderClause = '';
        switch (sort) {
            case 'popular':
                orderClause = 'ORDER BY na.view_count DESC, na.publish_at DESC';
                break;
            case 'featured':
                orderClause = 'ORDER BY na.is_featured DESC, na.publish_at DESC';
                break;
            case 'latest':
            default:
                orderClause = 'ORDER BY na.publish_at DESC';
                break;
        }

        // 构建查询参数
        const queryParams = [];
        if (category) queryParams.push(category);
        if (tag) queryParams.push(tag);
        if (search) {
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        // 获取总数
        const [countResult] = await connection.execute(`
            SELECT COUNT(DISTINCT na.id) as total
            ${joinClause}
            ${whereClause}
        `, queryParams);

        const total = countResult[0].total;

        // 获取文章列表
        const [articles] = await connection.execute(`
            SELECT 
                na.id,
                na.title,
                na.slug,
                na.summary,
                na.featured_image,
                na.is_featured,
                na.is_hot,
                na.view_count,
                na.like_count,
                na.comment_count,
                na.publish_at,
                nc.name as category_name,
                nc.slug as category_slug,
                nc.color as category_color,
                nc.icon as category_icon,
                u.username as author_name,
                u.display_name as author_display_name
            ${joinClause}
            ${whereClause}
            ${orderClause}
            LIMIT ? OFFSET ?
        `, [...queryParams, limitNum, offset]);

        // 为每篇文章获取标签
        for (let article of articles) {
            const [tags] = await connection.execute(`
                SELECT nt.id, nt.name, nt.slug, nt.color
                FROM news_article_tags nat
                INNER JOIN news_tags nt ON nat.tag_id = nt.id
                WHERE nat.article_id = ?
            `, [article.id]);
            article.tags = tags;
        }

        connection.release();

        res.json({
            success: true,
            data: {
                articles,
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error('获取新闻文章列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取新闻文章列表失败'
        });
    }
});

/**
 * 获取新闻文章详情
 * GET /api/news/articles/:slug
 */
router.get('/articles/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const userIp = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        const connection = await pool.getConnection();

        // 获取文章详情
        const [articles] = await connection.execute(`
            SELECT 
                na.*,
                nc.name as category_name,
                nc.slug as category_slug,
                nc.color as category_color,
                nc.icon as category_icon,
                u.username as author_name,
                u.display_name as author_display_name
            FROM news_articles na
            LEFT JOIN news_categories nc ON na.category_id = nc.id
            LEFT JOIN users u ON na.author_id = u.id
            WHERE na.slug = ? AND na.status = 'published'
        `, [slug]);

        if (articles.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '文章不存在'
            });
        }

        const article = articles[0];

        // 获取文章标签
        const [tags] = await connection.execute(`
            SELECT nt.id, nt.name, nt.slug, nt.color
            FROM news_article_tags nat
            INNER JOIN news_tags nt ON nat.tag_id = nt.id
            WHERE nat.article_id = ?
        `, [article.id]);
        article.tags = tags;

        // 获取相关文章（同分类）
        const [relatedArticles] = await connection.execute(`
            SELECT id, title, slug, summary, featured_image, publish_at, view_count
            FROM news_articles
            WHERE category_id = ? AND id != ? AND status = 'published'
            ORDER BY publish_at DESC
            LIMIT 3
        `, [article.category_id, article.id]);
        article.related_articles = relatedArticles;

        // 增加浏览次数
        await connection.execute(`
            UPDATE news_articles 
            SET view_count = view_count + 1 
            WHERE id = ?
        `, [article.id]);

        // 记录阅读记录
        await connection.execute(`
            INSERT INTO news_read_records (article_id, ip_address, user_agent)
            VALUES (?, ?, ?)
        `, [article.id, userIp, userAgent]);

        connection.release();

        res.json({
            success: true,
            data: article
        });

    } catch (error) {
        console.error('获取新闻文章详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取新闻文章详情失败'
        });
    }
});

/**
 * 获取热门文章
 * GET /api/news/hot
 */
router.get('/hot', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [articles] = await connection.execute(`
            SELECT 
                na.id,
                na.title,
                na.slug,
                na.summary,
                na.featured_image,
                na.view_count,
                na.publish_at,
                nc.name as category_name,
                nc.color as category_color
            FROM news_articles na
            LEFT JOIN news_categories nc ON na.category_id = nc.id
            WHERE na.status = 'published' AND (na.is_hot = 1 OR na.view_count > 100)
            ORDER BY na.view_count DESC, na.publish_at DESC
            LIMIT 5
        `);

        connection.release();

        res.json({
            success: true,
            data: articles
        });

    } catch (error) {
        console.error('获取热门文章失败:', error);
        res.status(500).json({
            success: false,
            message: '获取热门文章失败'
        });
    }
});

/**
 * 获取置顶文章
 * GET /api/news/featured
 */
router.get('/featured', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [articles] = await connection.execute(`
            SELECT 
                na.id,
                na.title,
                na.slug,
                na.summary,
                na.featured_image,
                na.publish_at,
                nc.name as category_name,
                nc.color as category_color
            FROM news_articles na
            LEFT JOIN news_categories nc ON na.category_id = nc.id
            WHERE na.status = 'published' AND na.is_featured = 1
            ORDER BY na.publish_at DESC
            LIMIT 3
        `);

        connection.release();

        res.json({
            success: true,
            data: articles
        });

    } catch (error) {
        console.error('获取置顶文章失败:', error);
        res.status(500).json({
            success: false,
            message: '获取置顶文章失败'
        });
    }
});

/**
 * 获取新闻统计信息
 * GET /api/news/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        // 获取总文章数
        const [totalArticles] = await connection.execute(`
            SELECT COUNT(*) as total FROM news_articles WHERE status = 'published'
        `);

        // 获取今日新增文章数
        const [todayArticles] = await connection.execute(`
            SELECT COUNT(*) as total FROM news_articles 
            WHERE status = 'published' AND DATE(publish_at) = CURDATE()
        `);

        // 获取总浏览次数
        const [totalViews] = await connection.execute(`
            SELECT SUM(view_count) as total FROM news_articles WHERE status = 'published'
        `);

        // 获取分类统计
        const [categoryStats] = await connection.execute(`
            SELECT 
                nc.name,
                nc.color,
                COUNT(na.id) as article_count
            FROM news_categories nc
            LEFT JOIN news_articles na ON nc.id = na.category_id AND na.status = 'published'
            WHERE nc.is_active = 1
            GROUP BY nc.id
            ORDER BY nc.sort_order ASC
        `);

        connection.release();

        res.json({
            success: true,
            data: {
                total_articles: totalArticles[0].total || 0,
                today_articles: todayArticles[0].total || 0,
                total_views: totalViews[0].total || 0,
                category_stats: categoryStats
            }
        });

    } catch (error) {
        console.error('获取新闻统计信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取新闻统计信息失败'
        });
    }
});

/**
 * 搜索新闻文章
 * GET /api/news/search
 */
router.get('/search', async (req, res) => {
    try {
        const { q: query, page = 1, limit = 10 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '搜索关键词不能为空'
            });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        const searchPattern = `%${query.trim()}%`;

        const connection = await pool.getConnection();

        // 获取搜索结果总数
        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total
            FROM news_articles na
            LEFT JOIN news_categories nc ON na.category_id = nc.id
            WHERE na.status = 'published' 
            AND (na.title LIKE ? OR na.summary LIKE ? OR na.content LIKE ?)
        `, [searchPattern, searchPattern, searchPattern]);

        const total = countResult[0].total;

        // 获取搜索结果
        const [articles] = await connection.execute(`
            SELECT 
                na.id,
                na.title,
                na.slug,
                na.summary,
                na.featured_image,
                na.view_count,
                na.publish_at,
                nc.name as category_name,
                nc.color as category_color
            FROM news_articles na
            LEFT JOIN news_categories nc ON na.category_id = nc.id
            WHERE na.status = 'published' 
            AND (na.title LIKE ? OR na.summary LIKE ? OR na.content LIKE ?)
            ORDER BY 
                CASE 
                    WHEN na.title LIKE ? THEN 1
                    WHEN na.summary LIKE ? THEN 2
                    ELSE 3
                END,
                na.publish_at DESC
            LIMIT ? OFFSET ?
        `, [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limitNum, offset]);

        connection.release();

        res.json({
            success: true,
            data: {
                articles,
                query: query.trim(),
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error('搜索新闻文章失败:', error);
        res.status(500).json({
            success: false,
            message: '搜索新闻文章失败'
        });
    }
});

module.exports = router;
