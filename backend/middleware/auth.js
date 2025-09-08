const jwt = require('jsonwebtoken');

/**
 * 验证访问令牌的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const validateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '访问令牌缺失'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('令牌验证失败:', error.message);
        return res.status(401).json({
            success: false,
            message: '访问令牌无效'
        });
    }
};

/**
 * 可选的令牌验证中间件（不强制要求令牌）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const optionalToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = decoded;
        } catch (error) {
            // 令牌无效时不设置用户信息，但不阻止请求继续
            console.warn('可选令牌验证失败:', error.message);
        }
    }

    next();
};

/**
 * 检查用户权限的中间件
 * @param {Array} requiredRoles - 需要的角色数组
 */
const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要登录'
            });
        }

        if (!requiredRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        next();
    };
};

module.exports = {
    validateToken,
    optionalToken,
    checkRole
};
