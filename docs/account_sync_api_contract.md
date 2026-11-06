# iPAS 帳戶與同步 API 契約

- 狀態：Frontend contract v0.1（後端尚未實作）
- 建立日期：2026-08-20
- 適用前端：IndexedDB v5 / `account-core.js` / `account-api.js`

## 目前能力與安全降級

2026-08-20 只讀檢查現有 Google Apps Script：公開 `GET` 只回傳證照啟用設定。現有登入 `POST` 未有版本化的帳戶／同步契約來源碼可供審查，因此前端不得假設它支援跨裝置同步。

- 登入成功但缺少 `user_id` 或 `session_token`：顯示「本機模式」，沿用既有本機資料，不建立帳戶同步操作。
- 回傳正式不透明 `user_id`：啟用 IndexedDB v5 帳戶分區；身分證不得作為資料鍵。
- 只有後端明確回傳 HTTPS 同步端點及 `sync.enabled=true` 時，前端才傳送 outbox。
- 舊版未分區資料不自動歸給任何帳戶，避免把同裝置前一位使用者資料誤併給下一位。

## 1. 登入

請求：

```json
{
  "action": "login",
  "national_id": "登入驗證值，只限此請求",
  "user_agent": "瀏覽器識別"
}
```

正式帳戶回應：

```json
{
  "success": true,
  "user_id": "usr_opaque_identifier",
  "session_token": "short_lived_token",
  "session_expires_at": "2026-08-20T12:00:00.000Z",
  "authorized_certs": "oi,ai,ai_mid",
  "sync": {
    "enabled": true,
    "endpoint": "https://example.invalid/ipas/sync"
  }
}
```

要求：

- `user_id` 必須是伺服器產生的不透明值，不得是身分證、Email 或電話。
- session 必須短效、可撤銷；前端目前只保存在記憶體，重新整理即清除。
- 回應與日誌不得回顯完整身分證。
- 後端應加入速率限制、稽核紀錄與工作階段撤銷端點。

## 2. 增量同步

請求：

```json
{
  "action": "sync",
  "session_token": "short_lived_token",
  "operations": [
    {
      "operationId": "op_opaque_identifier",
      "userId": "usr_opaque_identifier",
      "deviceId": "dev_opaque_identifier",
      "type": "question_state_changed",
      "payload": {},
      "createdAt": "2026-08-20T10:00:00.000Z"
    }
  ]
}
```

回應必須逐筆明確確認；只有列在 `accepted_operation_ids` 的操作才可由前端 outbox 移除：

```json
{
  "success": true,
  "accepted_operation_ids": ["op_opaque_identifier"],
  "rejected_operation_ids": [],
  "server_revision": 42
}
```

伺服器以 `(user_id, operation_id)` 作唯一鍵，重送同一操作不得重複增加計數。未列在任一清單的操作保留在本機待同步；只有明確列在 `rejected_operation_ids` 的操作標記為 conflict，不得顯示「已同步」。

## 3. 操作種類

| type | 內容 |
| --- | --- |
| `question_state_changed` | 標記、答對／答錯累計、最近結果、SM-2 與 revision |
| `quiz_attempt_completed` | 一次測驗摘要及各題答案 |
| `course_progress_changed` | Note／Voice 資產位置、完成狀態與更新時間 |

同步 payload 禁止含 `national_id`、session token、Authorization、密碼或其他驗證秘密。

## 4. 尚待後端提供

1. session refresh、logout/revoke 與刪除帳戶資料。
2. 依 `server_revision` 拉取遠端增量資料的 pull API。
3. 布林標記的明確操作時間、計數事件去重及跨裝置衝突合併。
4. 同帳戶雙裝置、不同帳戶同瀏覽器、離線重送與撤銷測試環境。

在上述能力完成前，Phase 3 狀態維持「前端基礎已實作、跨裝置後端待完成」。
