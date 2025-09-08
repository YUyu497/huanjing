const express = require('express');
const router = express.Router();

// 模拟联系数据存储
let contactMessages = [];
let feedbackData = [];

// 提交联系表单
router.post('/submit', (req, res) => {
    try {
        const { name, email, subject, message, type = 'general' } = req.body;

        // 验证必填字段
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: '姓名、邮箱和消息内容不能为空'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式不正确'
            });
        }

        const newMessage = {
            id: contactMessages.length + 1,
            name,
            email,
            subject: subject || '无主题',
            message,
            type,
            status: 'pending', // pending, read, replied
            createdAt: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        contactMessages.push(newMessage);

        // 记录到日志
        console.log(`新联系消息: ${name} (${email}) - ${subject}`);

        res.status(201).json({
            success: true,
            message: '消息提交成功，我们会尽快回复您',
            data: {
                id: newMessage.id,
                submittedAt: newMessage.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '提交消息失败',
            error: error.message
        });
    }
});

// 提交反馈
router.post('/feedback', (req, res) => {
    try {
        const {
            name,
            email,
            rating,
            category,
            feedback,
            gameVersion,
            platform
        } = req.body;

        // 验证必填字段
        if (!rating || !feedback) {
            return res.status(400).json({
                success: false,
                message: '评分和反馈内容不能为空'
            });
        }

        // 验证评分范围
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: '评分必须在1-5之间'
            });
        }

        const newFeedback = {
            id: feedbackData.length + 1,
            name: name || '匿名用户',
            email: email || null,
            rating: parseInt(rating),
            category: category || 'general',
            feedback,
            gameVersion: gameVersion || 'unknown',
            platform: platform || 'unknown',
            createdAt: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        feedbackData.push(newFeedback);

        // 记录到日志
        console.log(`新反馈: ${newFeedback.name} - ${rating}星 - ${category}`);

        res.status(201).json({
            success: true,
            message: '感谢您的反馈！',
            data: {
                id: newFeedback.id,
                submittedAt: newFeedback.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '提交反馈失败',
            error: error.message
        });
    }
});

// 获取联系消息列表（管理员功能）
router.get('/messages', (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;

        let filteredMessages = contactMessages;

        // 按状态筛选
        if (status) {
            filteredMessages = filteredMessages.filter(msg => msg.status === status);
        }

        // 按类型筛选
        if (type) {
            filteredMessages = filteredMessages.filter(msg => msg.type === type);
        }

        // 按时间排序（最新的在前）
        filteredMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedMessages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(filteredMessages.length / limit),
                totalItems: filteredMessages.length,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取消息列表失败',
            error: error.message
        });
    }
});

// 获取反馈列表（管理员功能）
router.get('/feedback', (req, res) => {
    try {
        const { page = 1, limit = 20, rating, category } = req.query;

        let filteredFeedback = feedbackData;

        // 按评分筛选
        if (rating) {
            filteredFeedback = filteredFeedback.filter(fb => fb.rating === parseInt(rating));
        }

        // 按分类筛选
        if (category) {
            filteredFeedback = filteredFeedback.filter(fb => fb.category === category);
        }

        // 按时间排序（最新的在前）
        filteredFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

        // 计算统计信息
        const totalRating = feedbackData.reduce((sum, fb) => sum + fb.rating, 0);
        const averageRating = feedbackData.length > 0 ? (totalRating / feedbackData.length).toFixed(1) : 0;

        res.json({
            success: true,
            data: paginatedFeedback,
            stats: {
                totalFeedback: feedbackData.length,
                averageRating: parseFloat(averageRating),
                ratingDistribution: {
                    5: feedbackData.filter(fb => fb.rating === 5).length,
                    4: feedbackData.filter(fb => fb.rating === 4).length,
                    3: feedbackData.filter(fb => fb.rating === 3).length,
                    2: feedbackData.filter(fb => fb.rating === 2).length,
                    1: feedbackData.filter(fb => fb.rating === 1).length
                }
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(filteredFeedback.length / limit),
                totalItems: filteredFeedback.length,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取反馈列表失败',
            error: error.message
        });
    }
});

// 更新消息状态（管理员功能）
router.put('/messages/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const messageIndex = contactMessages.findIndex(msg => msg.id === parseInt(id));

        if (messageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '消息不存在'
            });
        }

        if (!['pending', 'read', 'replied'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }

        contactMessages[messageIndex].status = status;
        contactMessages[messageIndex].updatedAt = new Date().toISOString();

        res.json({
            success: true,
            message: '状态更新成功',
            data: contactMessages[messageIndex]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新状态失败',
            error: error.message
        });
    }
});

// 删除消息（管理员功能）
router.delete('/messages/:id', (req, res) => {
    try {
        const { id } = req.params;
        const messageIndex = contactMessages.findIndex(msg => msg.id === parseInt(id));

        if (messageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '消息不存在'
            });
        }

        const deletedMessage = contactMessages.splice(messageIndex, 1)[0];

        res.json({
            success: true,
            message: '消息删除成功',
            data: deletedMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除消息失败',
            error: error.message
        });
    }
});

module.exports = router;
