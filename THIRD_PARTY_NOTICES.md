# Third-party notices / 第三方资源声明

本仓库按来源/具体文件分别记录外部资源。主工作台已有 Motion Prompt 适配及独立外部声明；新增来源目录多数仅登记链接与许可元数据，不代表已复制或适配整库。详见 `visual-studio/external/THIRD_PARTY_NOTICES.md`、`resource-adapters-poc/THIRD_PARTY_NOTICES.md` 和 `references/resource-providers.md`。

## 新增来源目录与真实音效用例

`resources/providers.json` 登记26个来源/工具/未核实名称候选，包括已有 Motion Prompt/FredTalk；15个上游 GitHub 项目本轮读取固定提交的许可文件。未复制其组件、媒体或 Skill 正文，未将混合许可项目统一重许可为 MIT。版权/许可按目录内具体来源链接与 revision 核查。

Freesound Water Splash 1，作者 qubodup，https://freesound.org/people/qubodup/sounds/210428/，源页声明 CC0，https://creativecommons.org/publicdomain/zero/1.0/ 。本轮使用官方公开 HQ MP3 压缩预览（非登录后原始FLAC）并转 WAV 混入独立测试片；下载链接和 SHA256 在 `resources/audio-examples.json`，原媒体/源页证据留本地。署名自愿保留。Mixkit/Pixabay 的原音效不可因本项目 MIT 声明而随源码分发；目录不构成相应原素材授权。

## Motion Prompt

- Project: https://github.com/showheyohtaki/motion-prompt
- Gallery: https://showheyohtaki.github.io/motion-prompt/
- Upstream license: MIT, see upstream [LICENSE](https://github.com/showheyohtaki/motion-prompt/blob/main/LICENSE).
- When copying a specific element's code under its upstream terms, retain the element's first-line attribution comment (element ID and copyright/license attribution), and include the applicable upstream license/notice.
- The upstream repository contains its own third-party notices; external embedded posts are not relicensed by its MIT grant.

## FredTalk

- Project: https://github.com/njrhts2kvv-star/FredTalk
- Visual library: https://www.fred-fu.com/visual-library
- First-party scope: the upstream author states that its MIT license covers FredTalk-authored first-party code, Skills, templates and documentation.
- Excluded/separately licensed material: third-party code, reference-derived project snapshots, fonts, sound effects, music, images, screenshots, recordings, videos, logos and branding remain under their own licenses or permissions. See upstream [license scope](https://github.com/njrhts2kvv-star/FredTalk/blob/main/docs/license-scope.md), [third-party notices](https://github.com/njrhts2kvv-star/FredTalk/blob/main/THIRD_PARTY_NOTICES.md), and [asset installation guide](https://github.com/njrhts2kvv-star/FredTalk/blob/main/docs/assets.md).
- Do not copy or distribute a component merely because it appears in the online gallery or repository. Verify the exact source files, source availability, component provenance, media dependencies and applicable license before integration.

## LW project license boundary

The root MIT license in this repository applies only to files authored by the LW project owner and contributors who grant those rights. It does not relicense any third-party material. Each future imported asset must be added here with its source URL, author, version/commit, license, attribution requirements, and exact files included.
