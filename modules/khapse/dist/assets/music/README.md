# 新年一盘卡塞 · 原创配乐

2026-11-17。四段独立、可暂停的配乐；无歌词、无现成曲目采样。

|文件|长度|使用|
|---|---:|---|
|intro.wav|20 秒|准备卡塞的六幕片头|
|game.wav|20 秒循环|较轻的抽取伴奏|
|stable.wav|4.2 秒|八份祝愿的明亮收尾|
|collapsed.wav|4.2 秒|倒塌后的温和收尾|

以扎念琴（Dranyen）式的成对拨弦为主，加入藏胡（Piwang）式的拉弦长音及 Lingbu 笛声的合成音色。轻盈的 6/8 律动、开放五度和原创旋律服务于新年待客的场景。并非传统曲目、仪式音乐或真实乐器演奏录音。

乐器组合参考：Tibetan Institute of Performing Arts — [Nangma Toeshey](https://tipa.asia/ache-lhamo/nangma-toshey/) 与 [Musical Instruments](https://tipa.asia/study-and-training/musical-instruments/)。核对日期 2026-11-17。文献用于了解乐器，不把本作说成某种传统曲式的准确复原。

重建：在项目根目录执行 `node tools/compose-music.mjs`。PCM WAV，24 kHz，16-bit stereo。游戏循环的混响尾音回卷到开头。

进入窗口时音乐默认开启并尝试自动播放；若浏览器限制，首次点击页面或按键时恢复。手动静音后不会被后续点击重新开启。窗口暂停、隐藏、打开说明、关闭时同步暂停或释放。游戏中音量降低，结尾音乐播完停留在静止祝愿画面。一个窗口始终最多一个播放器。
