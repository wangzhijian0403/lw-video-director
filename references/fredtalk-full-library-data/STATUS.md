# LW-FT-FULL-001 · FredTalk 全库逐条状态清单（Stage A1）

> 由 `tools/fredtalk/full_library_status.py` 从本地证据文件合并生成。
> **机器 QA 与人工视觉验收严格分列**；机器 pass 不推断视觉 pass。
> 所有通过项均需真实 MP4 证据；本表不把未审片条目记为通过。

## 1. 汇总

| 指标 | 数量 |
| --- | --- |
| 目录条目（唯一 ID，已去重） | 432 |
| 重复 ID | 0 |
| 已适配（adapted/registry） | 134 |
| 工作台可调用（executable/inRegistry） | 134 |
| 真实渲染 pass | 134 |
| 机器 QA pass | 115 |
| 人工视觉 pass | 131 |
| 人工视觉 conditional | 0 |
| 人工视觉 rework | 0 |
| 人工视觉 pending（未审片） | 301 |
| 具备可编辑参数 | 142 |
| 源码 SHA 全部校验通过 | 258 |

## 2. 验收分层（tier）

| tier | 数量 | 含义 |
| --- | --- | --- |
| blocked-dependency | 282 | 依赖文件缺失，当前无法自动适配 |
| production-ready | 101 | 适配+渲染+机器QA+人工视觉+工作台导出+可执行 全通过 |
| rendered-qa-not-pass | 19 | 已真实渲染 MP4，但机器 QA 为 not-tested 或 fail（须人工复核，不得当作已验收） |
| candidate-not-adapted | 16 | kit-overlay/standalone 候选，尚未适配 |
| visual-accepted | 12 | 适配+渲染+机器QA+人工视觉通过（工作台导出未验证） |
| machine-qa-only | 2 | 仅机器 QA 通过，人工视觉 pending/conditional/rework |

## 3. 适配策略分布

| 策略 | 数量 |
| --- | --- |
| blocked-dependency | 284 |
| kit-overlay | 135 |
| standalone | 8 |
| standalone-module | 5 |

## 4. 类别分布

| 类别 | 数量 |
| --- | --- |
| 讲解段落 | 234 |
| 内容交接 | 54 |
| 录屏聚焦 | 43 |
| 录屏与视频入场 | 42 |
| 图片与作品 | 40 |
| 数值与图表 | 19 |

## 5. 阻塞原因 Top（blocked-dependency）

按缺失依赖的归一化前缀聚合，用于逐类修复排期。

| 缺失依赖签名 | 条目数 |
| --- | --- |
| ./_shared | 9 |
| ./MediaScenesB, ./RemainingB, ./RootTextScenes … | 9 |
| ../material-policy, ./X050TypographyRepair, ./calibration-c/AskAiHomepage … | 8 |
| ./BatchA, ./BatchB, ./BatchC … | 7 |
| ./FullscreenVideoWindow, ./assets.json | 7 |
| ../material-policy | 7 |
| ../components/episode-kit/chap, ../components/episode-kit/ep, ../components/episode-kit/g4 … | 6 |
| ../material-policy, ./MediaScenesB, ./RemainingB … | 6 |
| ./X050TypographyRepair, ./calibration-c/AskAiHomepage, ./calibration-c/ChalkBoard … | 6 |
| ./x-native-b.json | 6 |
| ../components/chap, ../components/ep, ../components/g4 … | 5 |
| ../material-policy, ../public/code-revision/SP006-track.json, ../public/code-revision/SP010-ui.json … | 5 |
| ../components/ep, ../lib/shell, ./ep | 4 |
| ../manifest.json, ./BatchA, ./BatchB … | 4 |
| ../manifest.json, ./BatchB, ./BatchC … | 4 |
| ../manifest.json, ../material-policy, ./BatchB … | 4 |
| ./GroupAccents, ./RaisedInput | 4 |
| ./FullscreenVideoWindow, ./NovelScenes, ./assets.json … | 4 |
| ../components/g4 | 3 |
| ./LibraryClips | 3 |

## 6. 逐条状态（432 条）

| LW ID | 类别 | 策略 | 源码 | 参数 | 适配 | 渲染 | 机器QA | 人工视觉 | 工作台 | tier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FT-T01j-240 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T02k-241 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T02l-242 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T02m-243 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T03g-244 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T03h-245 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T03i-246 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T03j-247 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T04j-248 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T04k-249 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T05q-250 | 讲解段落 | kit-overlay | 3/3 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-T05r-251 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T08k-252 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T08n-253 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T08o-254 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T08p-255 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T10i-256 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T10j-257 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T10k-258 | 讲解段落 | blocked-dependency | 5/5 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T11n-259 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T11o-260 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T11p-261 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T13g-262 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T13h-263 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T14k-264 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T14l-265 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T14m-266 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T14n-267 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T15p-268 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T16f-269 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T16g-270 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T17h-271 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T17i-272 | 讲解段落 | kit-overlay | 4/4 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-T17j-273 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T17k-274 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T18j-275 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T18k-276 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T20s-277 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T20t-278 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T20u-279 | 讲解段落 | kit-overlay | 4/4 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-T20v-280 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T20w-281 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T20x-282 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T21f-283 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T21g-284 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T22f-285 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T22g-286 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T09q-287 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09r-288 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09s-289 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T09t-290 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09v-291 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09w-292 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09z-293 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T08l-294 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12u-295 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T12v-296 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T12w-297 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T12x-298 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T12z-299 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T23a-300 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T23b-301 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T23c-302 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T23d-303 | 讲解段落 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-103-01-v2-304 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-103-03-v2-305 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-107-01-v2-306 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-109-05-v2-307 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-E14-v2-308 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B009-v2-309 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B014-v2-310 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B018-v2-311 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B020-v2-312 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B035-v2-313 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B042-v2-314 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B066-v2-315 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B074-v2-316 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-C002-v2-317 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R001-v2-318 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R005-v2-319 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R006-v2-320 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R028-v2-321 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R033-v2-322 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N006-v2-323 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N008-v2-324 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N044-v2-325 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N045-v2-326 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N047-v2-327 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-R011-v2-328 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-R017-v2-329 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP011-v2-330 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-V037-v2-331 | 讲解段落 | standalone-module | 3/3 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-X014-v2-332 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X015-v2-333 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X032-v2-334 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X037-v2-335 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T12k-336 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12l-337 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T12m-338 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12n-339 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12o-340 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12p-341 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12q-342 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12r-343 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12s-344 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12t-345 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20h-346 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20i-347 | 录屏与视频入场 | kit-overlay | 5/5 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T20j-348 | 讲解段落 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20k-349 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20l-350 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20m-351 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20n-352 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20o-353 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20p-354 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20q-355 | 内容交接 | kit-overlay | 5/5 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T08i-356 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T10a-357 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T08e-358 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T21b-359 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T02g-360 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12h-361 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12i-362 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09i-363 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T18d-364 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T04e-365 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T05h-366 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T05i-367 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09j-368 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T04f-369 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09k-370 | 录屏聚焦 | blocked-dependency | 4/4 | Y | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T02h-371 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T17c-372 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09l-373 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09n-374 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T09m-375 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T15e-376 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | fail | pass | pass | rendered-qa-not-pass |
| FT-T15f-377 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T14e-378 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T14f-379 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T15g-380 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T15h-381 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T15i-382 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T16a-383 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T16b-384 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T18f-385 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T22a-386 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T22b-387 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T18e-388 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T13a-389 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T13b-390 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T13c-391 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T13d-392 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T04g-393 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09o-394 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20f-395 | 录屏与视频入场 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T01h-396 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T21d-397 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T05b2-398 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T09e-399 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T14b-400 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T15b-401 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T18b-402 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T14a2-403 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09d2-404 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20a2-405 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T05g-406 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12d-407 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T12e-408 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T01f-409 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T01e-410 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T01g-411 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T02e-412 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T02f-413 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T03e-414 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T04d-415 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T03c-416 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T11c-417 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T11d-418 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T05f-419 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T20d-420 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09c-421 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09g-422 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T09b-423 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T09f-424 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T14d-425 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T15a-426 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T15d-427 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T12b-428 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T12c-429 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T12g-430 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T01b-431 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T01c-432 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T06b-433 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T04b-434 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T03d-435 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T05a-436 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-T05e-437 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T20c-438 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20b-439 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T21a-440 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T18c-441 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T19c-442 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T08b-443 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T08d-444 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T09a-445 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T05c-446 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T05d-447 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T12a-448 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pass | pass | rendered-qa-not-pass |
| FT-T02a-449 | 内容交接 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T14c-450 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T01d-451 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T04a-452 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T17b-453 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T17a-454 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T18a-455 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T19a-456 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-NMC01-457 | 讲解段落 | standalone | 4/4 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-CAM01-458 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-CAM02-459 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-CAM03-460 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-CAM04-461 | 录屏聚焦 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-CAM05-462 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-INT01-463 | 录屏聚焦 | standalone | 2/2 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-INT02-464 | 录屏聚焦 | standalone | 2/2 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-INT03-465 | 内容交接 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-INT04-466 | 内容交接 | standalone | 2/2 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-OP03-467 | 录屏与视频入场 | blocked-dependency | 3/3 | - | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-OP09-468 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-OP10-469 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-RC01-470 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-RC02-471 | 录屏聚焦 | blocked-dependency | 3/3 | - | Y | pass | pass | pass | not-tested | visual-accepted |
| FT-RC04-472 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-HD02-473 | 内容交接 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-HD03-474 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-109-01-475 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-109-02-476 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-109-03-477 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-109-04-478 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-109-06-479 | 内容交接 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-102-01-480 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-102-02-481 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-102-03-482 | 内容交接 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-102-04-483 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-102-05-484 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-102-06-485 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-102-07-486 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N043-487 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-E08-488 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-107-03-489 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP014-490 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-C035-491 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N002-492 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N003-493 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N004-494 | 录屏与视频入场 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N007-495 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N010-496 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N026-497 | 内容交接 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N030-498 | 讲解段落 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N037-499 | 内容交接 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X002-500 | 录屏与视频入场 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X010-501 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X023-502 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X040-503 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X043-504 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-99-05-505 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-107-02-506 | 内容交接 | blocked-dependency | 12/14 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-107-05-507 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP013-508 | 录屏聚焦 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP022-509 | 录屏与视频入场 | blocked-dependency | 39/41 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B002-510 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B019-511 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B044-512 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B070-513 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B072-514 | 图片与作品 | blocked-dependency | 5/5 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-C001-515 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-C005-516 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R036-517 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R038-518 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R041-519 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R044-520 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R045-521 | 图片与作品 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R052-522 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-T05-523 | 内容交接 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-T08-524 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-W01-525 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-109-05-526 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N006-527 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N008-528 | 图片与作品 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N044-529 | 讲解段落 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N045-530 | 图片与作品 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N047-531 | 录屏与视频入场 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X014-532 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X015-533 | 图片与作品 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X032-534 | 讲解段落 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X037-535 | 图片与作品 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-E14-536 | 图片与作品 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-103-01-537 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-103-03-538 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-107-01-539 | 内容交接 | blocked-dependency | 10/12 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP011-540 | 讲解段落 | blocked-dependency | 12/14 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B009-541 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B014-542 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B018-543 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B020-544 | 图片与作品 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B035-545 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B042-546 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B062-547 | 数值与图表 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B066-548 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B074-549 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B075-550 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-C002-551 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R001-552 | 内容交接 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R004-553 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R005-554 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R006-555 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R028-556 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R033-557 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-C008-558 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-C017-559 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-V064-560 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-V097-561 | 录屏聚焦 | standalone | 1/1 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-N014-562 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N016-563 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N018-564 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N025-565 | 录屏与视频入场 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N031-566 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N046-567 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N049-568 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X008-569 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X009-570 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X017-571 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X029-572 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-E02-573 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-E13-574 | 录屏与视频入场 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-E15-575 | 录屏与视频入场 | blocked-dependency | 5/5 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-99-09-576 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-99-13-577 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-99-21-578 | 讲解段落 | standalone | 1/1 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-103-02-579 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP003-580 | 图片与作品 | blocked-dependency | 12/14 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP006-581 | 录屏聚焦 | blocked-dependency | 39/41 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP007-582 | 数值与图表 | standalone-module | 13/15 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-SP009-583 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP019-584 | 讲解段落 | blocked-dependency | 12/14 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B006-585 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B007-586 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B008-587 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B016-588 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B027-589 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B038-590 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B069-591 | 数值与图表 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R002-592 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R003-593 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R017-594 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R026-595 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R042-596 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-T02-597 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-T09-598 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-W04-599 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-T10-600 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-W05-601 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP017-602 | 讲解段落 | standalone-module | 10/12 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-99-20-603 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-C013-604 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B011-605 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B026-606 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R051-607 | 图片与作品 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N032-608 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP001-609 | 图片与作品 | blocked-dependency | 12/14 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP012-610 | 讲解段落 | blocked-dependency | 41/43 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP018-611 | 讲解段落 | blocked-dependency | 39/41 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X022-612 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X027-613 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X039-614 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X050-615 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R007-616 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R015-617 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP023-618 | 讲解段落 | standalone-module | 11/13 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-L81-B036-619 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B063-620 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X024-621 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R024-622 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R025-623 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-RC03-624 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP008-625 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-C009-626 | 讲解段落 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-EX08-627 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B041-628 | 图片与作品 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B046-629 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-C004-630 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-C007-631 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R009-632 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R014-633 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-OP02-634 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-OP05-635 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-RC05-636 | 录屏聚焦 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP010-637 | 录屏聚焦 | blocked-dependency | 39/41 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP024-638 | 讲解段落 | standalone-module | 11/13 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-L81-R008-639 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R027-640 | 图片与作品 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP016-641 | 录屏与视频入场 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-EX05-642 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B059-643 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-T06-644 | 录屏聚焦 | blocked-dependency | 2/2 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N005-645 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N011-646 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N040-647 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-SP020-648 | 讲解段落 | blocked-dependency | 12/14 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-V072-649 | 讲解段落 | standalone | 1/1 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-V086-650 | 录屏聚焦 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-V087-651 | 录屏聚焦 | standalone | 1/1 | - | - | not-tested | not-tested | pending | not-tested | candidate-not-adapted |
| FT-X025-652 | 讲解段落 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T14a-653 | 数值与图表 | kit-overlay | 4/4 | Y | Y | pass | pass | pending | not-tested | machine-qa-only |
| FT-T09d-654 | 录屏聚焦 | kit-overlay | 4/4 | Y | Y | pass | pass | pass | pass | production-ready |
| FT-T20a-655 | 图片与作品 | kit-overlay | 4/4 | Y | Y | pass | pass | pending | not-tested | machine-qa-only |
| FT-L81-B065-656 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R053-657 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-C034-658 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-T03-659 | 内容交接 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X003-660 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X019-661 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-107-04-662 | 讲解段落 | blocked-dependency | 3/3 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X006-663 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N027-664 | 讲解段落 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-C003-665 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B064-666 | 讲解段落 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-X020-667 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-R016-668 | 录屏与视频入场 | blocked-dependency | 1/1 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-L81-B024-669 | 录屏与视频入场 | blocked-dependency | 4/4 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-N038-670 | 图片与作品 | blocked-dependency | 6/6 | - | - | not-tested | not-tested | pending | not-tested | blocked-dependency |
| FT-T05b-671 | 讲解段落 | kit-overlay | 4/4 | Y | Y | pass | not-tested | pending | not-tested | rendered-qa-not-pass |
