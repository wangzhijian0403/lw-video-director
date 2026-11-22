# 用户本地卡通角色 · Character Actor（v0.1，待Remotion验证）

## 来源和权利

用户上传的 `library.zip` 包含 5 种自制主题角色（fish、codex、deepseek、doubao、claude）、20份管理原件：5张透明 PNG、5张绿底 JPG 和10条10秒/24fps绿幕 MP4。角色是用户自制的工具主题拟人形象，**不是相应品牌官方形象**。原始媒体只授权用于用户自己的视频；无公开再分发许可。因此**不上传 GitHub**，包括透明转码成品。

2026-11-22 的独立工作环境对上传包执行了逐文件 SHA-256：20/20 通过；重新渲染五角色4秒、1920×1080、24fps无音轨 MP4，完成单帧抽查；`fish-wave.mp4` 完整10秒转换为带 `alpha_mode=1` 的 VP9 WebM，FFmpeg背景合成验证通过。

**仍未验证**：所有10条全长关键帧、背景白色地面影、边缘溢绿、自然循环、口型同步、实际 Windows Chrome/Remotion 透明播放和 ProjectVideo 集成。当前角色适配器状态仅为 `wired`，不得升级 `verified` 或 `licensed`。

## 资产清单（从源包 library.json 实时读取）

| 角色 | 透明图片 | 待机视频 | 专属动作视频 |
|---|---|---|---|
| fish（一鱼 MET） | fish-transparent.png | fish-idle.mp4 | fish-wave.mp4 |
| codex | codex-transparent.png | codex-idle.mp4 | codex-typing.mp4 |
| deepseek | deepseek-transparent.png | deepseek-idle.mp4 | deepseek-curtsy.mp4 |
| doubao | doubao-transparent.png | doubao-idle.mp4 | doubao-share.mp4 |
| claude | claude-transparent.png | claude-idle.mp4 | claude-dance.mp4 |

除 PNG 外原媒体都不是 alpha 视频；原声默认静音，不能直接无绿幕叠片。抠绿后脚下浅色椭圆/地面影可能残留；不要用简单去白底修补伤害人物白色部位。

## 本地资产准备（Windows PowerShell）

先把用户自有 ZIP 解压到例如 `D:\LW角色素材库`，保持根目录 `library.json` 和 `originals/video-style/assets/`。

```powershell
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" verify
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" list
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" prepare-alpha --character fish --action wave --out "visual-studio/public/characters"
python visual-studio/scripts/user_character_library.py --root "D:\LW角色素材库" prepare-alpha --character codex --action typing --out "visual-studio/public/characters"
```

对需要的其他视频按角色/动作继续转换；用复制方式将5张 `*-transparent.png` 安装到相同的 `visual-studio/public/characters` 文件夹。

`visual-studio/.gitignore` 必须排除 **public/characters/**，避免误上传私有媒体。不要 `git add -f`。

## Remotion 源码接入示例

此分支仅新增组件源码：
`visual-studio/src/components/characters/UserCharacterActor.tsx`。

```tsx
import {Sequence} from 'remotion';
import {UserCharacterActor} from '../components/characters/UserCharacterActor';

<Sequence from={30} durationInFrames={120}>
  <UserCharacterActor characterId="fish" action="wave"
    x={115} y={260} width={430} height={365}
    durationInFrames={120} />
</Sequence>
```

在实际 `ProjectVideo` 中让 CharacterActor 成为独立 overlay（不替换旁白、SFX或场景系统）。源码暂不自动注册到正式 Production catalog，避免在缺少本地用户资产时出现黑屏。

## 下阶段人工+自动技术验收（本地执行AI）

1. 以本独立分支检出，验证 Git 状态和私有媒体 Git ignore，`npm ci`、`npm test`、`npx tsc --noEmit`。
2. 对 fish-wave（和至少一个非鱼角色）完成10秒 alpha 转码、源/输出 SHA、0s/1s/5s/9s 抽帧与背景合成比较。
3. 浏览器预览 `<Video>` 的 VP9 alpha 是否真正保持透明；不行则说明具体 Chrome/WebM 解码问题，改用有证据的渲染方案。
4. 给真实 `Project` Composition 加一个可配置角色叠加测试（不动现有口播系统），输出 1920×1080、30fps、至少4秒真实 MP4 并比对预览帧。
5. 检查绿边、白色地面影、裁切、安全区、动作完成时间和原音是否已静音；循环单独复核。
6. 保存测试日志、MP4、关键帧及新的适配器状态，再提交结果。未经用户许可不将媒体公开上传、勿合并 main。

> 注意：角色是现成录像动作，不能宣称拥有骨骼绑定、任意动作生成、说话口型同步或实时交互状态机。
