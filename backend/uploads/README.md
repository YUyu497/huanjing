# FiveM安装包上传说明

## 📁 目录用途
此目录用于存放各种上传文件：
- `software/` - 存放FiveM客户端安装包等软件文件
- `images/` - 存放图片文件

## 📦 需要上传的文件

### FiveM客户端
- **文件名**: `FiveM.exe`
- **文件类型**: Windows可执行文件
- **文件大小**: 约5MB（具体大小可能因版本而异）

### Kook语音软件
- **文件名**: `kook.exe`
- **文件类型**: Windows可执行文件
- **文件大小**: 约200MB（具体大小可能因版本而异）

## 🚀 获取FiveM安装包的方法

### 方法1：从FiveM官网下载
1. 访问 https://fivem.net/
2. 点击"Download FiveM"
3. 同意服务条款
4. 下载FiveM.exe文件
5. 将文件重命名为`FiveM.exe`并上传到`software/`目录

### 方法2：从CFX镜像下载
1. 访问 https://content.cfx.re/mirrors/client_download/FiveM.exe
2. 直接下载FiveM.exe文件
3. 将文件重命名为`FiveM.exe`并上传到`software/`目录

### 方法3：从其他FiveM服务器获取
1. 联系其他FiveM服务器管理员
2. 获取FiveM.exe文件
3. 将文件重命名为`FiveM.exe`并上传到`software/`目录

## ⚠️ 注意事项
- 确保上传的是官方FiveM客户端，避免恶意软件
- 定期更新FiveM版本，保持最新
- 文件权限设置为644或755
- 确保服务器有足够的存储空间

## 🔧 上传后的验证
上传完成后，可以通过以下API验证文件是否正确：

### FiveM文件验证
- `GET /api/downloads/fivem/info` - 获取FiveM文件信息
- `GET /api/downloads/fivem` - 测试FiveM下载功能

### Kook文件验证
- `GET /api/downloads/kook/info` - 获取Kook文件信息
- `GET /api/downloads/kook` - 测试Kook下载功能

## 📊 下载统计
系统会自动记录下载次数，可以通过以下API查看：
- `GET /api/downloads/stats` - 获取下载统计

---
*最后更新: 2024年1月*
