# NeuroClip Changelog

## [4.0.2] - June 2025

### 🔧 Critical Fixes

#### Fixed: Supervisor not clearing OCR pending state when watcher crashes
- **Issue**: When OCR watcher process dies or stops, the `ocr_pending` state remained in memory, causing orphaned notifications and confusing UI behavior
- **Symptom**: "Sering mati sendiri padhal belum command off" - watcher crashes but state says it's still pending
- **Fix**: Supervisor now properly clears OCR pending state and removes notifications when OCR watcher is stopped/disabled
- **File**: `src/supervisor.mjs`
- **Impact**: HIGH - Fixes stability issues when watchers crash unexpectedly

#### Fixed: Inconsistent text length threshold for clipboard override
- **Issue**: `watch-confirm.mjs` used `clip.length >= 10` to clear OCR context, but `answer.mjs` used `clip.length >= 3` to accept input
- **Symptom**: Copying short text (5-9 chars) while OCR pending could cause unpredictable behavior
- **Fix**: Standardized threshold to `>= 3` characters consistently across all modules
- **File**: `src/watch-confirm.mjs`
- **Impact**: MEDIUM - Improves consistency in clipboard handling

#### Fixed: Provider route priority for OCR cleaning
- **Issue**: `ocrclean` mode route prioritized Gemini first, but Claude (more accurate for JSON) was last
- **Symptom**: OCR cleaning failure rate was higher than necessary
- **Fix**: Changed route priority: `["claude", "gemini", "kimi", "chatgpt"]` (Claude first, as best for structured output)
- **File**: `src/core.mjs`
- **Impact**: MEDIUM - Improves OCR cleaning success rate

#### Added: State change detection during async operations
- **Issue**: When clipboards changed or screenshots were taken while processing, answer context could become stale
- **Symptom**: Rare race conditions where answer used wrong context
- **Fix**: Added timestamp-based state change detection in `answer.mjs` and `ocr-answer.mjs`
- **File**: `src/answer.mjs`, `src/ocr-answer.mjs`
- **Impact**: LOW - Prevents rare race condition bugs

### 📊 Version comparison

| Aspect | v4.0.1 | v4.0.2 |
|--------|--------|--------|
| Stability | Fair | ✅ Improved |
| Watcher crash handling | ❌ Bad | ✅ Fixed |
| OCR state consistency | ❌ Buggy | ✅ Fixed |
| Clipboard override logic | ❌ Inconsistent | ✅ Fixed |
| OCR cleaning reliability | 🟡 Medium | ✅ Improved |

### 🚀 How to upgrade

```bash
# Backup current setup
cp -r ~/.neuroclip ~/.neuroclip.backup

# Install new version
bash scripts/setup-termux.sh

# Clear old flow state (recommended)
neuro clear-flow
```

### 📝 Testing recommendations

After upgrade, test these scenarios:

1. **Watcher crash recovery**
   ```bash
   neuro on
   # Take screenshot (OCR pending)
   # Kill OCR watcher: pkill -f "watch-screenshot.mjs"
   # Check: Memory should clear, no orphaned notification
   ```

2. **Clipboard override consistency**
   ```bash
   neuro on
   # Screenshot (OCR pending)
   # Copy short text: "hello" (5 chars)
   # Check: OCR cleared? Behavior consistent?
   ```

3. **OCR cleaning reliability**
   ```bash
   neuro on
   # Take multiple screenshots
   # Monitor: Cleaning should succeed more often
   ```

### 🐛 Known issues (v4.0.2)

- OCR cleaning still makes 2 API calls per screenshot (will be optimized in v4.1)
- No unit tests (planned for v5.0)
- State validation still minimal (will improve in v4.1)

### 🎯 Planned for v4.1

- [ ] Remove redundant OCR cleaning API call
- [ ] Add comprehensive logging
- [ ] Remove dead code fields (clip_paused_until, clip_paused_reason)
- [ ] Better state naming convention
- [ ] Unit test coverage

### 🙏 Notes

These fixes address the most critical stability issues found during code review. While not a complete rewrite, they significantly improve robustness for production use.

**Recommendation**: This version is safe for production use. Recommended upgrade from v4.0.1.

---

**For detailed technical analysis**, see: [ANALYSIS.md](ANALYSIS.md)
