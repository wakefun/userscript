// ==UserScript==
// @name         Tavily API Key 检测工具
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  批量检测 Tavily API Key 是否可用
// @author       You
// @match        https://linux.do/*
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      api.tavily.com
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 添加样式
    GM_addStyle(`
        .tavily-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .tavily-modal-overlay.minimized {
            width: auto;
            height: auto;
            top: auto;
            bottom: 20px;
            right: 20px;
            left: auto;
            background: transparent;
            pointer-events: none;
        }
        .tavily-modal-overlay.minimized .tavily-modal {
            pointer-events: auto;
        }
        .tavily-modal {
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            width: 600px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tavily-modal-overlay.minimized .tavily-modal {
            width: auto;
            min-width: 200px;
            padding: 0;
            max-height: none;
            overflow: visible;
        }
        .tavily-modal-overlay.minimized .tavily-modal-content {
            display: none;
        }
        .tavily-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            gap: 12px;
        }
        .tavily-modal-overlay.minimized .tavily-modal-header {
            margin-bottom: 0;
            padding: 10px 14px;
            cursor: move;
            justify-content: flex-start;
        }
        .tavily-modal-header h2 {
            margin: 0;
            flex-shrink: 0;
            white-space: nowrap;
        }
        .tavily-header-btns {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
            margin-left: auto;
        }
        .tavily-modal-overlay.minimized .tavily-header-btns {
            margin-left: 0;
        }
        .tavily-icon-btn {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 6px;
            background: #f0f0f0;
            color: #666;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        .tavily-icon-btn:hover {
            background: #e0e0e0;
            color: #333;
        }
        .tavily-mini-status {
            display: none;
            align-items: center;
            font-size: 13px;
            white-space: nowrap;
            color: #555;
            flex-shrink: 0;
            margin-left: 8px;
            padding-left: 12px;
            border-left: 1px solid #ddd;
        }
        .tavily-modal-overlay.minimized .tavily-mini-status {
            display: flex;
        }
        .tavily-modal-overlay.minimized .tavily-modal-header h2 {
            font-size: 14px;
            margin: 0;
        }
        .tavily-modal-overlay.minimized .tavily-header-btns .tavily-minimize-btn {
            display: none;
        }
        .tavily-modal.dragging {
            user-select: none;
        }
        .tavily-modal h2 {
            margin: 0 0 16px 0;
            color: #333;
            font-size: 20px;
        }
        .tavily-modal textarea {
            width: 100%;
            height: 150px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-family: monospace;
            resize: vertical;
            box-sizing: border-box;
        }
        .tavily-modal textarea:focus {
            outline: none;
            border-color: #4a90d9;
        }
        .tavily-btn-group {
            margin-top: 16px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        .tavily-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        .tavily-btn-primary {
            background: #4a90d9;
            color: #fff;
        }
        .tavily-btn-primary:hover {
            background: #3a7bc8;
        }
        .tavily-btn-primary:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .tavily-btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        .tavily-btn-secondary:hover {
            background: #e0e0e0;
        }
        .tavily-results {
            margin-top: 16px;
            border-top: 1px solid #eee;
            padding-top: 16px;
        }
        .tavily-result-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 6px;
            font-family: monospace;
            font-size: 13px;
        }
        .tavily-result-key {
            word-break: break-all;
            flex: 1;
        }
        .tavily-result-valid {
            background: #e6f7e6;
            color: #2d7a2d;
        }
        .tavily-result-invalid {
            background: #fbe9e7;
            color: #c62828;
        }
        .tavily-result-pending {
            background: #fff3e0;
            color: #e65100;
        }
        .tavily-result-icon {
            margin-right: 8px;
            font-size: 16px;
        }
        .tavily-progress {
            margin-top: 12px;
            font-size: 14px;
            color: #666;
        }
        .tavily-summary {
            margin-top: 16px;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 14px;
        }
        .tavily-copy-btn {
            margin-left: 12px;
            padding: 4px 10px;
            font-size: 12px;
            border: none;
            border-radius: 4px;
            background: #4a90d9;
            color: #fff;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .tavily-copy-btn:hover {
            background: #3a7bc8;
        }
        .tavily-copy-btn.copied {
            background: #2d7a2d;
        }
        .tavily-summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f5f5f5;
            border-radius: 8px;
            margin-bottom: 12px;
        }
        .tavily-summary-stats {
            font-size: 14px;
        }
        .tavily-copy-all-btn {
            padding: 8px 16px;
            font-size: 13px;
            border: none;
            border-radius: 6px;
            background: #4a90d9;
            color: #fff;
            cursor: pointer;
            transition: all 0.2s;
        }
        .tavily-copy-all-btn:hover {
            background: #3a7bc8;
        }
        .tavily-copy-all-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .tavily-copy-all-btn.copied {
            background: #2d7a2d;
        }
        .tavily-expand-btn {
            display: none;
        }
        .tavily-modal-overlay.minimized .tavily-expand-btn {
            display: flex;
        }
        .tavily-drag-handle {
            display: none;
            cursor: move;
            color: #bbb;
            font-size: 14px;
            margin-right: 4px;
            line-height: 1;
        }
        .tavily-modal-overlay.minimized .tavily-drag-handle {
            display: flex;
            align-items: center;
        }
    `);

    // 检测单个 API Key
    function checkApiKey(apiKey) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://api.tavily.com/search',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    api_key: apiKey,
                    query: 'test',
                    search_depth: 'basic',
                    max_results: 1
                }),
                onload: function(response) {
                    if (response.status === 200) {
                        resolve({ key: apiKey, valid: true, message: '有效' });
                    } else {
                        let message = '无效';
                        try {
                            const data = JSON.parse(response.responseText);
                            message = data.detail || data.message || '无效';
                        } catch (e) {}
                        resolve({ key: apiKey, valid: false, message });
                    }
                },
                onerror: function(error) {
                    resolve({ key: apiKey, valid: false, message: '请求失败' });
                },
                ontimeout: function() {
                    resolve({ key: apiKey, valid: false, message: '请求超时' });
                },
                timeout: 10000
            });
        });
    }

    // 创建弹窗
    function createModal() {
        const overlay = document.createElement('div');
        overlay.className = 'tavily-modal-overlay';
        overlay.innerHTML = `
            <div class="tavily-modal">
                <div class="tavily-modal-header">
                    <span class="tavily-drag-handle">⋮⋮</span>
                    <h2>🔑 Tavily 检测</h2>
                    <div class="tavily-mini-status">
                        <span id="tavily-mini-progress">等待检测</span>
                    </div>
                    <div class="tavily-header-btns">
                        <button class="tavily-icon-btn tavily-minimize-btn" title="缩小">➖</button>
                        <button class="tavily-icon-btn tavily-expand-btn" title="展开">🔲</button>
                        <button class="tavily-icon-btn tavily-close-header-btn" title="关闭">✕</button>
                    </div>
                </div>
                <div class="tavily-modal-content">
                    <p style="color: #666; margin-bottom: 12px;">请输入要检测的 API Key，每行一个：</p>
                    <textarea id="tavily-keys-input" placeholder="tvly-xxxxxxxxxx&#10;tvly-yyyyyyyyyy&#10;tvly-zzzzzzzzzz"></textarea>
                    <div class="tavily-btn-group">
                        <button class="tavily-btn tavily-btn-secondary" id="tavily-close-btn">关闭</button>
                        <button class="tavily-btn tavily-btn-primary" id="tavily-check-btn">开始检测</button>
                    </div>
                    <div id="tavily-results"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 关闭按钮
        overlay.querySelector('#tavily-close-btn').addEventListener('click', () => {
            overlay.remove();
        });
        overlay.querySelector('.tavily-close-header-btn').addEventListener('click', () => {
            overlay.remove();
        });

        // 缩小按钮
        overlay.querySelector('.tavily-minimize-btn').addEventListener('click', () => {
            overlay.classList.add('minimized');
        });

        // 展开按钮
        overlay.querySelector('.tavily-expand-btn').addEventListener('click', () => {
            overlay.classList.remove('minimized');
            // 重置位置
            overlay.style.bottom = '20px';
            overlay.style.right = '20px';
            overlay.style.top = 'auto';
            overlay.style.left = 'auto';
        });

        // 拖拽功能
        const modal = overlay.querySelector('.tavily-modal');
        const header = overlay.querySelector('.tavily-modal-header');
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener('mousedown', (e) => {
            if (!overlay.classList.contains('minimized')) return;
            if (e.target.closest('.tavily-icon-btn')) return;

            isDragging = true;
            modal.classList.add('dragging');

            const rect = overlay.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;

            // 边界限制
            const rect = overlay.querySelector('.tavily-modal').getBoundingClientRect();
            newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
            newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));

            overlay.style.left = newX + 'px';
            overlay.style.top = newY + 'px';
            overlay.style.right = 'auto';
            overlay.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                modal.classList.remove('dragging');
            }
        });

        // 点击遮罩关闭（仅非缩小状态）
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && !overlay.classList.contains('minimized')) {
                overlay.remove();
            }
        });

        // 检测按钮
        overlay.querySelector('#tavily-check-btn').addEventListener('click', async () => {
            const input = overlay.querySelector('#tavily-keys-input');
            const checkBtn = overlay.querySelector('#tavily-check-btn');
            const resultsDiv = overlay.querySelector('#tavily-results');

            const keys = input.value
                .split('\n')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            if (keys.length === 0) {
                alert('请输入至少一个 API Key');
                return;
            }

            // 禁用按钮
            checkBtn.disabled = true;
            checkBtn.textContent = '检测中...';

            // 显示初始状态（汇总在上方）
            resultsDiv.innerHTML = `
                <div class="tavily-results">
                    <div class="tavily-summary-header">
                        <div class="tavily-summary-stats">
                            <strong>📊 检测中...</strong>&nbsp;&nbsp;
                            进度：<span id="tavily-stat-progress">0/${keys.length}</span> &nbsp;|&nbsp;
                            有效：<span id="tavily-stat-valid" style="color: #2d7a2d;">0 个</span> &nbsp;|&nbsp;
                            无效：<span id="tavily-stat-invalid" style="color: #c62828;">0 个</span>
                        </div>
                        <button class="tavily-copy-all-btn" id="tavily-copy-all" disabled>📋 复制所有可用 Key</button>
                    </div>
                    <div id="tavily-result-list"></div>
                </div>
            `;

            // 单个复制按钮事件委托
            resultsDiv.addEventListener('click', function(e) {
                if (e.target.classList.contains('tavily-copy-btn')) {
                    const key = e.target.getAttribute('data-key');
                    copyToClipboard(key, e.target, '已复制');
                }
            });

            const resultList = resultsDiv.querySelector('#tavily-result-list');
            const statProgress = resultsDiv.querySelector('#tavily-stat-progress');
            const statValid = resultsDiv.querySelector('#tavily-stat-valid');
            const statInvalid = resultsDiv.querySelector('#tavily-stat-invalid');
            const summaryTitle = resultsDiv.querySelector('.tavily-summary-stats strong');
            const copyAllBtn = resultsDiv.querySelector('#tavily-copy-all');
            const miniProgress = overlay.querySelector('#tavily-mini-progress');

            const validKeys = [];
            const invalidKeys = [];

            // 更新统计的辅助函数
            function updateStats(current, total) {
                statProgress.textContent = `${current}/${total}`;
                statValid.textContent = `${validKeys.length} 个`;
                statInvalid.textContent = `${invalidKeys.length} 个`;
                miniProgress.textContent = `${current}/${total} | ✅${validKeys.length} ❌${invalidKeys.length}`;
            }

            // 显示所有待检测的 key
            keys.forEach((key, index) => {
                const item = document.createElement('div');
                item.className = 'tavily-result-item tavily-result-pending';
                item.id = `tavily-key-${index}`;
                item.innerHTML = `<span class="tavily-result-icon">⏳</span><span>${maskKey(key)}</span>`;
                resultList.appendChild(item);
            });

            // 初始化迷你状态
            miniProgress.textContent = `0/${keys.length}`;

            // 逐个检测
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                updateStats(i + 1, keys.length);

                const result = await checkApiKey(key);
                const item = resultList.querySelector(`#tavily-key-${i}`);

                if (result.valid) {
                    validKeys.push(key);
                    item.className = 'tavily-result-item tavily-result-valid';
                    item.innerHTML = `<span class="tavily-result-icon">✅</span><span class="tavily-result-key">${maskKey(key)} - ${result.message}</span><button class="tavily-copy-btn" data-key="${key}">复制</button>`;
                } else {
                    invalidKeys.push({ key, message: result.message });
                    item.className = 'tavily-result-item tavily-result-invalid';
                    item.innerHTML = `<span class="tavily-result-icon">❌</span><span class="tavily-result-key">${maskKey(key)} - ${result.message}</span>`;
                }

                // 实时更新统计
                updateStats(i + 1, keys.length);

                // 添加短暂延迟，避免请求过快
                if (i < keys.length - 1) {
                    await new Promise(r => setTimeout(r, 300));
                }
            }

            // 检测完成，更新状态
            summaryTitle.textContent = '📊 检测完成';
            miniProgress.textContent = `完成 | ✅${validKeys.length} ❌${invalidKeys.length}`;

            // 启用复制所有按钮
            if (validKeys.length > 0) {
                copyAllBtn.disabled = false;
                copyAllBtn.addEventListener('click', function() {
                    copyToClipboard(validKeys.join('\n'), this, '已复制全部');
                });
            }

            // 恢复按钮
            checkBtn.disabled = false;
            checkBtn.textContent = '重新检测';
        });
    }

    // 遮蔽 Key 中间部分
    function maskKey(key) {
        if (key.length <= 12) return key;
        return key.substring(0, 8) + '...' + key.substring(key.length - 4);
    }

    // 复制到剪贴板
    function copyToClipboard(text, btn, successText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.textContent;
            btn.textContent = successText;
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 1500);
        }).catch(() => {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            const originalText = btn.textContent;
            btn.textContent = successText;
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 1500);
        });
    }

    // 注册菜单命令
    GM_registerMenuCommand('🔑 检测 Tavily API Key', createModal);

})();
