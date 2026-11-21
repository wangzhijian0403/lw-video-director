# POC 来源与版权

只列本目录；原主工作台的 Motion Prompt、FredTalk 等声明继续独立有效。

1. **Lucide React 0.468.0**：作者 Lucide Contributors；含源于 Feather / Cole Bemis 的部分。固定来源 https://github.com/lucide-icons/lucide/tree/0.468.0 ，包来源 https://www.npmjs.com/package/lucide-react/v/0.468.0 。本轮只调用 Droplets、FileText，未批量复制图标文件。保留包内原版 ISC 文本 `licenses/Lucide-0.468.0-ISC.txt`；同时保留 Feather MIT `licenses/Feather-MIT.txt`（https://github.com/feathericons/feather/blob/v4.29.2/LICENSE）。发行含图标的包/测试片时应附带本声明与许可；不能把图标标成 LW 原创或据此取得任何商标权。
2. **lottie-web**：Bodymovin，实际固定版本见 package-lock 和 assets-used.json，MIT，原文 `licenses/lottie-web-MIT.txt`。播放器 MIT 不会给网上任意 JSON 自动授权。
3. **@remotion/lottie / Remotion 4.0.545**：Remotion / Arthur Denner 等，Remotion License，不是 MIT。保存实际安装版本许可 `licenses/Remotion-4.0.545.md`；https://github.com/remotion-dev/remotion/tree/v4.0.545 。本轮为评估用途。个人、小公司等适用范围和其他主体的 Company License 以所附条款及官方说明为准，不把本 POC 的评估运行扩大为任意组织的免授权商用许可。
4. **原创 Lottie fixtures** `assets/paper-sheet.json`、`assets/paper-precomp.json`：本次为 LW 创建，MIT，随根项目 MIT 条款；无外部图像、字体、品牌、音频和表达式。第二份从第一份原创纸页扩展分组/预合成和父层，仅做兼容性测试。来源为本次源码，不伪装第三方卡通资源。`rights-example.json` 只声明这份原创测试文件的权利，不能套用于其他素材。
5. **原创程序拟音** `generate-audio.py` 及其 WAV 输出：本次为 LW 创建，MIT；公开算法、固定种子，无第三方采样和未知音频。不是现场录音。
6. **React/React DOM**：Meta Platforms 等，MIT；**TypeScript**：Microsoft，Apache-2.0；**@types/react / react-dom**：DefinitelyTyped contributors，MIT。包内 license 保留在 npm 安装物中。其余打包、渲染运行时依赖的版本和 integrity 见 package-lock.json，许可证清单见 evidence/dependency-licenses.json；重分发整个 node_modules 时必须另附各包声明，验收源码包不包含 node_modules。

读取/许可核验日期：2026-11-21（Asia/Shanghai）。上游来源、包文件、生成音频的 SHA-256 见 assets-used.json。目录中的技术证据不把本来只允许参考的其他 LW References 项目升级为可商用素材。
