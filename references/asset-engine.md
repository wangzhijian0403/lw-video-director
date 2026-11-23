# LW Asset Engine 素材管理与检索规范

## 制作入口

在口播分镜之后、时间轴渲染之前运行素材引擎。Skill 是语义导演：将逐句口播解析为概念/关系、镜头职责、情绪、视觉风格和必须出现的实体；索引和可执行门禁不能凭文件名猜内容。用户仅给主题时先使用原创图形，实际录音或已授权 TTS 与字幕不可省略。此规范纳入 PR #4 制作协议与 Issue #3 整片闭环；当前独立分支本地开发，不自动推送或合并。

## 索引合同

项目级 SQLite 索引保存唯一记录：assetId、相对项目路径、原路径、SHA-256、媒体种类/流参数、尺寸/时长/帧率、来源 URL、作者、许可证、授权证据、授权作用域、署名要求、语义标注及其证据、使用历史。导入只复制不改写原文件；相同内容可以有不同授权记录，绝不因为哈希相同而借用另一来源的许可。导入的视频/图片/录屏/音乐/音效/字体/MG 各有类型，未知内容不冒充已识别语义。

素材所有权维度为 user-local、lw-originals、lw-references；在线服务是 provider，不改变所有权。字体只引用获准渲染的本地安装路径或授权副本，不默认允许再分发字体。MG 必须对照现有 registry/quality/external catalog，只有真实绑定适配并通过渲染的组件可执行。

## 权限不是单一进度条

分别记录 reference、download、adapt、render；运行验证独立记录 indexed/probed/render-verified。下载允许不等于允许剪辑/改编；有源码不等于可执行。未知许可一律 reference-only。用户本地导入需提供来源/作者和有范围的授权声明；文件在本地并不代表拥有版权。公开索引元数据不是授权证据，必须复核原始来源页和许可条款，保存原始证据快照哈希及 URL；获取不到授权只保留候选、官方预览链接。

在线检索先取元数据，不自动下载内容；只有来源明确、download 许可和证据均存在时才取文件。不得去水印、绕登录/会员限制或从缓存提取不可下载资源。原始来源需署名/限制商业/改编时保留条件，无法满足时拒用。商业发布许可须另行核对；测试授权不能升级为发布授权。

## 语义推荐

口播 → 结构化 shotIntent（concepts、relations、purpose、emotion、style、requiredEntities）。素材以同一语义表示；按概念层级/关系、镜头职责、情绪、风格、实体、媒体质量与使用重复率排序，输出每项分数和原因。字面命中只能作为辅助，不可替代镜头职责。没有语义标注或信心不足不自动执行，交给导演做补充判断；不宣称内置 ASR/视觉识别/多模态嵌入已完成。语义解释由本 Skill/导演提供，脚本执行可审计的本体评分，不伪装为训练模型。

## 文案自动找素材的边界

`from-copy` 是**接进本引擎的一个入口**，不是另一套匹配系统：它把文案按句拆开，用可审计的规则线索生成 `concepts` / `purpose` / `analysisEvidence`，再调用同一个 `recommend()` / `select_for_shot()`。`--libraries` 只能缩小范围，不能绕过权利门禁；没有可用素材时返回明确错误，不生成占位条目。每条草案带 `reviewRequired: true` 与命中的线索说明，命中失败时标注 `position-default`（位置默认，非语义确认）。`seed` 只登记工作区里 `renderStatus=passed` 且有来源与许可记录的组件，注册后仍由 `probe()`/`require()` 验证可执行性。规则映射不是语义理解、ASR 或训练模型，不得据此宣称任意题材自动选材或全自动成片。

## 时间轴和版权门禁

镜头只引用 assetId；编译时重新读取索引、核验本机文件哈希和逐项 render/adapt/scope/attribution 条件，再复制到项目使用区。图片 contain/cover、视频 trimStart/显式冻结、音量、MG 叠加、入退场、字幕时间码、字体统一写入 episode。静态图/短片不循环冒充长素材，循环和冻结必须显式记录。

缺少可用素材时推荐有内容依据的原创 MG 替代；在选择报告列出 fallback 和原因，不静默放占位图。没有真实替代也不能自动通过。成片生成 assets-used.json、copyright-report.json、使用历史及渲染 QA；实际渲染完成后才提交使用历史，失败不记成已用。

## 验证状态

规范不等于实现。每项导入、在线服务、参数、时间轴适配和渲染能力分别记录实际测试；原有 v0.2 单组件门禁保持独立。只在真实整片成功后记录本机技术通过，视觉验收与发布授权仍单独等待。


## 可执行入口与当前证据

```sh
python scripts/asset_engine.py --project <project> import <media> --metadata <rights-and-semantics.json>
python scripts/asset_engine.py --project <project> search-online "film camera"
python scripts/asset_engine.py --project <project> review-flickr <candidate-id>
python scripts/asset_engine.py --project <project> download <candidate-id> --scope private-test
python scripts/asset_engine.py --project <project> recommend --intent <shot-intent.json> --scope private-test
python scripts/asset_engine.py --project <project> select --intent <shot-intent.json> --scope private-test
python scripts/asset_engine.py --project <project> seed --scope private-test
python scripts/asset_engine.py --project <project> from-copy --file <copy.txt> --scope private-test --libraries lw-originals,lw-references --seed
python scripts/asset_timeline.py <episode.json> --project <project> --check
python scripts/asset_timeline.py <episode.json> --project <project>
python scripts/episode_preflight.py <episode.json> --phase render
```

`asset-engine/1` 时间轴每镜使用 id/startFrame/durationFrames/purpose/title/visualAssetId/narrationAssetId；可有 overlayAssetIds、sfxAssetId、trimStart、narrationTrimStart/End、fit、endPolicy、captions。全局 output、scope、fontAssetId、musicAssetId；同一真实人声文件可以按明确音频范围用于不同镜头。也可由 subtitles.filePath 导入已对齐 SRT（需 source/author/rights）。脚本不生成虚构 ASR。clip 变速、任意多轨剪辑和缓存化局部返修尚未实现。

本次本地实测：26 项 Python 测试；Openverse 图像元数据检索；Flickr 原始 ImageObject 与 CC BY 2.0 条款核验后取得照片并入片；七类本地媒体可索引/探测（录屏角色为用户声明，不自带屏幕捕获）；现有 LW MG 与 MP-001 可信适配器实际渲染。Openverse 音频接口虽有代码，尚未单独实测；其他站点、许可组合保持候选或待验证。

`asset_timeline.py` 是独立 **FFmpeg/PyAV 时间轴适配器**，调用现有 Remotion 组件后在原生纵向画布按比例合成，并非新增 Remotion 多场景 Composition。已生成约55秒、8镜、1080×1920/30fps、AAC中文语音/字幕/音乐/音效的私有验证片，技术检查与视觉验收分开。它证明了索引素材可用于整片，不证明 Issue #3 的所有工程项或任意主题的一键制作已经完成。

范围限制：字幕依真实逐句合成音频边界，不是逐字强制对齐；测试语音使用本机 Windows 中文系统声线，商业/发布权利未验证；字体不再分发。原始字幕和用户录音必须由调用方提供正确时间码。多模态自动标注、通用语义嵌入/模型、任意主题自动脚本/ASR、跨平台语音与原生竖屏 Remotion 场景仍待独立实现。

全局 Skill 可通过 `LW_DIRECTOR_REPO` 或本机 `asset-runtime.local.json` 的 repoPath 指向装有依赖的源码目录；默认使用本 Skill 根目录。配置文件只保存在本机，不上传。分析工具与 v0.2 工作台继续独立；不能用本次私有样片的通过结果扩大权利范围或改写全局生产能力门禁。
