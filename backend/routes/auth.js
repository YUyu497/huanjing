const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const path = require('path');

const router = express.Router();

// 邮件发送器配置
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.QQ_EMAIL_USER, // QQ邮箱
            pass: process.env.QQ_EMAIL_PASS  // QQ邮箱授权码
        }
    });
};

// 限流配置
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次尝试
    message: { success: false, message: '请求过于频繁，请稍后再试' }
});

const emailLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 1, // 最多1次发送
    message: { success: false, message: '验证码发送过于频繁，请稍后再试' }
});

// 工具函数：生成6位数验证码
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 工具函数：生成会话令牌
const generateSessionToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

// 工具函数：获取客户端IP
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// 输入验证规则
const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .custom(value => {
            if (!value.endsWith('@qq.com')) {
                throw new Error('目前只支持QQ邮箱注册');
            }
            return true;
        }),
    body('username')
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
        .isLength({ min: 6, max: 100 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大小写字母和数字'),
    body('displayName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .trim()
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('verificationCode').isLength({ min: 6, max: 6 }).isNumeric()
];

// 1. 发送邮箱验证码
router.post('/send-verification', emailLimiter, [
    body('email')
        .isEmail()
        .normalizeEmail()
        .custom(value => {
            if (!value.endsWith('@qq.com')) {
                throw new Error('目前只支持QQ邮箱');
            }
            return true;
        }),
    body('type').isIn(['register', 'login', 'reset_password'])
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { email, type } = req.body;

        // 检查邮箱是否已注册（仅对注册类型检查）
        if (type === 'register') {
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '该邮箱已被注册'
                });
            }
        }

        // 检查邮箱是否存在（对登录和重置密码检查）
        if (type === 'login' || type === 'reset_password') {
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '该邮箱尚未注册'
                });
            }
        }

        // 清理过期的验证码
        await pool.execute(
            'DELETE FROM email_verifications WHERE expires_at < NOW() OR (email = ? AND type = ?)',
            [email, type]
        );

        // 生成验证码
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

        // 保存验证码到数据库
        await pool.execute(
            'INSERT INTO email_verifications (email, verification_code, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, verificationCode, type, expiresAt]
        );

        // 发送邮件
        const transporter = createEmailTransporter();
        const typeNames = {
            'register': '注册',
            'login': '登录',
            'reset_password': '重置密码'
        };

        const mailOptions = {
            from: `"幻境FiveM服务器" <${process.env.QQ_EMAIL_USER}>`,
            to: email,
            subject: `幻境FiveM - ${typeNames[type]}验证码`,
            html: `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>幻境FiveM验证码</title>
                </head>
                <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; min-height: 100vh;">
                    <!-- 背景图片层 -->
                    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: url('cid:email-background') center center no-repeat; background-size: cover; z-index: -1; opacity: 0.3;"></div>
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background: rgba(255, 255, 255, 0.95); border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); margin-top: 40px; margin-bottom: 40px; border: 1px solid rgba(255, 255, 255, 0.3); position: relative; overflow: hidden;">
                        <!-- 装饰性背景元素 -->
                        <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 50%; z-index: 0;"></div>
                        <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%); border-radius: 50%; z-index: 0;"></div>
                        <div style="position: relative; z-index: 1;">
                        
                        <!-- 头部Logo区域 -->
                        <div style="text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%); border-radius: 15px; color: white; border: 1px solid rgba(255, 255, 255, 0.2);">
                            <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.25); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold;">🎮</div>
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);">幻境FiveM服务器</h1>
                            <p style="color: rgba(255, 255, 255, 0.95); margin: 8px 0 0; font-size: 16px; font-weight: 300;">FiveM角色扮演服务器</p>
                        </div>
                        
                        <!-- 主要内容区域 -->
                        <div style="background: rgba(248, 249, 250, 0.95); padding: 40px; border-radius: 15px; text-align: center; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05); border: 1px solid rgba(255, 255, 255, 0.3);">
                            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                ${type === 'register' ? '📝' : type === 'login' ? '🔐' : '🔑'}
                            </div>
                            <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 24px; font-weight: 600;">${typeNames[type]}验证码</h2>
                            <p style="color: #5a6c7d; margin-bottom: 35px; font-size: 16px; line-height: 1.6;">您正在进行${typeNames[type]}操作，请使用以下验证码：</p>
                            
                            <!-- 验证码显示区域 -->
                            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%); color: white; padding: 20px 40px; border-radius: 12px; display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 4px; margin-bottom: 25px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.3);">
                                ${verificationCode}
                            </div>
                            
                            <!-- 提示信息 -->
                            <div style="background: rgba(102, 126, 234, 0.15); padding: 20px; border-radius: 10px; border-left: 4px solid rgba(102, 126, 234, 0.8);">
                                <p style="color: #667eea; font-size: 14px; margin: 0 0 8px; font-weight: 500;">⏰ 验证码有效期为10分钟，请及时使用</p>
                                <p style="color: #667eea; font-size: 14px; margin: 0; font-weight: 500;">🔒 如果这不是您本人的操作，请忽略此邮件</p>
                            </div>
                        </div>
                        
                        <!-- 底部信息 -->
                        <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(102, 126, 234, 0.1);">
                            <p style="color: #95a5a6; font-size: 13px; margin: 0; font-weight: 300;">© 2024 幻境FiveM服务器 保留所有权利</p>
                            <p style="color: #bdc3c7; font-size: 12px; margin: 8px 0 0; font-weight: 300;">此邮件由系统自动发送，请勿回复</p>
                        </div>
                        
                        </div>
                    </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: 'email-background.png',
                    path: path.join(__dirname, '../uploads/images/email-bg.png'),
                    cid: 'email-background'
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: `验证码已发送到 ${email}，请查收邮件`,
            expiresAt: expiresAt.toISOString()
        });

        console.log(`📧 验证码已发送: ${email} - ${type} - ${verificationCode}`);

    } catch (error) {
        console.error('发送验证码失败:', error);
        res.status(500).json({
            success: false,
            message: '发送验证码失败，请稍后重试'
        });
    }
});

// 2. 用户注册
router.post('/register', authLimiter, registerValidation, async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { email, username, password, displayName, verificationCode } = req.body;
        const clientIP = getClientIP(req);
        const userAgent = req.headers['user-agent'];

        // 验证验证码
        const [verifications] = await pool.execute(
            'SELECT * FROM email_verifications WHERE email = ? AND verification_code = ? AND type = "register" AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
            [email, verificationCode]
        );

        if (verifications.length === 0) {
            return res.status(400).json({
                success: false,
                message: '验证码无效或已过期'
            });
        }

        // 检查用户名和邮箱是否已存在
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '邮箱或用户名已被使用'
            });
        }

        // 加密密码
        const passwordHash = await bcrypt.hash(password, 12);

        // 创建用户
        const [result] = await pool.execute(
            'INSERT INTO users (email, username, password_hash, display_name, is_verified) VALUES (?, ?, ?, ?, TRUE)',
            [email, username, passwordHash, displayName || username]
        );

        const userId = result.insertId;

        // 标记验证码为已使用
        await pool.execute(
            'UPDATE email_verifications SET is_used = TRUE WHERE id = ?',
            [verifications[0].id]
        );

        // 记录注册日志
        await pool.execute(
            'INSERT INTO user_login_logs (user_id, email, ip_address, user_agent, login_result) VALUES (?, ?, ?, ?, "success")',
            [userId, email, clientIP, userAgent]
        );

        // 创建会话
        const sessionToken = generateSessionToken();
        const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

        await pool.execute(
            'INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
            [userId, sessionToken, clientIP, userAgent, sessionExpires]
        );

        res.json({
            success: true,
            message: '注册成功',
            user: {
                id: userId,
                email,
                username,
                displayName: displayName || username,
                isVerified: true
            },
            sessionToken,
            expiresAt: sessionExpires.toISOString()
        });

        console.log(`✅ 用户注册成功: ${email} (${username})`);

    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
});

// 3. 用户登录（支持密码和验证码两种方式）
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { type, email, emailOrUsername, password, verificationCode } = req.body;
        const clientIP = getClientIP(req);
        const userAgent = req.headers['user-agent'];

        let user = null;
        let loginEmail = '';

        if (type === 'password') {
            // 密码登录
            if (!emailOrUsername || !password) {
                return res.status(400).json({
                    success: false,
                    message: '请填写邮箱/用户名和密码'
                });
            }

            // 查找用户（支持邮箱或用户名登录）
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = TRUE',
                [emailOrUsername, emailOrUsername]
            );

            if (users.length === 0) {
                await pool.execute(
                    'INSERT INTO user_login_logs (email, ip_address, user_agent, login_result, failure_reason) VALUES (?, ?, ?, "failed", "user_not_found")',
                    [emailOrUsername, clientIP, userAgent]
                );

                return res.status(400).json({
                    success: false,
                    message: '用户不存在或已被禁用'
                });
            }

            user = users[0];
            loginEmail = user.email;

            // 验证密码
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                await pool.execute(
                    'INSERT INTO user_login_logs (user_id, email, ip_address, user_agent, login_result, failure_reason) VALUES (?, ?, ?, ?, "failed", "invalid_password")',
                    [user.id, loginEmail, clientIP, userAgent]
                );

                return res.status(400).json({
                    success: false,
                    message: '密码错误'
                });
            }

        } else if (type === 'verification') {
            // 验证码登录
            if (!email || !verificationCode) {
                return res.status(400).json({
                    success: false,
                    message: '请填写邮箱和验证码'
                });
            }

            // 验证验证码
            const [verifications] = await pool.execute(
                'SELECT * FROM email_verifications WHERE email = ? AND verification_code = ? AND type = "login" AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
                [email, verificationCode]
            );

            if (verifications.length === 0) {
                await pool.execute(
                    'INSERT INTO user_login_logs (email, ip_address, user_agent, login_result, failure_reason) VALUES (?, ?, ?, "failed", "invalid_verification_code")',
                    [email, clientIP, userAgent]
                );

                return res.status(400).json({
                    success: false,
                    message: '验证码无效或已过期'
                });
            }

            // 获取用户信息
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
                [email]
            );

            if (users.length === 0) {
                await pool.execute(
                    'INSERT INTO user_login_logs (email, ip_address, user_agent, login_result, failure_reason) VALUES (?, ?, ?, "failed", "user_not_found")',
                    [email, clientIP, userAgent]
                );

                return res.status(400).json({
                    success: false,
                    message: '用户不存在或已被禁用'
                });
            }

            user = users[0];
            loginEmail = email;

            // 标记验证码为已使用
            await pool.execute(
                'UPDATE email_verifications SET is_used = TRUE WHERE id = ?',
                [verifications[0].id]
            );

        } else {
            return res.status(400).json({
                success: false,
                message: '不支持的登录方式'
            });
        }

        // 更新最后登录时间
        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // 创建会话
        const sessionToken = generateSessionToken();
        const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

        await pool.execute(
            'INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
            [user.id, sessionToken, clientIP, userAgent, sessionExpires]
        );

        // 记录登录成功
        await pool.execute(
            'INSERT INTO user_login_logs (user_id, email, ip_address, user_agent, login_result) VALUES (?, ?, ?, ?, "success")',
            [user.id, loginEmail, clientIP, userAgent]
        );

        // 获取用户权限信息
        const [permissions] = await pool.execute(
            'SELECT permission_name, permission_description FROM user_permissions WHERE role = ? AND is_enabled = TRUE',
            [user.role]
        );

        // 解析用户自定义权限（如果存在）
        let userCustomPermissions = [];
        if (user.permissions) {
            try {
                userCustomPermissions = JSON.parse(user.permissions);
            } catch (error) {
                console.warn('解析用户自定义权限失败:', error);
                userCustomPermissions = [];
            }
        }

        // 更新用户最后活跃时间
        await pool.execute(
            'UPDATE users SET last_activity = NOW() WHERE id = ?',
            [user.id]
        );

        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
                role: user.role,
                isVerified: user.is_verified,
                userLevel: user.user_level || 1,
                status: user.status || 'active',
                userGroup: user.user_group || 'default',
                permissions: permissions.map(p => ({
                    name: p.permission_name,
                    description: p.permission_description
                })),
                customPermissions: userCustomPermissions
            },
            sessionToken,
            expiresAt: sessionExpires.toISOString()
        });

        console.log(`✅ 用户登录成功: ${loginEmail} (${type}方式)`);

    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
});

// 4. 验证会话
router.get('/verify-session', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');

        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                message: '未提供会话令牌'
            });
        }

        // 查询会话信息
        const [sessions] = await pool.execute(`
            SELECT s.*, u.id as user_id, u.email, u.username, u.display_name, u.avatar_url, u.role, u.is_verified, u.is_active, u.user_level, u.status, u.user_group, u.permissions
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > NOW() AND s.is_active = TRUE AND u.is_active = TRUE
        `, [sessionToken]);

        if (sessions.length === 0) {
            return res.status(401).json({
                success: false,
                message: '会话无效或已过期'
            });
        }

        const session = sessions[0];

        // 更新会话活跃时间和用户最后活跃时间
        await pool.execute(
            'UPDATE user_sessions SET updated_at = NOW() WHERE session_token = ?',
            [sessionToken]
        );

        await pool.execute(
            'UPDATE users SET last_activity = NOW() WHERE id = ?',
            [session.user_id]
        );

        // 获取用户权限信息
        const [permissions] = await pool.execute(
            'SELECT permission_name, permission_description FROM user_permissions WHERE role = ? AND is_enabled = TRUE',
            [session.role]
        );

        // 解析用户自定义权限（如果存在）
        let userCustomPermissions = [];
        if (session.permissions) {
            try {
                userCustomPermissions = JSON.parse(session.permissions);
            } catch (error) {
                console.warn('解析用户自定义权限失败:', error);
                userCustomPermissions = [];
            }
        }

        res.json({
            success: true,
            user: {
                id: session.user_id,
                email: session.email,
                username: session.username,
                displayName: session.display_name,
                avatarUrl: session.avatar_url,
                role: session.role,
                isVerified: session.is_verified,
                userLevel: session.user_level || 1,
                status: session.status || 'active',
                userGroup: session.user_group || 'default',
                permissions: permissions.map(p => ({
                    name: p.permission_name,
                    description: p.permission_description
                })),
                customPermissions: userCustomPermissions
            },
            session: {
                expiresAt: session.expires_at
            }
        });

    } catch (error) {
        console.error('验证会话失败:', error);
        res.status(500).json({
            success: false,
            message: '验证会话失败'
        });
    }
});

// 5. 获取用户资料
router.get('/profile', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');

        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                message: '未提供会话令牌'
            });
        }

        // 查询用户信息
        const [sessions] = await pool.execute(`
            SELECT s.*, u.id as user_id, u.email, u.username, u.display_name, u.avatar_url, u.role, u.is_verified, u.is_active, u.user_level, u.status, u.user_group, u.created_at, u.last_login, u.last_activity, u.permissions
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > NOW() AND s.is_active = TRUE AND u.is_active = TRUE
        `, [sessionToken]);

        if (sessions.length === 0) {
            return res.status(401).json({
                success: false,
                message: '会话无效或已过期'
            });
        }

        const session = sessions[0];

        // 获取用户权限信息
        const [permissions] = await pool.execute(
            'SELECT permission_name, permission_description FROM user_permissions WHERE role = ? AND is_enabled = TRUE',
            [session.role]
        );

        // 解析用户自定义权限（如果存在）
        let userCustomPermissions = [];
        if (session.permissions) {
            try {
                userCustomPermissions = JSON.parse(session.permissions);
            } catch (error) {
                console.warn('解析用户自定义权限失败:', error);
                userCustomPermissions = [];
            }
        }

        // 更新用户最后活跃时间
        await pool.execute(
            'UPDATE users SET last_activity = NOW() WHERE id = ?',
            [session.user_id]
        );

        res.json({
            success: true,
            user: {
                id: session.user_id,
                email: session.email,
                username: session.username,
                displayName: session.display_name,
                avatarUrl: session.avatar_url,
                role: session.role,
                isVerified: session.is_verified,
                userLevel: session.user_level || 1,
                status: session.status || 'active',
                userGroup: session.user_group || 'default',
                createdAt: session.created_at,
                lastLogin: session.last_login,
                lastActivity: session.last_activity,
                permissions: permissions.map(p => ({
                    name: p.permission_name,
                    description: p.permission_description
                })),
                customPermissions: userCustomPermissions
            }
        });

    } catch (error) {
        console.error('获取用户资料失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户资料失败'
        });
    }
});

// 6. 用户登出
router.post('/logout', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');

        if (sessionToken) {
            await pool.execute(
                'UPDATE user_sessions SET is_active = FALSE WHERE session_token = ?',
                [sessionToken]
            );
        }

        res.json({
            success: true,
            message: '登出成功'
        });

    } catch (error) {
        console.error('登出失败:', error);
        res.status(500).json({
            success: false,
            message: '登出失败'
        });
    }
});

// 6. 重置密码
router.post('/reset-password', authLimiter, [
    body('email').isEmail().normalizeEmail(),
    body('verificationCode').isLength({ min: 6, max: 6 }).isNumeric(),
    body('newPassword')
        .isLength({ min: 6, max: 100 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大小写字母和数字')
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { email, verificationCode, newPassword } = req.body;
        const clientIP = getClientIP(req);
        const userAgent = req.headers['user-agent'];

        // 验证验证码
        const [verifications] = await pool.execute(
            'SELECT * FROM email_verifications WHERE email = ? AND verification_code = ? AND type = "reset_password" AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
            [email, verificationCode]
        );

        if (verifications.length === 0) {
            return res.status(400).json({
                success: false,
                message: '验证码无效或已过期'
            });
        }

        // 检查用户是否存在
        const [users] = await pool.execute(
            'SELECT id FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        // 加密新密码
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // 更新密码
        await pool.execute(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?',
            [passwordHash, email]
        );

        // 标记验证码为已使用
        await pool.execute(
            'UPDATE email_verifications SET is_used = TRUE WHERE id = ?',
            [verifications[0].id]
        );

        // 记录密码重置日志
        await pool.execute(
            'INSERT INTO user_login_logs (user_id, email, ip_address, user_agent, login_result, failure_reason) VALUES (?, ?, ?, ?, "success", "password_reset")',
            [users[0].id, email, clientIP, userAgent]
        );

        res.json({
            success: true,
            message: '密码重置成功'
        });

        console.log(`✅ 密码重置成功: ${email}`);

    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({
            success: false,
            message: '重置密码失败，请稍后重试'
        });
    }
});

// 7. 获取用户统计信息（管理员）
router.get('/stats', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');

        // 验证管理员权限
        const [adminSessions] = await pool.execute(`
            SELECT u.role
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > NOW() AND s.is_active = TRUE AND u.role = 'admin'
        `, [sessionToken]);

        if (adminSessions.length === 0) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        // 获取用户统计
        const [userStats] = await pool.execute('SELECT * FROM active_users_stats');
        const [loginStats] = await pool.execute('SELECT * FROM user_login_stats LIMIT 7');

        res.json({
            success: true,
            data: {
                userStats: userStats[0] || {},
                loginStats: loginStats || []
            }
        });

    } catch (error) {
        console.error('获取统计信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计信息失败'
        });
    }
});

module.exports = router;
