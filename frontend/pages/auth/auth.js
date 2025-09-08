// 登录注册页面JavaScript

class AuthPage {
    constructor() {
        this.currentTab = 'login';
        this.countdowns = {}; // 存储倒计时定时器
        this.init();
    }

    init() {
        // 初始化AOS动画
        this.initAOS();

        // 初始化导航
        this.initNavigation();

        // 初始化标签页切换
        this.initTabs();

        // 初始化表单
        this.initForms();

        // 初始化密码显示切换
        this.initPasswordToggle();

        // 初始化验证码发送
        this.initVerificationCode();



        console.log('✅ 认证页面初始化完成');
    }

    // 初始化用户权限系统
    initializeUserPermissions(userData) {
        try {
            // 检查是否已加载用户权限工具
            if (typeof window.userPermissions !== 'undefined') {
                window.userPermissions.setCurrentUser(userData);
                console.log('✅ 用户权限系统初始化完成:', userData.role);
            } else {
                console.warn('⚠️ 用户权限工具未加载，跳过权限初始化');
            }
        } catch (error) {
            console.error('❌ 初始化用户权限系统失败:', error);
        }
    }

    // 初始化AOS动画
    initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                offset: 100
            });
        }
    }

    // 初始化导航
    initNavigation() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
    }

    // 初始化标签页切换
    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const switchLinks = document.querySelectorAll('.switch-tab');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        switchLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // 初始化登录方式切换
        this.initLoginMethodSwitch();
    }

    // 切换标签页
    switchTab(tab) {
        this.currentTab = tab;

        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 更新表单显示
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}Form`).classList.add('active');

        // 清除错误信息
        this.clearAllErrors();
    }

    // 初始化登录方式切换
    initLoginMethodSwitch() {
        const methodBtns = document.querySelectorAll('.method-btn');

        methodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.getAttribute('data-method');
                this.switchLoginMethod(method);
            });
        });
    }

    // 切换登录方式
    switchLoginMethod(method) {
        // 更新按钮状态
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // 更新表单显示
        document.querySelectorAll('.login-method').forEach(methodDiv => {
            methodDiv.classList.remove('active');
        });

        if (method === 'password') {
            document.getElementById('passwordLogin').classList.add('active');
        } else if (method === 'verification') {
            document.getElementById('verificationLogin').classList.add('active');
        }

        // 清除错误信息
        this.clearAllErrors();
    }

    // 初始化表单
    initForms() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 实时验证
        this.initRealTimeValidation();
    }

    // 初始化实时验证
    initRealTimeValidation() {
        // 邮箱验证
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateEmail(input);
            });
        });

        // 用户名验证
        const usernameInput = document.getElementById('registerUsername');
        if (usernameInput) {
            usernameInput.addEventListener('blur', () => {
                this.validateUsername(usernameInput);
            });
        }

        // 密码验证
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('blur', () => {
                this.validatePassword(passwordInput);
            });
        }

        // 确认密码验证
        const confirmPasswordInput = document.getElementById('registerConfirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('blur', () => {
                this.validateConfirmPassword(confirmPasswordInput);
            });
        }

        // 验证码验证
        const verificationCodeInputs = document.querySelectorAll('input[name="verificationCode"]');
        verificationCodeInputs.forEach(input => {
            // 只允许输入数字
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });

            input.addEventListener('blur', () => {
                this.validateVerificationCode(input);
            });
        });
    }

    // 初始化密码显示切换
    initPasswordToggle() {
        const toggleBtns = document.querySelectorAll('.toggle-password');

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = btn.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    // 初始化验证码发送
    initVerificationCode() {
        const sendBtns = document.querySelectorAll('.send-code-btn');

        sendBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const isLogin = btn.id === 'sendLoginCodeBtn';
                this.sendVerificationCode(isLogin);
            });
        });
    }



    // 发送验证码
    async sendVerificationCode(isLogin = true) {
        const type = isLogin ? 'login' : 'register';
        const emailInput = document.getElementById(`${type}Email`);
        const btn = document.getElementById(`send${isLogin ? 'Login' : 'Register'}CodeBtn`);

        // 验证邮箱
        if (!this.validateEmail(emailInput)) {
            return;
        }

        // 如果是注册，还需要验证其他必填字段
        if (!isLogin) {
            const usernameInput = document.getElementById('registerUsername');
            const passwordInput = document.getElementById('registerPassword');

            if (!this.validateUsername(usernameInput) || !this.validatePassword(passwordInput)) {
                this.showNotification('请先完善用户名和密码信息', 'warning');
                return;
            }
        }

        try {
            // 设置按钮加载状态
            this.setButtonLoading(btn, true);

            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    type: isLogin ? 'login' : 'register'
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ 验证码发送成功:', result);
                this.showNotification(result.message, 'success');
                this.startCountdown(btn, 60);
            } else {
                console.log('❌ 验证码发送失败:', result);
                this.showNotification(result.message, 'error');
                this.setError(`${type}EmailError`, result.message);
            }

        } catch (error) {
            console.error('发送验证码失败:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        } finally {
            this.setButtonLoading(btn, false);
        }
    }

    // 处理登录
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const formData = new FormData(form);
        const btn = document.getElementById('loginSubmitBtn');

        // 获取当前登录方式
        const activeMethod = document.querySelector('.method-btn.active').getAttribute('data-method');

        // 清除之前的错误
        this.clearErrors(['loginEmailError', 'loginEmailCodeError', 'loginPasswordError', 'loginCodeError']);

        let loginData = {};

        if (activeMethod === 'password') {
            // 密码登录
            const emailOrUsername = formData.get('email');
            const password = formData.get('password');

            if (!emailOrUsername || !password) {
                this.showNotification('请填写所有必填字段', 'warning');
                return;
            }

            loginData = {
                type: 'password',
                emailOrUsername,
                password
            };

        } else if (activeMethod === 'verification') {
            // 验证码登录
            const email = formData.get('emailCode');
            const verificationCode = formData.get('verificationCode');

            if (!email || !verificationCode) {
                this.showNotification('请填写所有必填字段', 'warning');
                return;
            }

            if (!this.isValidEmail(email)) {
                this.setError('loginEmailCodeError', '请输入有效的QQ邮箱');
                return;
            }

            if (!this.isValidVerificationCode(verificationCode)) {
                this.setError('loginCodeError', '验证码必须是6位数字');
                return;
            }

            loginData = {
                type: 'verification',
                email,
                verificationCode
            };
        }

        try {
            this.setButtonLoading(btn, true);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('登录成功！正在跳转...', 'success');

                // 保存会话信息
                localStorage.setItem('sessionToken', result.sessionToken);
                localStorage.setItem('userInfo', JSON.stringify(result.user));

                // 初始化用户权限系统
                this.initializeUserPermissions(result.user);

                // 跳转到首页
                setTimeout(() => {
                    window.location.href = '../../index.html';
                }, 1500);

            } else {
                console.log('❌ 登录失败，后端响应:', result);
                this.showNotification(result.message, 'error');

                // 根据错误类型设置具体的错误信息
                if (result.message.includes('验证码')) {
                    this.setError('loginCodeError', result.message);
                } else if (result.message.includes('密码')) {
                    this.setError('loginPasswordError', result.message);
                } else if (result.message.includes('邮箱') || result.message.includes('用户名')) {
                    if (activeMethod === 'password') {
                        this.setError('loginEmailError', result.message);
                    } else {
                        this.setError('loginEmailCodeError', result.message);
                    }
                }
            }

        } catch (error) {
            console.error('登录失败:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        } finally {
            this.setButtonLoading(btn, false);
        }
    }

    // 处理注册
    async handleRegister() {
        const form = document.getElementById('registerForm');
        const formData = new FormData(form);
        const btn = document.getElementById('registerSubmitBtn');

        // 清除之前的错误
        this.clearErrors(['registerEmailError', 'registerUsernameError', 'registerPasswordError', 'registerConfirmPasswordError', 'registerCodeError']);

        // 获取表单数据
        const email = formData.get('email');
        const username = formData.get('username');
        const displayName = formData.get('displayName');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const verificationCode = formData.get('verificationCode');
        const agreeTermsCheckbox = document.getElementById('agreeTerms');
        const agreeTerms = agreeTermsCheckbox ? agreeTermsCheckbox.checked : false;

        // 调试信息
        console.log('🔍 表单验证调试信息:');
        console.log('  - 邮箱:', email);
        console.log('  - 用户名:', username);
        console.log('  - 验证码:', verificationCode);
        console.log('  - 验证码格式正确:', this.isValidVerificationCode(verificationCode));
        console.log('  - 用户协议复选框:', agreeTermsCheckbox);
        console.log('  - 用户协议已勾选:', agreeTerms);

        // 验证表单
        let hasError = false;

        if (!email || !this.isValidEmail(email)) {
            this.setError('registerEmailError', '请输入有效的QQ邮箱');
            hasError = true;
        }

        if (!username || !this.isValidUsername(username)) {
            this.setError('registerUsernameError', '用户名只能包含3-20位字母、数字和下划线');
            hasError = true;
        }

        if (!password || !this.isValidPassword(password)) {
            this.setError('registerPasswordError', '密码必须至少6位，包含大小写字母和数字');
            hasError = true;
        }

        if (password !== confirmPassword) {
            this.setError('registerConfirmPasswordError', '两次输入的密码不一致');
            hasError = true;
        }

        if (!verificationCode || !this.isValidVerificationCode(verificationCode)) {
            this.setError('registerCodeError', '验证码必须是6位数字');
            hasError = true;
        }

        if (!agreeTerms) {
            this.showNotification('请阅读并同意用户协议', 'warning');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        try {
            this.setButtonLoading(btn, true);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    username,
                    displayName: displayName || username,
                    password,
                    verificationCode
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('注册成功！正在自动登录...', 'success');

                // 保存会话信息
                localStorage.setItem('sessionToken', result.sessionToken);
                localStorage.setItem('userInfo', JSON.stringify(result.user));

                // 自动登录成功，跳转到首页
                setTimeout(() => {
                    window.location.href = '../../index.html';
                }, 1500);

            } else {
                console.log('❌ 注册失败，后端响应:', result);
                this.showNotification(result.message, 'error');

                // 根据错误类型设置具体的错误信息
                if (result.errors && result.errors.length > 0) {
                    result.errors.forEach(error => {
                        if (error.param === 'email') {
                            this.setError('registerEmailError', error.msg);
                        } else if (error.param === 'username') {
                            this.setError('registerUsernameError', error.msg);
                        } else if (error.param === 'password') {
                            this.setError('registerPasswordError', error.msg);
                        }
                    });
                } else if (result.message.includes('验证码')) {
                    this.setError('registerCodeError', result.message);
                } else if (result.message.includes('邮箱')) {
                    this.setError('registerEmailError', result.message);
                } else if (result.message.includes('用户名')) {
                    this.setError('registerUsernameError', result.message);
                }
            }

        } catch (error) {
            console.error('注册失败:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        } finally {
            this.setButtonLoading(btn, false);
        }
    }

    // 验证方法
    validateEmail(input) {
        const isValid = this.isValidEmail(input.value);
        const errorId = input.id + 'Error';

        if (!isValid) {
            this.setError(errorId, '请输入有效的QQ邮箱（@qq.com结尾）');
            return false;
        } else {
            this.clearError(errorId);
            return true;
        }
    }

    validateUsername(input) {
        const isValid = this.isValidUsername(input.value);
        const errorId = input.id + 'Error';

        if (!isValid) {
            this.setError(errorId, '用户名只能包含3-20位字母、数字和下划线');
            return false;
        } else {
            this.clearError(errorId);
            return true;
        }
    }

    validatePassword(input) {
        const isValid = this.isValidPassword(input.value);
        const errorId = input.id + 'Error';

        if (!isValid) {
            this.setError(errorId, '密码必须至少6位，包含大小写字母和数字');
            return false;
        } else {
            this.clearError(errorId);
            return true;
        }
    }

    validateConfirmPassword(input) {
        const password = document.getElementById('registerPassword').value;
        const isValid = input.value === password;
        const errorId = input.id + 'Error';

        if (!isValid) {
            this.setError(errorId, '两次输入的密码不一致');
            return false;
        } else {
            this.clearError(errorId);
            return true;
        }
    }

    validateVerificationCode(input) {
        const isValid = this.isValidVerificationCode(input.value);
        const errorId = input.id + 'Error';

        if (!isValid) {
            this.setError(errorId, '验证码必须是6位数字');
            return false;
        } else {
            this.clearError(errorId);
            return true;
        }
    }

    // 验证工具方法
    isValidEmail(email) {
        return /^[^\s@]+@qq\.com$/.test(email);
    }

    isValidUsername(username) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    }

    isValidPassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
    }

    isValidVerificationCode(code) {
        return /^\d{6}$/.test(code);
    }

    // UI工具方法
    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    setError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    clearErrors(errorIds) {
        errorIds.forEach(id => this.clearError(id));
    }

    clearAllErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    // 倒计时功能
    startCountdown(button, seconds) {
        const originalText = button.querySelector('span').textContent;
        let remaining = seconds;

        button.classList.add('disabled');
        button.disabled = true;

        const updateButton = () => {
            button.querySelector('span').textContent = `${remaining}秒后重发`;
            remaining--;

            if (remaining < 0) {
                button.querySelector('span').textContent = originalText;
                button.classList.remove('disabled');
                button.disabled = false;
                clearInterval(this.countdowns[button.id]);
                delete this.countdowns[button.id];
            }
        };

        updateButton();
        this.countdowns[button.id] = setInterval(updateButton, 1000);
    }

    // 通知功能
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

        // 设置图标
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

        // 设置样式
        notification.className = `notification ${type}`;

        // 显示通知
        notification.classList.add('show');

        // 自动隐藏
        this.notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }


}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AuthPage();
});
