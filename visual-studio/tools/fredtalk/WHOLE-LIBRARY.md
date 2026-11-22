# FredTalk 全目录的真实运行状态与批量处理

## 目前库存（不是432条全部已可执行）

基于固定上游版本 `59b9e9957957dc9f3fd94ab78f95cec33c29e915`、2026-11-22 已保存的逐条源码清单：

| 条件 | 条数 | 结论 |
| --- | ---: | --- |
| FredTalk References 元数据 | 432 | 目录，可在网站看预览，但不代表本机可执行 |
| 所有声明源文件完整取得 | 416 | 单独判定依赖是否完整 |
| kit-overlay 可批量适配策略 | 135 | 需要本地校验源码缓存、逐组件真实渲染与QA |
| standalone/standalone-module | 13 | 需要新增适配策略，不能用kit装作已通过 |
| blocked-dependency | 284 | 静态解析发现共享模块、JSON、字体或其它依赖缺失；不可伪造已有源码 |
| 已纳入主库且真实工程可调用的精选 FredTalk | 16 | 主库已有能力，不受本批试验分支影响 |

PR #8 中 batch-20 和 batch-21 报告各显示20条机器渲染通过，人工视觉与工作台可用性仍要分开看，且与主库16条存在重复。**不得将20+20+16简单相加当成唯一且可用的76条。**

## 新增统一脚本

`visual-studio/tools/fredtalk/run_all.py`

### 无成本清点（不渲染）

```powershell
cd "D:\Codex工作目录\lw-video-director\visual-studio"
python tools/fredtalk/run_all.py --dry-run --run-id fred-all-plan
```

这个离线计划列出432条的资源策略，不需要依赖缓存，因此 **135 是策略上可批量适配，不是已经通过适配／渲染／版权审查的数量**。输出为 `external/fredtalk/batch/runs/fred-all-plan/all-summary.json`。

### 在现有PR #8的开发工作树中全量实际运行（用户电脑）

先**保留所有未提交改动与私有媒体**，不能在 main 或已安装 Skill 目录里乱改。需要已安装 Node.js、Python 3、npm、Chrome/Chromium；必要时先执行 `npm ci` 与 `npm run setup:fred`。源文件的匿名下载仅限固定上游Tag/哈希核验，不使用付费网站突破权限。

```powershell
cd "D:\Codex工作目录\lw-video-director\visual-studio"
npm ci
npm run setup:fred
python -m pip install opencv-python numpy pillow
python tools/fredtalk/run_all.py --refresh-inventory --run-id fred-all-v1 --batch-size 10
```

完整操作是在**PR #8开发分支**上进行；主库可能没有 `tools/fredtalk/run_all.py`，不能在主库直接执行这条命令而假装已经安装。工具自动选出真正可以解析的 kit，按10条一批重启 Node/Chromium 渲染，失败在新进程有限重试，QA失败照样留痕；没有 `--max-items` 总数限制。断点重复时渲染引擎的输入指纹决定是否复用，非相同输入不得跳过。

脚本生成：
- `runs/fred-all-v1/inventory-summary.json`：逐分类及缺依赖情况
- `runs/fred-all-v1/adapt-status.json`：逐条适配结果
- `runs/fred-all-v1/all-summary.json`：逐批渲染/机器 QA 总结
- `runs/fred-all-v1/all-components.json`：432条的技术/阻塞情况与待人工审核状态
- `runs/fred-all-v1-part-XXX/evidence/<ID>/render.mp4`：真实视频与帧证据（默认gitignore，不提交大型二进制）

如是本机而非Linux环境，设置 `--browser "C:\Program Files\Google\Chrome\Application\chrome.exe"`；验证器使用 opencv-python、numpy。若 npm/源码连接失败，脚本停下并给出原始错误，不把未跑的条目标成通过。

### 入库的严格条件

- 本地源码已取得，授权范围明确，未授权媒体用用户自有素材或LW自制占位，不得把上游预览当成可再分发媒体
- 源码哈希/依赖解析 → 自动编译/真实视频 → 机器 QA → 人工视觉 QA → 工作台当前选中项可预览/导出 → 整片镜头测试
- 机器 QA pass 的标记是 `machine-pass-needs-human-review`，**不是已发布／已合并**。
- 已验收的内容按ID逐批进入主库及 `Originals` 统一资源库，更新 `SKILL.md` 的实际调用ID；References保留未安装/未通过的目录项。
- 禁止为了凑432条将不可运行的项目替换为同一款通用黑胶囊模板，也禁止用户本地角色/配音被上传到公开GitHub。
- GitHub Actions目前仅运行离线清单门禁，不执行耗费大量runner时间/存储的整库渲染。实际全量渲染应优先在本机进行。

## 发布量化口径

每次回复都报告：目录总数、源码策略候选、真实适配成功数、真实渲染通过数、机器QA通过数、人工审核通过数、当前主库实际可调用数、待修与阻塞数。**最后两个数字不得由其它字段推算冒充。**
