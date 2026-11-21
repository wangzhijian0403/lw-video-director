# FredTalk 432 条源码与适配状态清单

上游版本：`59b9e9957957dc9f3fd94ab78f95cec33c29e915`（公开 tag `v2.5.0`）

## 汇总

| 指标 | 数量 |
| --- | --- |
| 目录条目 | 432 |
| 至少一个文件实取 | 432 |
| 全部声明文件实取 | 416 |
| 具备可编辑参数 | 142 |
| 已渲染通过 | 1 |

## 类别分布

| 类别 | 条目 | 全部文件实取 |
| --- | --- | --- |
| 讲解段落 | 234 | 226 |
| 内容交接 | 54 | 52 |
| 录屏聚焦 | 43 | 41 |
| 录屏与视频入场 | 42 | 41 |
| 图片与作品 | 40 | 38 |
| 数值与图表 | 19 | 18 |

## 适配策略

| 策略 | 条目 |
| --- | --- |
| 依赖文件缺失 | 284 |
| Kit 覆盖层（主题/字体/音效宿主替换） | 135 |
| 自包含单文件组件 | 8 |
| 自包含多文件组件 | 5 |

## 逐条状态

| LW ID | FredTalk | 类别 | 源码 | 可编辑参数 | 策略 | 已接入 | 已渲染 | 阻塞原因 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FT-T01j-240 | T01j | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/ep, ../lib/shell, ./ep |
| FT-T02k-241 | T02k | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/v2a-handoff, ../components/v2a-kit, ../lib/shell |
| FT-T02l-242 | T02l | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/handoff, ../components/s08-bkit, ../components/s12-Header, ../components/s12-Sta |
| FT-T02m-243 | T02m | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/ckit, ../components/ep, ../components/glass, ../components/handoff, ../lib/shell |
| FT-T03g-244 | T03g | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/episode-kit/chap, ../components/episode-kit/ep, ../components/episode-kit/g4, .. |
| FT-T03h-245 | T03h | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./episode-kit/g4 |
| FT-T03i-246 | T03i | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/chap, ../components/ep, ../components/g4, ../lib/shell |
| FT-T03j-247 | T03j | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/episode-kit/chap, ../components/episode-kit/ep, ../components/episode-kit/g4, .. |
| FT-T04j-248 | T04j | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./episode-kit/g4 |
| FT-T04k-249 | T04k | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../scene-data.json, ./early/index, ./env/index, ./latest/SummaryScenes, ./middle/CapabilitiesS |
| FT-T05q-250 | T05q | 讲解段落 | 3/3 | - | kit-overlay | - | - |  |
| FT-T05r-251 | T05r | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/g4 |
| FT-T08k-252 | T08k | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/v2-Spotlight, ../components/v2a-handoff, ../components/v2a-kit, ../lib/shell |
| FT-T08n-253 | T08n | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/handoff, ../components/s09-Hits, ../components/s11-LazyPage, ../components/v2c-k |
| FT-T08o-254 | T08o | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/ckit, ../components/ep, ../components/handoff, ../lib/shell, ./ep |
| FT-T08p-255 | T08p | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/ckit, ../components/ep, ../components/ep118, ../components/handoff, ../lib/shell |
| FT-T10i-256 | T10i | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/v2b-kit, ../lib/shell |
| FT-T10j-257 | T10j | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../lib/OldTime, ./episode-kit/ep |
| FT-T10k-258 | T10k | 讲解段落 | 5/5 | - | blocked-dependency | - | - | local imports unresolved: ./lib/SmileySubtitle |
| FT-T11n-259 | T11n | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/handoff, ../components/s10-Rank, ../lib/shell, ./S12 |
| FT-T11o-260 | T11o | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/g4 |
| FT-T11p-261 | T11p | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/episode-kit/chap, ../components/episode-kit/ep, ../components/episode-kit/g4, .. |
| FT-T13g-262 | T13g | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/e113, ../components/episode-kit/chap, ../components/episode-kit/ep, ../component |
| FT-T13h-263 | T13h | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/ckit, ../components/ep, ../components/ep118, ../components/handoff, ../lib/shell |
| FT-T14k-264 | T14k | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/handoff, ../components/s01-Term, ../components/s02-Install, ../lib/shell, ./S02 |
| FT-T14l-265 | T14l | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/ckit, ../components/ep, ../lib/shell, ./B-parts, ./B-s0607, ./ep |
| FT-T14m-266 | T14m | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../components/ep, ../lib/shell, ./ep |
| FT-T14n-267 | T14n | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/chap, ../components/ep, ../components/g4, ../lib/shell |
| FT-T15p-268 | T15p | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/ep, ../lib/shell, ./ep |
| FT-T16f-269 | T16f | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/chap, ../components/ep, ../components/g4, ../lib/shell |
| FT-T16g-270 | T16g | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/episode-kit/chap, ../lib/shell |
| FT-T17h-271 | T17h | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../components/v2c-handoff, ../lib/shell, ../masks/clone.json |
| FT-T17i-272 | T17i | 讲解段落 | 4/4 | - | kit-overlay | - | - |  |
| FT-T17j-273 | T17j | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../components/s14-CKit, ../components/s16-Steps, ../lib/shell |
| FT-T17k-274 | T17k | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../scene-data.json, ./FullscreenVideoWindow, ./SmileySubtitle, ./data.json, ./early/index, ./l |
| FT-T18j-275 | T18j | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/chap, ../components/ep, ../components/g4, ../lib/shell |
| FT-T18k-276 | T18k | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/episode-kit/chap, ../components/episode-kit/ep, ../components/episode-kit/g4, .. |
| FT-T20s-277 | T20s | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../components/handoff, ../lib/OldTime, ./episode-kit/ep |
| FT-T20t-278 | T20t | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../lib/OldTime, ./episode-kit/ep |
| FT-T20u-279 | T20u | 讲解段落 | 4/4 | - | kit-overlay | - | - |  |
| FT-T20v-280 | T20v | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/g4 |
| FT-T20w-281 | T20w | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./components/TitlePill, ./components/fullscreen-video-window-geometry, ./lib/SmileySubtitle |
| FT-T20x-282 | T20x | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/episode-kit/chap, ../components/episode-kit/ep, ../components/episode-kit/g4, .. |
| FT-T21f-283 | T21f | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/s14-CKit, ../lib/shell, ./S18 |
| FT-T21g-284 | T21g | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../components/ep, ../lib/shell, ./ep |
| FT-T22f-285 | T22f | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../components/chap, ../components/ep, ../components/g4, ../lib/shell |
| FT-T22g-286 | T22g | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../components/episode-kit/chap, ../components/episode-kit/ep, ../components/episode-kit/g4, .. |
| FT-T09q-287 | T09q | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09r-288 | T09r | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09s-289 | T09s | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09t-290 | T09t | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09v-291 | T09v | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09w-292 | T09w | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09z-293 | T09z | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T08l-294 | T08l | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12u-295 | T12u | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T12v-296 | T12v | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T12w-297 | T12w | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T12x-298 | T12x | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T12z-299 | T12z | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T23a-300 | T23a | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T23b-301 | T23b | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T23c-302 | T23c | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-T23d-303 | T23d | 讲解段落 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./_shared |
| FT-103-01-v2-304 | 103-01-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./LibraryClips |
| FT-103-03-v2-305 | 103-03-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./LibraryClips |
| FT-107-01-v2-306 | 107-01-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./LibraryClips |
| FT-109-05-v2-307 | 109-05-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./SelectedComponents |
| FT-E14-v2-308 | E14-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./Comparison, ./UI |
| FT-L81-B009-v2-309 | L81-B009-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B009.json, ../../../specs/B011.json, ../../../specs |
| FT-L81-B014-v2-310 | L81-B014-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B006.json, ../../../specs/B014.json, ./clean-assets |
| FT-L81-B018-v2-311 | L81-B018-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./RebuiltBRepresentatives |
| FT-L81-B020-v2-312 | L81-B020-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./RebuiltBFinalFour |
| FT-L81-B035-v2-313 | L81-B035-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B035.json, ./InterfacesB035 |
| FT-L81-B042-v2-314 | L81-B042-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./RebuiltB035, ./RebuiltB042, ./RebuiltB062, ./RebuiltB063, ./RebuiltB064, ./RebuiltB065 |
| FT-L81-B066-v2-315 | L81-B066-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./RebuiltB035, ./RebuiltB042, ./RebuiltB062, ./RebuiltB063, ./RebuiltB064, ./RebuiltB065 |
| FT-L81-B074-v2-316 | L81-B074-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B026.json, ../../../specs/B074.json, ./clean-assets |
| FT-L81-C002-v2-317 | L81-C002-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/C001.json, ../../../../specs/C002.json, ../../../../specs/C003.json, ../../. |
| FT-L81-R001-v2-318 | L81-R001-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R001.json |
| FT-L81-R005-v2-319 | L81-R005-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R005.json |
| FT-L81-R006-v2-320 | L81-R006-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R006.json, ./common |
| FT-L81-R028-v2-321 | L81-R028-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./BatchA, ./BatchB, ./BatchC, ./Clip026, ./Clip036, ./Clip038 |
| FT-L81-R033-v2-322 | L81-R033-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./BatchA, ./BatchB, ./BatchC, ./Clip026, ./Clip036, ./Clip038 |
| FT-N006-v2-323 | N006-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./clip, ./patch-content |
| FT-N008-v2-324 | N008-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchA, ./BatchB, ./BatchC, ./RebuiltX017, ./fonts |
| FT-N044-v2-325 | N044-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration- |
| FT-N045-v2-326 | N045-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration- |
| FT-N047-v2-327 | N047-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-R011-v2-328 | R011-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./Seedance, ./Trae, ./common |
| FT-R017-v2-329 | R017-v2 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../public/shared/videos.json |
| FT-SP011-v2-330 | SP011-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../compositions.json, ../material-policy, ./fred-scene, ./quick-drafts, ./remaining, ./sp002-0 |
| FT-V037-v2-331 | V037-v2 | 讲解段落 | 3/3 | - | standalone-module | - | - |  |
| FT-X014-v2-332 | X014-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004, ./RebuiltN005 |
| FT-X015-v2-333 | X015-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ../material-policy, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004 |
| FT-X032-v2-334 | X032-v2 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchA, ./BatchB, ./BatchC, ./RebuiltX017, ./fonts |
| FT-X037-v2-335 | X037-v2 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-T12k-336 | T12k | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12l-337 | T12l | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12m-338 | T12m | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12n-339 | T12n | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12o-340 | T12o | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12p-341 | T12p | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12q-342 | T12q | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12r-343 | T12r | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12s-344 | T12s | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T12t-345 | T12t | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20h-346 | T20h | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20i-347 | T20i | 录屏与视频入场 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20j-348 | T20j | 讲解段落 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20k-349 | T20k | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20l-350 | T20l | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20m-351 | T20m | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20n-352 | T20n | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20o-353 | T20o | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20p-354 | T20p | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T20q-355 | T20q | 内容交接 | 5/5 | yes | kit-overlay | - | - |  |
| FT-T08i-356 | T08i | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T10a-357 | T10a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T08e-358 | T08e | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T21b-359 | T21b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T02g-360 | T02g | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12h-361 | T12h | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12i-362 | T12i | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09i-363 | T09i | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T18d-364 | T18d | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T04e-365 | T04e | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05h-366 | T05h | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05i-367 | T05i | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09j-368 | T09j | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T04f-369 | T04f | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09k-370 | T09k | 录屏聚焦 | 4/4 | yes | blocked-dependency | - | - | local imports unresolved: ./style.css |
| FT-T02h-371 | T02h | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T17c-372 | T17c | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09l-373 | T09l | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09n-374 | T09n | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09m-375 | T09m | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15e-376 | T15e | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15f-377 | T15f | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T14e-378 | T14e | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T14f-379 | T14f | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15g-380 | T15g | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15h-381 | T15h | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15i-382 | T15i | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T16a-383 | T16a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T16b-384 | T16b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T18f-385 | T18f | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T22a-386 | T22a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T22b-387 | T22b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T18e-388 | T18e | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T13a-389 | T13a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T13b-390 | T13b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T13c-391 | T13c | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T13d-392 | T13d | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T04g-393 | T04g | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09o-394 | T09o | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T20f-395 | T20f | 录屏与视频入场 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T01h-396 | T01h | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T21d-397 | T21d | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05b2-398 | T05b2 | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09e-399 | T09e | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T14b-400 | T14b | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15b-401 | T15b | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T18b-402 | T18b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T14a2-403 | T14a2 | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09d2-404 | T09d2 | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T20a2-405 | T20a2 | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05g-406 | T05g | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12d-407 | T12d | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12e-408 | T12e | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T01f-409 | T01f | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T01e-410 | T01e | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T01g-411 | T01g | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T02e-412 | T02e | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T02f-413 | T02f | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T03e-414 | T03e | 讲解段落 | 4/4 | yes | kit-overlay | yes | yes |  |
| FT-T04d-415 | T04d | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T03c-416 | T03c | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T11c-417 | T11c | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T11d-418 | T11d | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05f-419 | T05f | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T20d-420 | T20d | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09c-421 | T09c | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09g-422 | T09g | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09b-423 | T09b | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09f-424 | T09f | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T14d-425 | T14d | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15a-426 | T15a | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T15d-427 | T15d | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12b-428 | T12b | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12c-429 | T12c | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12g-430 | T12g | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T01b-431 | T01b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T01c-432 | T01c | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T06b-433 | T06b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T04b-434 | T04b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T03d-435 | T03d | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05a-436 | T05a | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05e-437 | T05e | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T20c-438 | T20c | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T20b-439 | T20b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T21a-440 | T21a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T18c-441 | T18c | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T19c-442 | T19c | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T08b-443 | T08b | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T08d-444 | T08d | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09a-445 | T09a | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05c-446 | T05c | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T05d-447 | T05d | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T12a-448 | T12a | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T02a-449 | T02a | 内容交接 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T14c-450 | T14c | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T01d-451 | T01d | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T04a-452 | T04a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T17b-453 | T17b | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T17a-454 | T17a | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T18a-455 | T18a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T19a-456 | T19a | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
| FT-NMC01-457 | NMC01 | 讲解段落 | 4/4 | - | standalone | - | - |  |
| FT-CAM01-458 | CAM01 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./GroupAccents, ./RaisedInput |
| FT-CAM02-459 | CAM02 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./GroupAccents, ./RaisedInput |
| FT-CAM03-460 | CAM03 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./GroupAccents, ./RaisedInput |
| FT-CAM04-461 | CAM04 | 录屏聚焦 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ./components/FullscreenVideoWindow |
| FT-CAM05-462 | CAM05 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./GroupAccents, ./RaisedInput |
| FT-INT01-463 | INT01 | 录屏聚焦 | 2/2 | - | standalone | - | - |  |
| FT-INT02-464 | INT02 | 录屏聚焦 | 2/2 | - | standalone | - | - |  |
| FT-INT03-465 | INT03 | 内容交接 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ./components/FullscreenVideoWindow |
| FT-INT04-466 | INT04 | 内容交接 | 2/2 | - | standalone | - | - |  |
| FT-OP03-467 | OP03 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./NovelScenes, ./assets.json, ./fullscreen-video-window-geometry |
| FT-OP09-468 | OP09 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./NovelScenes, ./assets.json, ./fullscreen-video-window-geometry |
| FT-OP10-469 | OP10 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./ExplainScenes, ./FullscreenVideoWindow, ./OpeningScenes, ./assets.json, ./fullscreen-video-w |
| FT-RC01-470 | RC01 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./assets.json |
| FT-RC02-471 | RC02 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./assets.json |
| FT-RC04-472 | RC04 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./assets.json |
| FT-HD02-473 | HD02 | 内容交接 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./assets.json |
| FT-HD03-474 | HD03 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./assets.json |
| FT-109-01-475 | 109-01 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../../shared/fullscreen-video-window-geometry, ./ElasticClickVideo, ./scene-data.json, ./versi |
| FT-109-02-476 | 109-02 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../shared/FullscreenVideoWindow, ./entry-private/B009-prompt-motion.json, ./entry-private/N054 |
| FT-109-03-477 | 109-03 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../shared/FullscreenVideoWindow, ../shared/fullscreen-video-window-geometry, ./scene-data.json |
| FT-109-04-478 | 109-04 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../shared/FullscreenVideoWindow, ./N027, ./RevisionEntry, ./RevisionEvidence, ./scene-data.jso |
| FT-109-06-479 | 109-06 | 内容交接 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../shared/FullscreenVideoWindow, ../shared/fullscreen-video-window-geometry, ./scene-data.json |
| FT-102-01-480 | 102-01 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../common, ../native/L81-B027.json, ./IncomingAdapter, ./component-specs.json, ./versions/asse |
| FT-102-02-481 | 102-02 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../common, ../install-account-roi-v7.json, ./IncomingAdapter, ./component-specs.json, ./versio |
| FT-102-03-482 | 102-03 | 内容交接 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../common, ../install-account-roi-v7.json, ./IncomingAdapter, ./component-specs.json, ./versio |
| FT-102-04-483 | 102-04 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../common, ../install-account-roi-v7.json, ./IncomingAdapter, ./component-specs.json, ./versio |
| FT-102-05-484 | 102-05 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../common, ./AssetsReferenceV8, ./IncomingAdapter, ./MediaRevisionV7, ./component-specs.json,  |
| FT-102-06-485 | 102-06 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../common, ../library/voice-v11/B036CostV11, ../library/voice-v11/R052AudioCandidatesV11, ../l |
| FT-102-07-486 | 102-07 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../common, ./IncomingAdapter, ./component-specs.json, ./versions/assets-simple-v3/adapters/Ass |
| FT-N043-487 | N043 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-E08-488 | E08 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./UI, ./approved/branch-scenes |
| FT-107-03-489 | 107-03 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./SemanticMotion, ./library/SelectedMotion, ./specs/R004.json, ./specs/R005.json, ./specs/r4-t |
| FT-SP014-490 | SP014 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../surface-purple.ts, ./sp014-extra-native.json |
| FT-C035-491 | C035 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../five-fonts.ts |
| FT-N002-492 | N002 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./index |
| FT-N003-493 | N003 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004, ./RebuiltN005 |
| FT-N004-494 | N004 | 录屏与视频入场 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ../material-policy, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004 |
| FT-N007-495 | N007 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004, ./RebuiltN005 |
| FT-N010-496 | N010 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-N026-497 | N026 | 内容交接 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-N030-498 | N030 | 讲解段落 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/ChalkBoard, ./calibrati |
| FT-N037-499 | N037 | 内容交接 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchA, ./BatchB, ./BatchC, ./RebuiltX017, ./fonts |
| FT-X002-500 | X002 | 录屏与视频入场 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ../material-policy, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004 |
| FT-X010-501 | X010 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004, ./RebuiltN005 |
| FT-X023-502 | X023 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./x-native-b.json |
| FT-X040-503 | X040 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/ChalkBoard, ./calibrati |
| FT-X043-504 | X043 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/ChalkBoard, ./calibrati |
| FT-99-05-505 | 99-05 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./Chapter, ./timing |
| FT-107-02-506 | 107-02 | 内容交接 | 12/14 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./R4Media, ./R4Replacements, ./SemanticMotion, ./library/SelectedMotion |
| FT-107-05-507 | 107-05 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./SemanticMotion, ./library/SelectedMotion |
| FT-SP013-508 | SP013 | 录屏聚焦 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../public/code-revision/SP006-track.json, ../public/code-revision/SP010-ui.json, ../public/cod |
| FT-SP022-509 | SP022 | 录屏与视频入场 | 39/41 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../public/code-revision/SP006-track.json, ../public/code-revision/SP010-ui |
| FT-L81-B002-510 | L81-B002 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B002.json, ../../../surface |
| FT-L81-B019-511 | L81-B019 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B009.json, ../../../specs/B011.json, ../../../specs |
| FT-L81-B044-512 | L81-B044 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B044.json, ../../../specs/B046.json, ./B044Media, . |
| FT-L81-B070-513 | L81-B070 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B038.json, ../../../specs/B070.json, ./clean-assets |
| FT-L81-B072-514 | L81-B072 | 图片与作品 | 5/5 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy |
| FT-L81-C001-515 | L81-C001 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/C001.json, ../../../../surface-purple.ts, ./RebuiltGrid |
| FT-L81-C005-516 | L81-C005 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/C005.json, ../../../../surface-purple.ts, ./RebuiltGrid |
| FT-L81-R036-517 | L81-R036 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R036.json, ./Media, ./ReferenceInterfaces, ./ |
| FT-L81-R038-518 | L81-R038 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./BatchA, ./BatchB, ./BatchC, ./Clip026, ./Clip036, ./Clip038 |
| FT-L81-R041-519 | L81-R041 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R033.json, ../../../../specs/R041.json, ../.. |
| FT-L81-R044-520 | L81-R044 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./BatchA, ./BatchB, ./BatchC, ./Clip026, ./Clip036, ./Clip038 |
| FT-L81-R045-521 | L81-R045 | 图片与作品 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R033.json, ../../../../specs/R041.json, ../.. |
| FT-L81-R052-522 | L81-R052 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R051.json, ./Media, ./ReferenceInterfaces, ./ |
| FT-L81-T05-523 | L81-T05 | 内容交接 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/C001.json, ../../../../specs/C002.json, ../../../../specs/C003.json, ../../. |
| FT-L81-T08-524 | L81-T08 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/T08.json, ../../../../specs/W05.json, ./RebuiltGrid, ./RebuiltW05 |
| FT-L81-W01-525 | L81-W01 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/W01.json, ../../../../surface-purple.ts, ./RebuiltGrid |
| FT-109-05-526 | 109-05 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./scene-data.json, ./variety-native/X006.json, ./variety-native/sp021-extra-native.json, ./var |
| FT-N006-527 | N006 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index |
| FT-N008-528 | N008 | 图片与作品 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/N008.json |
| FT-N044-529 | N044 | 讲解段落 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration- |
| FT-N045-530 | N045 | 图片与作品 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration- |
| FT-N047-531 | N047 | 录屏与视频入场 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-X014-532 | X014 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/X014.json |
| FT-X015-533 | X015 | 图片与作品 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ../material-policy, ./BatchB, ./BatchC, ./RebuiltN003, ./RebuiltN004 |
| FT-X032-534 | X032 | 讲解段落 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-X037-535 | X037 | 图片与作品 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-E14-536 | E14 | 图片与作品 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./UI |
| FT-103-01-537 | 103-01 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./N002, ./SceneTiming, ./Segment6, ./approved/branch-scenes, ./reference/B070.json, ./referenc |
| FT-103-03-538 | 103-03 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../surface-purple.ts, ./reference/N054-motion.json, ./reference/x-native-b |
| FT-107-01-539 | 107-01 | 内容交接 | 10/12 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./R4Media, ./R4Replacements, ./SemanticMotion |
| FT-SP011-540 | SP011 | 讲解段落 | 12/14 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy |
| FT-L81-B009-541 | L81-B009 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B009.json, ../../../specs/B |
| FT-L81-B014-542 | L81-B014 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B006.json, ../../../specs/B |
| FT-L81-B018-543 | L81-B018 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B009.json, ../../../specs/B |
| FT-L81-B020-544 | L81-B020 | 图片与作品 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B008.json, ../../../specs/B |
| FT-L81-B035-545 | L81-B035 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B035.json, ./InterfacesB035 |
| FT-L81-B042-546 | L81-B042 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../specs/B042.json |
| FT-L81-B062-547 | L81-B062 | 数值与图表 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B062.json |
| FT-L81-B066-548 | L81-B066 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B066.json, ./SmoothLoopVideo |
| FT-L81-B074-549 | L81-B074 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B026.json, ../../../specs/B074.json, ./clean-assets |
| FT-L81-B075-550 | L81-B075 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B069.json, ../../../specs/B075.json, ../../../surfa |
| FT-L81-C002-551 | L81-C002 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../specs/C002.json, ../../../../surface-purple.ts |
| FT-L81-R001-552 | L81-R001 | 内容交接 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R001.json |
| FT-L81-R004-553 | L81-R004 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R004.json, ./Seeda |
| FT-L81-R005-554 | L81-R005 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R005.json |
| FT-L81-R006-555 | L81-R006 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R006.json, ../../. |
| FT-L81-R028-556 | L81-R028 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./BatchA, ./BatchB, ./BatchC, ./Clip026, ./Clip036, ./Clip038 |
| FT-L81-R033-557 | L81-R033 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../../../../material-policy, ../../../../runtime/clip-spec, ../../../../specs/R033.json, ../.. |
| FT-C008-558 | C008 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ./shared |
| FT-C017-559 | C017 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../shared, ../v11/V11Shared, ./types |
| FT-V064-560 | V064 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../dependencies/Snapcn/registry/snap-cn-ui/core/index.ts, ../dependencies/Snapcn/registry/snap |
| FT-V097-561 | V097 | 录屏聚焦 | 1/1 | - | standalone | - | - |  |
| FT-N014-562 | N014 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-N016-563 | N016 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-N018-564 | N018 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-N025-565 | N025 | 录屏与视频入场 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-N031-566 | N031 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/ChalkBoard, ./calibrati |
| FT-N046-567 | N046 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration- |
| FT-N049-568 | N049 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/ChalkBoard, ./calibrati |
| FT-X008-569 | X008 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/X008.json |
| FT-X009-570 | X009 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/X009.json |
| FT-X017-571 | X017 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./BatchA, ./BatchB, ./BatchC, ./RebuiltX017, ./fonts |
| FT-X029-572 | X029 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./x-native-b.json |
| FT-E02-573 | E02 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./Repairs, ./UI |
| FT-E13-574 | E13 | 录屏与视频入场 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ./UI |
| FT-E15-575 | E15 | 录屏与视频入场 | 5/5 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ../material-policy |
| FT-99-09-576 | 99-09 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./carriers |
| FT-99-13-577 | 99-13 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./DecisionFlow, ./S15TaskSelection |
| FT-99-21-578 | 99-21 | 讲解段落 | 1/1 | - | standalone | - | - |  |
| FT-103-02-579 | 103-02 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./reference/N054-motion.json, ./reference/x-native-b.json, ./visuals |
| FT-SP003-580 | SP003 | 图片与作品 | 12/14 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy |
| FT-SP006-581 | SP006 | 录屏聚焦 | 39/41 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../public/code-revision/SP006-track.json, ../public/code-revision/SP010-ui |
| FT-SP007-582 | SP007 | 数值与图表 | 13/15 | - | standalone-module | - | - |  |
| FT-SP009-583 | SP009 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../surface-purple.ts, ./sp017-extra-native.json |
| FT-SP019-584 | SP019 | 讲解段落 | 12/14 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy |
| FT-L81-B006-585 | L81-B006 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B006.json, ../../../specs/B |
| FT-L81-B007-586 | L81-B007 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B007.json, ../../../specs/B |
| FT-L81-B008-587 | L81-B008 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B008.json, ../../../specs/B |
| FT-L81-B016-588 | L81-B016 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B007.json, ../../../specs/B |
| FT-L81-B027-589 | L81-B027 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B027.json, ./SmoothLoopVide |
| FT-L81-B038-590 | L81-B038 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B038.json, ../../../specs/B |
| FT-L81-B069-591 | L81-B069 | 数值与图表 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B069.json, ../../../specs/B075.json, ./clean-assets |
| FT-L81-R002-592 | L81-R002 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R003.json, ./Seeda |
| FT-L81-R003-593 | L81-R003 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R003.json, ./Seeda |
| FT-L81-R017-594 | L81-R017 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R015.json, ../../../../specs/R016.json, ../.. |
| FT-L81-R026-595 | L81-R026 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R026.json, ../../. |
| FT-L81-R042-596 | L81-R042 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R033.json, ../../../../specs/R041.json, ../.. |
| FT-L81-T02-597 | L81-T02 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/T02.json, ../../../../surface-purple.ts, ./RebuiltGrid |
| FT-L81-T09-598 | L81-T09 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/T09.json, ./RebuiltGrid |
| FT-L81-W04-599 | L81-W04 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/W04.json, ./RebuiltGrid |
| FT-L81-T10-600 | L81-T10 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/T10.json, ./RebuiltGrid |
| FT-L81-W05-601 | L81-W05 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/W05.json, ../../../../surface-purple.ts, ./RebuiltGrid, ./RebuiltT07 |
| FT-SP017-602 | SP017 | 讲解段落 | 10/12 | - | standalone-module | - | - |  |
| FT-99-20-603 | 99-20 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy |
| FT-C013-604 | C013 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../../production/v7/manifest.json, ../v7/V7Sample, ../v7/types, ./V8DevicesMedia, ./V8Editoria |
| FT-L81-B011-605 | L81-B011 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B009.json, ../../../specs/B |
| FT-L81-B026-606 | L81-B026 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B026.json, ../../../specs/B |
| FT-L81-R051-607 | L81-R051 | 图片与作品 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R051.json, ./Media, ./useSourceHan |
| FT-N032-608 | N032 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/N032.json |
| FT-SP001-609 | SP001 | 图片与作品 | 12/14 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy |
| FT-SP012-610 | SP012 | 讲解段落 | 41/43 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../public/code-revision/SP006-track.json, ../public/code-revision/SP010-ui |
| FT-SP018-611 | SP018 | 讲解段落 | 39/41 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../public/code-revision/SP006-track.json, ../public/code-revision/SP010-ui |
| FT-X022-612 | X022 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./x-native-b.json |
| FT-X027-613 | X027 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-X039-614 | X039 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/ChalkBoard, ./calibrati |
| FT-X050-615 | X050 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../five-fonts.ts |
| FT-L81-R007-616 | L81-R007 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/R002.json, ../manifest.json, ./Seedance, ./Trae, ./common |
| FT-L81-R015-617 | L81-R015 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R015.json, ../../. |
| FT-SP023-618 | SP023 | 讲解段落 | 11/13 | - | standalone-module | - | - |  |
| FT-L81-B036-619 | L81-B036 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./FredMotion |
| FT-L81-B063-620 | L81-B063 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B063.json, ./InterfaceB063 |
| FT-X024-621 | X024 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./x-native-b.json |
| FT-L81-R024-622 | L81-R024 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R015.json, ../../../../specs/R016.json, ../.. |
| FT-L81-R025-623 | L81-R025 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./BatchA, ./BatchB, ./BatchC, ./Clip026, ./Clip036, ./Clip038 |
| FT-RC03-624 | RC03 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./assets.json |
| FT-SP008-625 | SP008 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../surface-purple.ts, ./sp008-carrier-motion.json |
| FT-C009-626 | C009 | 讲解段落 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ./shared |
| FT-EX08-627 | EX08 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./NovelScenes, ./assets.json |
| FT-L81-B041-628 | L81-B041 | 图片与作品 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B008.json, ../../../specs/B020.json, ../../../specs |
| FT-L81-B046-629 | L81-B046 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B044.json, ../../../specs/B046.json, ./B044Media, . |
| FT-L81-C004-630 | L81-C004 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/C004.json, ../../../../surface-purple.ts, ./RebuiltGrid |
| FT-L81-C007-631 | L81-C007 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/C007.json, ../../../../surface-purple.ts, ./RebuiltC006, ./RebuiltGrid, ./c0 |
| FT-L81-R009-632 | L81-R009 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R009.json, ./AppScreens009 |
| FT-L81-R014-633 | L81-R014 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R015.json, ../../../../specs/R016.json, ../.. |
| FT-OP02-634 | OP02 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./NovelScenes, ./assets.json, ./fullscreen-video-window-geometry |
| FT-OP05-635 | OP05 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./NovelScenes, ./assets.json, ./fullscreen-video-window-geometry |
| FT-RC05-636 | RC05 | 录屏聚焦 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./FullscreenVideoWindow, ./assets.json |
| FT-SP010-637 | SP010 | 录屏聚焦 | 39/41 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../public/code-revision/SP006-track.json, ../public/code-revision/SP010-ui |
| FT-SP024-638 | SP024 | 讲解段落 | 11/13 | - | standalone-module | - | - |  |
| FT-L81-R008-639 | L81-R008 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R008.json |
| FT-L81-R027-640 | L81-R027 | 图片与作品 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./BatchA, ./BatchB, ./BatchC, ./Clip026, ./Clip036, ./Clip038 |
| FT-SP016-641 | SP016 | 录屏与视频入场 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ../surface-purple.ts |
| FT-EX05-642 | EX05 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./ExplainScenes, ./FullscreenVideoWindow, ./OpeningScenes, ./assets.json, ./fullscreen-video-w |
| FT-L81-B059-643 | L81-B059 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B008.json, ../../../specs/B020.json, ../../../specs |
| FT-L81-T06-644 | L81-T06 | 录屏聚焦 | 2/2 | - | blocked-dependency | - | - | local imports unresolved: ../manifest.json, ./batch1, ./batch2, ./batch3, ./fonts |
| FT-N005-645 | N005 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/N005.json |
| FT-N011-646 | N011 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-N040-647 | N040 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-SP020-648 | SP020 | 讲解段落 | 12/14 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy |
| FT-V072-649 | V072 | 讲解段落 | 1/1 | - | standalone | - | - |  |
| FT-V086-650 | V086 | 录屏聚焦 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./Root, ./TalkRoot |
| FT-V087-651 | V087 | 录屏聚焦 | 1/1 | - | standalone | - | - |  |
| FT-X025-652 | X025 | 讲解段落 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration-b.json |
| FT-T14a-653 | T14a | 数值与图表 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T09d-654 | T09d | 录屏聚焦 | 4/4 | yes | kit-overlay | - | - |  |
| FT-T20a-655 | T20a | 图片与作品 | 4/4 | yes | kit-overlay | - | - |  |
| FT-L81-B065-656 | L81-B065 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../runtime/clip-spec, ../../../specs/B065.json |
| FT-L81-R053-657 | L81-R053 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../runtime/clip-spec, ../../../../specs/R053.json, ../../../../surface-purple.ts, ./u |
| FT-C034-658 | C034 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../five-fonts.ts |
| FT-L81-T03-659 | L81-T03 | 内容交接 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/T03.json, ../../../../surface-purple.ts, ./RebuiltGrid |
| FT-X003-660 | X003 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/X003.json |
| FT-X019-661 | X019 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ./x-native-b.json |
| FT-107-04-662 | 107-04 | 讲解段落 | 3/3 | - | blocked-dependency | - | - | local imports unresolved: ./ReviewReplacements, ./SemanticMotion, ./library/SelectedMotion, ./specs/C005.json |
| FT-X006-663 | X006 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../surface-purple.ts, ./index, ./timelines/X006.json |
| FT-N027-664 | N027 | 讲解段落 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/Cha |
| FT-L81-C003-665 | L81-C003 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../specs/C003.json, ../../../../surface-purple.ts, ./RebuiltGrid |
| FT-L81-B064-666 | L81-B064 | 讲解段落 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../five-fonts.ts, ../../../specs/B064.json, ../public/rebuilt-b064/arrow-paths.json, ../ |
| FT-X020-667 | X020 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ./x-native-b.json |
| FT-L81-R016-668 | L81-R016 | 录屏与视频入场 | 1/1 | - | blocked-dependency | - | - | local imports unresolved: ../../../../five-fonts.ts, ../../../../runtime/clip-spec, ../../../../specs/R015.json, ../../. |
| FT-L81-B024-669 | L81-B024 | 录屏与视频入场 | 4/4 | - | blocked-dependency | - | - | local imports unresolved: ../../../runtime/clip-spec, ../../../specs/B007.json, ../../../specs/B016.json, ../../../specs |
| FT-N038-670 | N038 | 图片与作品 | 6/6 | - | blocked-dependency | - | - | local imports unresolved: ../material-policy, ./MediaScenesB, ./RemainingB, ./RootTextScenes, ./XScenesB, ./calibration- |
| FT-T05b-671 | T05b | 讲解段落 | 4/4 | yes | kit-overlay | - | - |  |
