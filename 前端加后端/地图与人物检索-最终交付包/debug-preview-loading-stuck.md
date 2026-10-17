# Debug Session: preview-loading-stuck
- **Status**: [OPEN]
- **progress_status**: collecting
- **Issue**: Trae 预览 WebSocket 已连接，但页面持续显示“加载中”，未呈现 Taro 应用画面。
- **Evidence Source**: HTTP Debug Server / preview process output / browser runtime
- **Evidence Directory**: C:\Users\Elvira\AppData\Local\Temp\trae-debug\map-preview-loading-stuck
- **Debug Server**: pending
- **Log File**: C:\Users\Elvira\AppData\Local\Temp\trae-debug\map-preview-loading-stuck\trae-debug-log-preview-loading-stuck.ndjson

## Reproduction Steps
1. 启动 preview-server.js，项目目录指向当前 Taro 工作区。
2. 打开脚本输出的 trae.mobile.volcapp.com 预览地址。
3. WebSocket 显示 connected，但页面持续显示“加载中”。

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | preview-server 启动参数不符合脚本协议，未识别或构建项目 | High | Low | Pending |
| B | Taro H5 构建未启动或构建失败，服务无首帧页面数据可推送 | High | Low | Pending |
| C | 服务连接成功但发送的消息格式/资源地址无效 | Medium | Medium | Pending |
| D | 浏览器预览容器自身缓存或外部请求异常阻止渲染 | Medium | Low | Pending |

## Log Evidence
Pending.

## Verification Conclusion
Pending.

## Final Evidence Gate
- **Evidence Sources**: pending
- **progress_status**: collecting
- **Hypothesis Conclusions**: A-D pending
