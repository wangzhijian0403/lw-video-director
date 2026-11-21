# 外部素材入口与许可分流

核查日期：2026-11-21。完整机器目录为 `resources/providers.json`。目录收录来源，不自动安装上游 Skill，也不把全部组件声明为已适配。

## 做片时如何调用

1. 从口播和镜头职责确定需要的动作、画面对象与声音事件。先查 Originals、已有 References，再按需查看外部候选；不强制先把资源收入复用库。
2. 从目录选来源、查看具体预览/源码/音频。选择适合内容、风格和节奏的资源，而不只选名字匹配的条目。查询脚本是字面元数据过滤，不是自动语义模型。
3. 核对具体文件的来源、作者、版本/日期、许可、第三方依赖与用途。按项目临时下载/改编/渲染；保留哈希、许可证据与署名。获权且适配测试通过再进镜头。
4. 允许视频使用但禁止原素材分发时，把媒体放在本地项目；GitHub/Skill 只保存代码、元数据和获取说明。遇到登录、API key、付费或 403 就记录阻塞，使用其他合法来源，不绕过限制。
5. 常用且允许相应用途的素材可以入本地复用库；没有复用必要的保持项目级使用。不能把上游素材批量抓取为自己的竞争性素材服务。

```sh
python scripts/resource_catalog.py --kind audio
python scripts/resource_catalog.py --kind style
python scripts/resource_catalog.py --kind animation --query lottie
python scripts/resource_catalog.py --items --query 弹性
python scripts/resource_catalog.py --items --query MP-001
```

`--items` 直接查询保留的 `visual-studio/external/catalog.json`，不建立第二份会漂移的条目目录。provider、单条源文件、adapter、target render、visual review 是不同状态。

## 按用途选来源

| 用途 | 来源 | 当前接入范围 |
|---|---|---|
| 动作术语、运镜、逐帧代码 | Motion Prompt | 原目录/provenance 保留；MP-001 已适配，MP-002 仅下载不提升 |
| 场景、Remotion 组件参考 | FredTalk | 保留元数据/预览/第三方声明；具体场景需取得可复用源码并另适配 |
| SVG 图标 | Lucide | Droplets/FileText 的帧动画 POC 通过，其他图标按需加入 |
| 卡通、循环动画 | LottieFiles | vector JSON 适配器可试渲染；第三方具体角色仍需逐份测试 |
| 免费现成音效 | Mixkit、Pixabay、Freesound | Mixkit 下载本轮 403；Pixabay 尚未做单条下载实测；Freesound 已有一个 CC0 压缩预览获取/混音用例 |
| 艺术/影片/MG 风格 | huashu-art-motion、mg-styles-15、lemo-opuscar、code-animation-prompts | 已读来源与许可，未批量复制/安装/渲染 |
| 产品宣传、解说、白板、人物专项 | video-shotcraft、vox-director、explainer-video、sweety-handdraw-video、srt-whiteboard-animation、stickman-video-director、anatomy、awesome-motion-graphics、facecammaxxing、OpenFilm | 上游代码/工作流候选，不宣称其所有整片、语音、角色或模型服务已接通 |
| 继续发现 | awesome-opus-video-skills | 索引入口；索引不替代被列项目的许可 |
| 可选付费/编辑工具 | Envato Elements、CapCut/剪映 | 候选工具路线；不自动订阅/购买，不取得其素材库整体授权 |

## 许可分流

- **MIT / ISC / Apache-2.0 代码**：保留对应许可/作者与 NOTICE；第三方字体、音频、Logo、模型服务不自动继承根许可。
- **Mixkit Sound Effects Free License**：允许获准音效嵌入视频等 end product；禁止原音效随工具、模板、源码或素材包分发。本地获取后混入视频，GitHub 留来源，不带原音效。官方：https://mixkit.co/license/modal/sfxFree/
- **Pixabay Content License**：允许按条款用于作品，禁止素材原样独立分发；复核具体内容及完整条款。官方：https://pixabay.com/service/license-summary/
- **Freesound**：逐条核对；优先 CC0，CC BY 保留署名，商业用途排除 CC BY-NC。原始文件需要登录时走正常授权登录；公开预览仍应记录其压缩质量，不冒充原始母带。官方：https://freesound.org/help/faq/#licenses
- **Lottie Simple License**：适用的公开可下载文件可用于商业作品，素材/素材衍生文件分发保留其许可，不汇编竞争性素材库；不能按项目根 MIT 重新许可 JSON。官方：https://lottiefiles.com/page/license
- **lemo-opuscar**：本轮不是单一 MIT。代码、文档、样片有不同条款，文档有特定做片许可；整体商业产品集成、第三方媒体/声线/Clawd/标识需另核查。只登记入口，不复制整库。以目录中固定 commit 的 LICENSE/REUSE/CREDITS 为准。
- **code-animation-prompts**：混合来源及免费分享约定，禁止打包收费，不能全库标成 MIT。逐条查原许可再采用；本项目只提供入口。
- **Remotion**：框架自身许可及主体资格单独有效，不能把播放器许可当成网上素材的许可。

POC 的 `checkRights(..., purpose='render')` 不再要求 raw `redistribute` 权利；需要原文件分发时显式传 `redistribute`。Mixkit/Pixabay 的 render 声明必须标记 `endProductOnly=true`、`redistribute=false`，Lottie Simple 声明保留资产许可且不建立竞争库。自定义许可证仍需已读证据与审核者，程序不自动判断法律事实。

## 已跑通的真实音效入口

```sh
python scripts/fetch_reference_audio.py freesound-210428-preview --output projects/papermaking/audio/water-new
# 将获取目录内 audio.wav 复制到 resource-adapters-poc/public/external-water.wav 后，进入该目录：
npm run render -- evidence/external-water-run external-audio
```

该脚本只处理已核对 manifest 的单条音效，核对当前源页 CC0、公开预览链接、固定下载哈希；不批量抓取、不模拟登录。输出来源页快照、MP3、48kHz PCM WAV、receipt。当前用例是 qubodup 的 Water Splash 1（https://freesound.org/people/qubodup/sounds/210428/），实际录音为容器向泥土/植物泼水，用作“纸浆触水”的声音候选，不冒称造纸现场录音。声音品质/语义最终按实际听感审片；公网压缩预览不等于原始 FLAC。

`resource-adapters-poc/evidence/resource-library/` 保存实测结果；渲染器与 manifest 在源码中，媒体留在本次交付和用户项目，不夹带未知授权音频。新音效条目应先完成同样来源/用途/哈希与真实混音验证，再扩展 manifest。

## 项目与安装版

本更新位于独立 `feature/resource-adapters-poc`，不合并 main、不触碰豆包生产分支、不覆盖其他 Draft PR。本目录的 SKILL.md 路由使使用此项目版本时会先查来源目录；已有全局安装版不会因 GitHub 分支更新自动切换。需要使用新流程时使用此分支/交付包版本，安装同步是单独动作，不应把尚未同步的全局版本说成已升级。
