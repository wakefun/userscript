// ==UserScript==
// @name         L站自动连接
// @namespace    https://linux.do/
// @version      0.2.0
// @description  自动点击 LinuxDO 登录与允许授权
// @author       helloai
// @match        https://connect.linux.do/*
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function findAgreementCheckbox() {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));

        for (const checkbox of checkboxes) {
            if (checkbox.disabled) continue;

            const container = checkbox.closest('label, .semi-checkbox, .checkbox, [class*="checkbox"]') || checkbox.parentElement;
            const text = (container?.textContent || '').replace(/\s+/g, '');

            if (/同意|协议|隐私|条款/.test(text)) {
                return checkbox;
            }
        }

        return checkboxes.length === 1 ? checkboxes[0] : null;
    }

    function clickApproveButton() {
        const approveBtn = document.querySelector('a[href^="/oauth2/approve/"]');
        if (!approveBtn) return false;

        approveBtn.click();
        return true;
    }

    function clickLinuxDoLoginButton() {
        const candidates = Array.from(document.querySelectorAll('button, a'));
        const loginBtn = candidates.find((element) => {
            const text = (element.textContent || '').replace(/\s+/g, '').toLowerCase();
            return text.includes('使用linuxdo继续') || text.includes('使用linuxdo登录') || text.includes('linuxdo继续');
        });

        if (!loginBtn) return false;

        const agreementCheckbox = findAgreementCheckbox();
        if (agreementCheckbox && !agreementCheckbox.checked && !agreementCheckbox.disabled) {
            agreementCheckbox.click();
            setTimeout(() => loginBtn.click(), 120);
            return true;
        }

        loginBtn.click();
        return true;
    }

    function runActions() {
        return clickApproveButton() || clickLinuxDoLoginButton();
    }

    if (runActions()) return;

    let attempts = 0;
    const maxAttempts = 20;
    const timer = setInterval(() => {
        attempts += 1;

        if (runActions() || attempts >= maxAttempts) {
            clearInterval(timer);
        }
    }, 300);
})();
