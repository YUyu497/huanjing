const express = require('express');
const router = express.Router();

// 模拟分析数据存储
let pageViews = [];
let userSessions = [];
let downloadAnalytics = [];

// 记录页面访问
router.post('/pageview', (req, res) => {
    try {
        const {
            page,
            referrer,
            userAgent,
            screenResolution,
            language,
            timeOnPage
        } = req.body;

        const pageView = {
            id: pageViews.length + 1,
            page: page || '/',
            referrer: referrer || 'direct',
            userAgent: userAgent || req.get('User-Agent'),
            screenResolution: screenResolution || 'unknown',
            language: language || 'zh-CN',
            timeOnPage: timeOnPage || 0,
            ip: req.ip,
            timestamp: new Date().toISOString(),
            sessionId: req.session?.id || 'anonymous'
        };

        pageViews.push(pageView);

        res.json({
            success: true,
            message: '页面访问记录成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '记录页面访问失败',
            error: error.message
        });
    }
});

// 记录用户会话
router.post('/session', (req, res) => {
    try {
        const {
            sessionId,
            startTime,
            endTime,
            pages,
            deviceType,
            browser,
            os
        } = req.body;

        const session = {
            id: userSessions.length + 1,
            sessionId: sessionId || `session_${Date.now()}`,
            startTime: startTime || new Date().toISOString(),
            endTime: endTime || null,
            pages: pages || [],
            deviceType: deviceType || 'desktop',
            browser: browser || 'unknown',
            os: os || 'unknown',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            createdAt: new Date().toISOString()
        };

        userSessions.push(session);

        res.json({
            success: true,
            message: '会话记录成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '记录会话失败',
            error: error.message
        });
    }
});

// 记录下载分析
router.post('/download', (req, res) => {
    try {
        const {
            platform,
            version,
            downloadType,
            userAgent,
            referrer
        } = req.body;

        const downloadRecord = {
            id: downloadAnalytics.length + 1,
            platform: platform || 'unknown',
            version: version || 'unknown',
            downloadType: downloadType || 'direct',
            userAgent: userAgent || req.get('User-Agent'),
            referrer: referrer || 'direct',
            ip: req.ip,
            timestamp: new Date().toISOString(),
            sessionId: req.session?.id || 'anonymous'
        };

        downloadAnalytics.push(downloadRecord);

        res.json({
            success: true,
            message: '下载记录成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '记录下载失败',
            error: error.message
        });
    }
});

// 获取页面访问统计
router.get('/pageviews', (req, res) => {
    try {
        const {
            page,
            startDate,
            endDate,
            groupBy = 'day'
        } = req.query;

        let filteredViews = pageViews;

        // 按页面筛选
        if (page) {
            filteredViews = filteredViews.filter(view => view.page === page);
        }

        // 按日期筛选
        if (startDate) {
            filteredViews = filteredViews.filter(view =>
                new Date(view.timestamp) >= new Date(startDate)
            );
        }

        if (endDate) {
            filteredViews = filteredViews.filter(view =>
                new Date(view.timestamp) <= new Date(endDate)
            );
        }

        // 按分组统计
        let groupedData = {};

        if (groupBy === 'day') {
            filteredViews.forEach(view => {
                const date = view.timestamp.split('T')[0];
                groupedData[date] = (groupedData[date] || 0) + 1;
            });
        } else if (groupBy === 'page') {
            filteredViews.forEach(view => {
                groupedData[view.page] = (groupedData[view.page] || 0) + 1;
            });
        }

        res.json({
            success: true,
            data: {
                totalViews: filteredViews.length,
                groupedData,
                topPages: getTopPages(filteredViews),
                averageTimeOnPage: getAverageTimeOnPage(filteredViews)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取页面访问统计失败',
            error: error.message
        });
    }
});

// 获取用户会话统计
router.get('/sessions', (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let filteredSessions = userSessions;

        // 按日期筛选
        if (startDate) {
            filteredSessions = filteredSessions.filter(session =>
                new Date(session.startTime) >= new Date(startDate)
            );
        }

        if (endDate) {
            filteredSessions = filteredSessions.filter(session =>
                new Date(session.startTime) <= new Date(endDate)
            );
        }

        // 计算会话统计
        const totalSessions = filteredSessions.length;
        const completedSessions = filteredSessions.filter(session => session.endTime).length;
        const averageSessionDuration = getAverageSessionDuration(filteredSessions);
        const deviceStats = getDeviceStats(filteredSessions);
        const browserStats = getBrowserStats(filteredSessions);

        res.json({
            success: true,
            data: {
                totalSessions,
                completedSessions,
                completionRate: totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(2) : 0,
                averageSessionDuration,
                deviceStats,
                browserStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取会话统计失败',
            error: error.message
        });
    }
});

// 获取下载分析统计
router.get('/downloads', (req, res) => {
    try {
        const { platform, startDate, endDate } = req.query;

        let filteredDownloads = downloadAnalytics;

        // 按平台筛选
        if (platform) {
            filteredDownloads = filteredDownloads.filter(download =>
                download.platform === platform
            );
        }

        // 按日期筛选
        if (startDate) {
            filteredDownloads = filteredDownloads.filter(download =>
                new Date(download.timestamp) >= new Date(startDate)
            );
        }

        if (endDate) {
            filteredDownloads = filteredDownloads.filter(download =>
                new Date(download.timestamp) <= new Date(endDate)
            );
        }

        // 计算下载统计
        const totalDownloads = filteredDownloads.length;
        const platformStats = getPlatformStats(filteredDownloads);
        const downloadTypeStats = getDownloadTypeStats(filteredDownloads);
        const dailyDownloads = getDailyDownloads(filteredDownloads);

        res.json({
            success: true,
            data: {
                totalDownloads,
                platformStats,
                downloadTypeStats,
                dailyDownloads
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取下载统计失败',
            error: error.message
        });
    }
});

// 获取实时统计
router.get('/realtime', (req, res) => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // 最近一小时的访问
        const recentViews = pageViews.filter(view =>
            new Date(view.timestamp) >= oneHourAgo
        );

        // 活跃会话
        const activeSessions = userSessions.filter(session =>
            !session.endTime && new Date(session.startTime) >= oneHourAgo
        );

        // 最近下载
        const recentDownloads = downloadAnalytics.filter(download =>
            new Date(download.timestamp) >= oneHourAgo
        );

        res.json({
            success: true,
            data: {
                currentTime: now.toISOString(),
                activeUsers: activeSessions.length,
                pageViewsLastHour: recentViews.length,
                downloadsLastHour: recentDownloads.length,
                topPagesLastHour: getTopPages(recentViews, 5)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取实时统计失败',
            error: error.message
        });
    }
});

// 辅助函数
function getTopPages(views, limit = 10) {
    const pageCounts = {};
    views.forEach(view => {
        pageCounts[view.page] = (pageCounts[view.page] || 0) + 1;
    });

    return Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([page, count]) => ({ page, count }));
}

function getAverageTimeOnPage(views) {
    const validTimes = views.filter(view => view.timeOnPage > 0);
    if (validTimes.length === 0) return 0;

    const totalTime = validTimes.reduce((sum, view) => sum + view.timeOnPage, 0);
    return Math.round(totalTime / validTimes.length);
}

function getAverageSessionDuration(sessions) {
    const completedSessions = sessions.filter(session => session.endTime);
    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, session) => {
        const duration = new Date(session.endTime) - new Date(session.startTime);
        return sum + duration;
    }, 0);

    return Math.round(totalDuration / completedSessions.length / 1000); // 返回秒数
}

function getDeviceStats(sessions) {
    const deviceCounts = {};
    sessions.forEach(session => {
        deviceCounts[session.deviceType] = (deviceCounts[session.deviceType] || 0) + 1;
    });
    return deviceCounts;
}

function getBrowserStats(sessions) {
    const browserCounts = {};
    sessions.forEach(session => {
        browserCounts[session.browser] = (browserCounts[session.browser] || 0) + 1;
    });
    return browserCounts;
}

function getPlatformStats(downloads) {
    const platformCounts = {};
    downloads.forEach(download => {
        platformCounts[download.platform] = (platformCounts[download.platform] || 0) + 1;
    });
    return platformCounts;
}

function getDownloadTypeStats(downloads) {
    const typeCounts = {};
    downloads.forEach(download => {
        typeCounts[download.downloadType] = (typeCounts[download.downloadType] || 0) + 1;
    });
    return typeCounts;
}

function getDailyDownloads(downloads) {
    const dailyCounts = {};
    downloads.forEach(download => {
        const date = download.timestamp.split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return dailyCounts;
}

module.exports = router;
