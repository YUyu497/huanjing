class ResetPasswordPage {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        console.log('✅ 重置密码页面初始化完成');
    }

    bindEvents() {
        // 发送验证码按钮
        const sendCodeBtn = document.getElementById('sendResetCodeBtn');
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', () => this.sendVerificationCode());
        }

        // 重置密码表单提交
        const resetForm = document.getElementById('resetPasswordForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }
    }

    // 发送验证码
    async sendVerificationCode() {
        const email = document.getElementById('email').value.trim();
        const sendBtn = document.getElementById('sendResetCodeBtn');

        // 验证邮箱
        if (!email) {
            this.showNotification('请输入QQ邮箱', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('请输入有效的QQ邮箱地址', 'error');
            return;
        }

        try {
            // 禁用按钮并显示加载状态
            sendBtn.disabled = true;
            sendBtn.textContent = '发送中...';
            sendBtn.classList.add('loading');

            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    type: 'reset_password'
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('验证码已发送到您的邮箱', 'success');
                this.startCountdown(sendBtn);
            } else {
                this.showNotification(data.message || '发送失败，请重试', 'error');
            }
        } catch (error) {
            console.error('发送验证码失败:', error);
            this.showNotification('网络错误，请重试', 'error');
        } finally {
            // 恢复按钮状态
            sendBtn.disabled = false;
            sendBtn.classList.remove('loading');
        }
    }

    // 开始倒计时
    startCountdown(button) {
        let countdown = 60;
        button.disabled = true;

        const timer = setInterval(() => {
            if (countdown > 0) {
                button.textContent = `${countdown}秒后重发`;
                countdown--;
            } else {
                button.textContent = '发送验证码';
                button.disabled = false;
                clearInterval(timer);
            }
        }, 1000);
    }

    // 处理重置密码
    async handleResetPassword(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const verificationCode = document.getElementById('verificationCode').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.querySelector('.auth-submit-btn');

        // 表单验证
        if (!this.validateForm(email, verificationCode, newPassword, confirmPassword)) {
            return;
        }

        try {
            // 显示加载状态
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    verificationCode: verificationCode,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('密码重置成功！正在跳转到登录页面...', 'success');

                // 延迟跳转
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 2000);
            } else {
                this.showNotification(data.message || '重置失败，请重试', 'error');
            }
        } catch (error) {
            console.error('重置密码失败:', error);
            this.showNotification('网络错误，请重试', 'error');
        } finally {
            // 恢复按钮状态
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // 表单验证
    validateForm(email, verificationCode, newPassword, confirmPassword) {
        // 验证邮箱
        if (!email) {
            this.showNotification('请输入QQ邮箱', 'error');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('请输入有效的QQ邮箱地址', 'error');
            return false;
        }

        // 验证验证码
        if (!verificationCode) {
            this.showNotification('请输入验证码', 'error');
            return false;
        }

        if (verificationCode.length !== 6) {
            this.showNotification('验证码必须是6位数字', 'error');
            return false;
        }

        // 验证新密码
        if (!newPassword) {
            this.showNotification('请输入新密码', 'error');
            return false;
        }

        if (newPassword.length < 6) {
            this.showNotification('密码长度至少6位', 'error');
            return false;
        }

        if (!this.isValidPassword(newPassword)) {
            this.showNotification('密码必须包含大小写字母和数字', 'error');
            return false;
        }

        // 验证确认密码
        if (!confirmPassword) {
            this.showNotification('请确认新密码', 'error');
            return false;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('两次输入的密码不一致', 'error');
            return false;
        }

        return true;
    }

    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 验证密码强度
    isValidPassword(password) {
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        return hasLower && hasUpper && hasNumber;
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageElement = notification.querySelector('.notification-message');
        const iconElement = notification.querySelector('.notification-icon');

        // 清除之前的定时器
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }

        // 设置消息内容
        messageElement.textContent = message;

        // 设置图标和样式
        notification.className = `notification ${type}`;
        iconElement.className = 'notification-icon';

        switch (type) {
            case 'success':
                iconElement.classList.add('fas', 'fa-check-circle');
                break;
            case 'error':
                iconElement.classList.add('fas', 'fa-exclamation-circle');
                break;
            case 'warning':
                iconElement.classList.add('fas', 'fa-exclamation-triangle');
                break;
            default:
                iconElement.classList.add('fas', 'fa-info-circle');
        }

        // 显示通知
        notification.classList.add('show');

        // 自动隐藏
        this.notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

// 密码显示切换函数
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ResetPasswordPage();
});
