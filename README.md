# 宝石仪器实验室 · Gem Instrument Lab

宝石鉴定仪器的 3D 互动教学网站（中英双语，入门级）。
Interactive 3D lessons on gem-testing instruments (Chinese / English, beginner level).

| 页面 Page | 仪器 Instrument |
|---|---|
| `microscope.html` | 宝石显微镜 Gem microscope |
| `refractometer.html` | 折射仪 Refractometer |
| `polariscope.html` | 偏光镜 Polariscope |
| `spectroscope.html` | 分光镜 Spectroscope |
| `chelsea-filter.html` | 查尔斯滤色镜 Chelsea filter |
| `uv-lamp.html` | 紫外荧光灯（长波 365nm / 短波 254nm）UV lamp |
| `hydrostatic-balance.html` | 静水力学天平 Hydrostatic balance |

## 本地打开 Open locally

直接双击 `index.html` 即可（需要联网加载 Three.js）。
Double-click `index.html` (needs internet to load Three.js from the CDN).

## 发布到 GitHub Pages

1. 在 GitHub 新建仓库，把本文件夹所有文件上传（或 `git push`）。
2. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`，目录 `/ (root)`。
3. 等一两分钟，网址为 `https://<用户名>.github.io/<仓库名>/`。

## 文件结构 Structure

```
index.html                 首页
*.html                     七个仪器页面
assets/css/style.css       样式
assets/js/core.js          双语切换、导航、测验等公共功能
assets/js/gems.js          宝石数据（RI、SG、光谱、荧光、内含物…）—— 改数据就改这里
assets/js/viewer3d.js      3D 场景与建模工具
assets/js/<仪器>.js         每个仪器的 3D 模型和模拟
```

3D 模型全部用 Three.js 代码搭建，没有外部模型文件，因此没有版权问题。
All 3D models are built in code with Three.js (r147); there are no external model files.
