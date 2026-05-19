# 🎨 语音表白墙 - Web预览指南

## 快速预览

### 方法一：直接双击运行 (推荐)
```
双击 preview.bat 文件
```
然后浏览器访问: http://localhost:8080

### 方法二：使用 VS Code Live Server
1. 在 VS Code 中打开 client 文件夹
2. 安装 Live Server 插件
3. 右键点击 index.html → "Open with Live Server"

### 方法三：使用 Python
```bash
cd client
python -m http.server 8080
```
访问: http://localhost:8080

### 方法四：使用 Node.js
```bash
npm install -g http-server
cd client
http-server -p 8080
```

## 📱 预览效果

启动后会显示：
1. **启动页** - 应用Logo和标语
2. **首页** - 表白墙列表、分类筛选、音频播放
3. **底部导航** - 首页/分类/发布/榜单/我的
4. **交互动画** - 播放按钮、点赞效果、分类切换

## 🎯 可交互功能

- ✅ 点击 **播放按钮** - 查看音频播放动画
- ✅ 点击 **❤️** - 点赞/取消点赞
- ✅ 点击 **分类标签** - 切换分类
- ✅ 点击 **底部导航** - 切换页面(首页有效)
- ✅ 启动页 **2秒后自动消失**

## 🔗 分享链接

要在其他设备上预览：

1. 确保所有设备在同一WiFi下
2. 查看本机IP: `ipconfig` (Windows) 或 `ifconfig` (Mac/Linux)
3. 手机访问: `http://你的IP:8080`

## ⚠️ 注意事项

- 这是 **静态预览版本**，用于UI展示
- 完整功能需要启动后端服务器
- 录音功能仅在App/小程序中可用
- H5版本部分功能受限

## 🚀 启动完整开发版本

```bash
# 1. 启动后端
cd server
npm install
npm run dev

# 2. 启动前端 (新开终端)
cd client
npm install
npm run dev:h5
```

完整版访问: http://localhost:3001