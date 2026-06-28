(function () {
    "use strict";

    var form = document.querySelector("[data-public-feedback-form]");
    var message = document.querySelector("[data-public-feedback-message]");

    if (!form || !message) return;

    function setMessage(text, status) {
        message.textContent = text;
        message.classList.remove("error", "success");
        if (status) message.classList.add(status);
    }

    function sanitizeText(value) {
        return String(value || "").trim();
    }

    function hasSensitiveContent(value) {
        var text = sanitizeText(value);
        if (!text) return false;
        return /[A-Z][12]\d{8}/i.test(text)
            || /\b\d{12,19}\b/.test(text.replace(/[\s-]/g, ""))
            || /\b09\d{8}\b/.test(text)
            || /密碼|password|卡號|帳戶|證件|身分證/.test(text);
    }

    function validHttpsUrl(value) {
        if (!value) return true;
        try {
            return new URL(value).protocol === "https:";
        } catch (error) {
            return false;
        }
    }

    function encoder() {
        return new window.TextEncoder();
    }

    function toHex(bytes) {
        return Array.prototype.map.call(bytes, function (value) {
            return value.toString(16).padStart(2, "0");
        }).join("");
    }

    function fallbackHash(value) {
        var source = sanitizeText(value);
        var hash = 0;
        for (var i = 0; i < source.length; i += 1) {
            hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
        }
        return "fallback_" + Math.abs(hash);
    }

    function hashContact(value) {
        var source = sanitizeText(value);
        if (!source) return Promise.resolve("");
        if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
            return Promise.resolve(fallbackHash(source));
        }
        return window.crypto.subtle.digest("SHA-256", encoder().encode(source)).then(function (buffer) {
            return "sha256_" + toHex(new Uint8Array(buffer));
        }).catch(function () {
            return fallbackHash(source);
        });
    }

    function payloadFromForm(contactHash) {
        var formData = new window.FormData(form);
        return {
            feedback_type: sanitizeText(formData.get("feedback_type")),
            page_url: sanitizeText(formData.get("page_url")),
            summary: sanitizeText(formData.get("summary")),
            official_source_url: sanitizeText(formData.get("official_source_url")),
            source_updated_at: sanitizeText(formData.get("source_updated_at")),
            reporter_contact_hash: contactHash,
            phone_last3: sanitizeText(formData.get("phone_last3")),
            consent_contact: formData.get("consent_contact") === "on",
            website: sanitizeText(formData.get("website"))
        };
    }

    function clearForm() {
        form.reset();
        var pageUrl = form.querySelector('input[name="page_url"]');
        if (pageUrl) pageUrl.value = window.location.href;
    }

    function validate(payload) {
        if (!payload.feedback_type) return "請選擇回報類型。";
        if (!payload.page_url) return "請填寫頁面網址。";
        if (!payload.summary) return "請填寫問題摘要。";
        if (!validHttpsUrl(payload.official_source_url)) return "官方來源 URL 需使用 HTTPS。";
        if (payload.phone_last3 && !/^\d{3}$/.test(payload.phone_last3)) return "手機末三碼需為 3 位數字。";
        if (payload.website) return "已拒絕本次送出。";
        if (hasSensitiveContent(payload.summary)) return "摘要疑似包含身分證、帳戶、卡號、密碼或完整手機，請改用低敏描述。";
        if (hasSensitiveContent(payload.page_url) || hasSensitiveContent(payload.official_source_url)) return "網址欄位不可包含敏感資訊。";
        return "";
    }

    function submit(payload) {
        if (window.TFSEApi && window.TFSEApi.submitPublicFeedback) return window.TFSEApi.submitPublicFeedback(payload);
        return Promise.resolve({
            mode: "unavailable",
            ticket_id: "",
            status: "unavailable",
            assigned_role: "",
            related_task_type: payload.feedback_type
        });
    }

    function track(result, payload) {
        if (!window.TFSETrack) return;
        window.TFSETrack("public_feedback_submit", {
            feedback_type: payload.feedback_type,
            status: result.status || "queued",
            mode: result.mode || "unknown",
            assigned_role: result.assigned_role || "",
            has_official_source: !!payload.official_source_url,
            has_contact_hash: !!payload.reporter_contact_hash
        });
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        setMessage("正在送出低敏資料回報…");
        var submitButton = form.querySelector("[data-public-feedback-submit]");
        if (submitButton) submitButton.disabled = true;
        hashContact(form.querySelector('input[name="reporter_contact"]').value).then(function (contactHash) {
            var payload = payloadFromForm(contactHash);
            var error = validate(payload);
            if (error) {
                setMessage(error, "error");
                if (submitButton) submitButton.disabled = false;
                return;
            }
            return submit(payload).then(function (result) {
                track(result, payload);
                setMessage("資料回報已送出，工單編號：" + (result.ticket_id || "queued") + "。TFSE 只保存低敏摘要，後續會依類型分流。", "success");
                clearForm();
            }).catch(function () {
                setMessage("資料回報送出失敗，請稍後再試或改用 Email 聯絡。", "error");
            }).finally(function () {
                if (submitButton) submitButton.disabled = false;
            });
        });
    }

    clearForm();
    form.addEventListener("submit", handleSubmit);
})();
