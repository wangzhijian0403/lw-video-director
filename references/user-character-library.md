# 用户本地卡通角色 · Character Actor（v0.2 基础接入）

## 来源和权利

用户上传的 `library.zip` 包含 5 种自制主题角色（fish、codex、deepseek、doubao、claude）、20 份管理原件：5 张透明 PNG、5 张绿底 JPG 和 10 条 10 秒 / 24fps 绿幕 MP4。角色是用户自制的工具主题拟人形象，**不是相应品牌官方形象**。原始媒体只授权用于用户自己的视频；无公开再分发许可。因此**不上传 GitHub**，包括透明转码成品。

## 本轮验收状态（verified-basic）

在最新 main 基线上完成基础接入，仅以下两条动作通过真实 Remotion `ProjectVideo` Composition 的双角色叠加 E2E：

| 角色 | 动作 | 状态 | 安全区间（源片秒） | 媒体处理 |
|---|---|---|---|---|
| fish | wave | verified-basic | 0.2 – 5.0 | 已裁到安全区间的 VP9 alpha WebM |
| codex | typing | verified-basic | 0.2 – 5.0 | 已裁到安全区间的 VP9 alpha WebM |

验收产物：1920×1080、30fps、5.000s 双角色 MP4；0.5 / 2.5 / 3.5 / 4.0 / 4.5 / 4.7s 抽帧复核，角色持续在场至槽位结束，标题不被遮挡，字幕发光已减弱，本体白色完整。

其余动作与静态图（idle、curtsy、share、dance、still 等）为 **wired-pending**：适配器已接线，但未通过基础 E2E，渲染时显示「动作待验收」占位，**不得静默播放或黑屏**。

## 安全播放与默认限制

- 每条已验收条目登记 `safeRange {start, end}` 与 `loopAllowed: false`；本地 WebM 在准备阶段已按安全区间裁短。
- 默认**不允许**未经检查的完整 10 秒播放，也**不允许自动循环**；无缝循环属后续单独验收项。
- 时间轴解析时校验：角色 ID、动作白名单、起始时间、时长、位置坐标是否有限且在画布内；Node 渲染层核对 `public/characters/<file>` 存在性。媒体缺失时显示显式占位并列出文件名，不允许静默黑屏。

## 资产清单（从源包 library.json 实时读取）

| 角色 | 透明图片 | 待机视频 | 专属动作视频 |
|---|---|---|---|
| fish（一鱼 MET） | fish-transparent.png | fish-idle.mp4 | fish-wave.mp4 |
| codex | codex-transparent.png | codex-idle.mp4 | codex-typing.mp4 |
| deepseek | deepseek-transparent.png | deepseek-idle.mp4 | deepseek-curtsy.mp4 |
| doubao | doubao-transparent.png | doubao-idle.mp4 | doubao-share.mp4 |
| claude | claude-transparent.png | claude-idle.mp4 | claude-dance.mp4 |

除 PNG 外原媒体都不是 alpha 视频；原声默认静音，不能直接无绿幕叠片。抠绿后脚下浅色椭圆 / 地面影仍有残留，不要用简单去白底修补伤害人物白色部位（三轮像素级原型均误伤本体白色，已停止破坏性抠影，保留媒体原样并列入待验收）。

## 本地资产准备（Windows PowerShell）

先把用户自有 ZIP 解压到例如 `D:\LW角色素材库`，保持根目录 `library.json` 和 `originals/video-style/assets/`。

```powershell
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" verify
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" list
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" prepare-alpha --character fish --action wave --out "visual-studio/public/characters"
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" prepare-alpha --character codex --action typing --out "visual-studio/public/characters"
```

对需要的其他视频按角色 / 动作继续转换；用复制方式将 5 张 `*-transparent.png` 安装到相同的 `visual-studio/public/characters` 文件夹。

`visual-studio/.gitignore` 必须排除 **public/characters/**，避免误上传私有媒体。不要 `git add -f`。

## 源码接入

角色相关源码（追加式，不替换口播 / SFX / 场景系统）：

- `src/components/characters/characterRegistry.mjs`：角色 ID 与动作白名单、已验收条目表、安全区间、循环开关。
- `src/components/characters/UserCharacterActor.tsx`：三态占位（配置错误 / 缺私有媒体 / 待验收）+ 已验收视频 / 静态图叠加。
- `src/project/character-media.mjs`：Node 层私有媒体存在性校验。
- `src/project/types.ts`、`src/project/timeline.mjs`：角色槽位类型、解析、校验与坐标夹紧。
- `src/project/ProjectVideo.tsx`：角色 Sequence 叠加层（bridges 之后、字幕层之前）。

```tsx
import {Sequence} from 'remotion';
import {UserCharacterActor} from '../components/characters/UserCharacterActor';

<Sequence from={6} durationInFrames={138}>
  <UserCharacterActor characterId="fish" action="wave"
    x={80} y={440} width={340} height={227}
    durationInFrames={138} />
</Sequence>
```

时间轴工程字段见 `src/project/types.ts` 的 `TimelineCharacter`；缺省时组件内部回退注册表查询。源码不自动注册到正式 Production catalog，避免在缺少本地用户资产时出现黑屏。

## 仍待验收（未通过，不得宣称已完成）

- 脚下白色椭圆 / 地面影残留；绿边溢绿；全长 10s 边缘、抖动与素材漂移。
- 自然无缝循环；口型 / 动作同步；预览与导出一致性。
- 骨骼绑定、任意动作生成、实时交互状态机。角色为现成录像动作，不具备上述能力。
- 其余角色与动作（idle / curtsy / share / dance / still）的基础 E2E。

> 注意：角色是现成录像动作，不能宣称拥有骨骼绑定、任意动作生成、说话口型同步或实时交互状态机。
