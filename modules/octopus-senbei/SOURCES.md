# 照片、录像和制作资料来源

核验日期：2026-11-16。虚构网站的“1997”仅是视觉设定，不表示本页资料或摄影摄于该年。

## 工序参照：あさひ本店

来源：[江の島名物「丸焼きたこせんべい」のあさひ本店 — 丸焼きたこせんべいができるまで](https://murasaki-imo.com/flow)

原厂明确说明：整只章鱼 2–3 只；洗净、以酱油为基础调味、裹粉、放入热铁板；上下铁板约 200℃，约 1 吨压制，烤制约 2 分钟。这里的参数是该店公开介绍，不泛化为所有商家的做法。互动只表现一只章鱼并将制作压缩为几秒，属于艺术叙事。

| 用途 | 文件/原始链接 | 处理 |
| --- | --- | --- |
| 裹粉章鱼放上铁板的近景 | [flow-img06.webp](https://murasaki-imo.com/mwp/wp-content/uploads/2024/05/flow-img06.webp) / `press-open.webp` | 裁到模拟制作区、低饱和显示 |
| 制作设备照片 | [flow-img07.webp](https://murasaki-imo.com/mwp/wp-content/uploads/2024/05/flow-img07.webp) / `press-closed.webp` | 旧版背景素材，现交互机器改用太陽製作所开合照片 |
| 成品资料照片 | [flow-img09.webp](https://murasaki-imo.com/mwp/wp-content/uploads/2024/05/flow-img09.webp) / `senbei-real.webp` | 旧版实物照片；现圆饼资料改用永楽堂官方照片 |

来源页面还提供[官方制作影片](https://www.youtube.com/watch?v=WuXhH_DgaLo)。本包不复制此影片。

照片由あさひ本店保留版权，来源标注不意味着开放许可。这里只用于有来源的制作原型与资料展示；若后续公开商业使用，应另行取得相应照片授权或换用自摄素材。此条仅说明已知素材归属，未把这些照片标为可任意商用。

独立交叉来源：[神奈川县观光协会：注文を受けてから高温プレス](https://www.kanagawa-kankou.or.jp/features/317)。该文描述整只章鱼高温压制、薄脆、保留轮廓的江之岛名物。

## 海洋录像与预览图

[Mixkit — School of fish swimming, #4291](https://mixkit.co/free-stock-video/school-of-fish-swimming-4291/)。页面注明 7 秒、30 fps、海洋鱼群；可按 [Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree) 使用。

- 录像请求地址：`https://assets.mixkit.co/videos/4291/4291-360.mp4`
- [预览照片](https://assets.mixkit.co/videos/4291/4291-thumb-360-0.jpg)
- 已缓存真实 H.264 视频 `assets/ocean.mp4`：640 × 360、30 fps、7.433 秒、448,403 字节。循环播放；扫描线与低清显示只属于呈现处理。不是静态照片平移或生成视频。
- 不将这段素材标为日本当地或该工厂拍摄。2026-11-16 已下载并用 ffprobe 核验时长、H.264 编码与尺寸，用 ffmpeg 解码检查鱼群画面。

## 海港横幅

[Enoshima yacht harbour.jpg](https://commons.wikimedia.org/wiki/File:Enoshima_yacht_harbour.jpg)，作者 Babiesan，拍摄日期 2011-01-16，许可 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)。原图已由 Commons 做过裁切。本页面进一步通过 CSS 裁成横幅并降低饱和度；图像改编继续遵守同一许可。没有把该许可扩展到其他来源照片。

[所用分辨率](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Enoshima_yacht_harbour.jpg/960px-Enoshima_yacht_harbour.jpg)

## 章鱼与动画

`assets/octopus.png`：本次为该互动生成的透明摄影风格章鱼，1536 × 1024。

`assets/octopus-sprite.png`：缩至 512 px 宽的运行用 PNG，保留透明通道；通过 CSS 图片渲染、分层遮罩、少量阶梯动画表现爬出和缠绕。无笑脸、服饰或人形身体。它不是现场拍摄的动物记录，也不是食物资料证据。

热压机盖的运动部件、鼠标箭头、蒸汽、桌面图标为界面表现；通过照片、透明素材与 CSS 合成，未实现软体动力学。

## 本地与在线媒体

本版本已把海洋视频、海浪鸟声、海港横幅、真实工序及成品照片缓存至 `assets/`，页面运行无需从第三方站点获取这些媒体。保留本清单和网页中的来源链接。


## 海边环境音

[Mixkit · Sea waves with birds loop #1185](https://mixkit.co/free-sound-effects/sea/)，38 秒海浪与海鸟环境音，页面明确按 [Mixkit Sound Effects Free License](https://mixkit.co/license/#sfxFree) 提供使用。

- 官方下载地址：`https://assets.mixkit.co/active_storage/sfx/1185/1185.wav`
- 运行用文件：`assets/seaside.mp3`；由原 WAV 转为 112 kbps MP3，38.087 秒，533,620 字节。
- 不将该音效标为日本当地实录；其作用是海边氛围。原创合成背景旋律与交互音效属于程序配乐，不冒称现场录音。

## 补充工序照片

以下照片均直接来自同一あさひ本店官方流程页，保留原摄影；代码使用的名称不改变其实际画面内容。

| 本地文件 | 官方原图 | 实际画面 |
| --- | --- | --- |
| `wash-real.webp` | [flow-img02.webp](https://murasaki-imo.com/mwp/wp-content/uploads/2024/05/flow-img02.webp) | 清洗工序 |
| `season-real.webp` | [flow-img04.webp](https://murasaki-imo.com/mwp/wp-content/uploads/2024/05/flow-img04.webp) | 调味工序 |

真实流程依据是“裹粉、再高温压烤”。游戏中的刷面糊、章鱼挣扎或爬出网页属于艺术化互动，不作为商家实际工序记录。贴图/动画素材不用于替代实物照片。

## v2.1：真实机器、面糊、木刷和圆饼

- 圆饼实物：[永楽堂「明石ぺったん焼 真だこ」](https://www.takosen.co.jp/view/item/000000000075)，`assets/senbei-round-eirakudo-detail.jpg`。资料区原照不改动。官方[制作介绍](https://www.takosen.co.jp/view/company)描述明石章鱼、170°C铁板加压薄烤、含奶酪的生地；不沿用あさひ本店的200°C/一吨/两分钟参数。
- 圆饼互动主图：CSS裁出前景完整圆饼并叠加摄影风格章鱼，强化剧情轮廓，标注「写真コラージュ」。这是艺术拼贴，不是新实物证据。官方资料照片在旁边独立展示。
- 压机：[太陽製作所「電化焼き機」](https://www.taiyo-seisakusho.co.jp/products/squid/press-roaster-200v/)。同一产品的真实照片拆为固定底座、背板、盖板内外侧和把手；按铰链运动对盖板照片作连续透视变换，内外表面在翻转侧面时换面，不再切换整张机器照片。设备不是上述两家食品店已核实使用的机型。
  - 开盖：`assets/press-real-open.jpg`，https://www.taiyo-seisakusho.co.jp/wp-content/themes/brew-master/img20190507/press-roaster-200v-002.jpg
  - 合盖：`assets/press-real-closed.jpg`，https://www.taiyo-seisakusho.co.jp/wp-content/themes/brew-master/img20190507/press-roaster-200v-001.jpg
- 面糊：`assets/batter-bowl-debuyer.jpg`，Sous Chef / De Buyer钢盆与黏稠面糊实拍。面糊笔触采样图中流下的面糊纹理，非纯色绘制。只代表通用烘焙面糊，不声称是永楽堂真实配方照片。
- 木刷：`assets/pastry-brush-real.jpg`，Russell Hendrix / Browne产品实拍。按钮及模拟刷子均使用同一照片。
- 道具与圆饼完整来源、原图地址及版权说明：`assets/REAL-PHOTO-SOURCES.md`。这些商业照片未发现开放许可；来源署名不等于授权，现站点保持原有私有访问范围。
