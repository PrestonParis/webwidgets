#!/bin/zsh

set -euo pipefail

readonly LABEL="com.webwidgets.claude-lint-failsafe"
readonly SOURCE_DIR="${0:A:h}"
readonly SUPPORT_DIR="/Users/nna/Library/Application Support/WebWidgets/claude-lint-failsafe"
readonly LAUNCH_AGENTS_DIR="/Users/nna/Library/LaunchAgents"
readonly INSTALLED_SCRIPT="$SUPPORT_DIR/claudeLintFailsafe.zsh"
readonly PLIST="$LAUNCH_AGENTS_DIR/$LABEL.plist"
readonly LOG_DIR="/Users/nna/Library/Logs/WebWidgets"
USER_DOMAIN="gui/$(id -u)"
readonly USER_DOMAIN

mkdir -p "$SUPPORT_DIR" "$LAUNCH_AGENTS_DIR" "$LOG_DIR"
install -m 700 "$SOURCE_DIR/claudeLintFailsafe.zsh" "$INSTALLED_SCRIPT"

TEMP_PLIST="$(mktemp /private/tmp/webwidgets-claude-lint.XXXXXX.plist)"
readonly TEMP_PLIST
trap 'rm -f "$TEMP_PLIST"' EXIT
plutil -create xml1 "$TEMP_PLIST"
plutil -insert Label -string "$LABEL" "$TEMP_PLIST"
plutil -insert ProgramArguments -xml \
    "<array><string>/bin/zsh</string><string>$INSTALLED_SCRIPT</string></array>" \
    "$TEMP_PLIST"
plutil -insert WorkingDirectory -string "/Users/nna/dev/aidash" "$TEMP_PLIST"
plutil -insert StartCalendarInterval -xml \
    '<dict><key>Hour</key><integer>1</integer><key>Minute</key><integer>0</integer></dict>' \
    "$TEMP_PLIST"
plutil -insert RunAtLoad -bool true "$TEMP_PLIST"
plutil -insert ProcessType -string Background "$TEMP_PLIST"
plutil -insert StandardOutPath -string \
    "$LOG_DIR/claude-lint-failsafe.log" "$TEMP_PLIST"
plutil -insert StandardErrorPath -string \
    "$LOG_DIR/claude-lint-failsafe.error.log" "$TEMP_PLIST"
plutil -insert EnvironmentVariables -xml \
    '<dict><key>PATH</key><string>/Users/nna/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string><key>WW_CLAUDE_LINT_REPO_ROOT</key><string>/Users/nna/dev/aidash</string><key>WW_CLAUDE_LINT_CLAUDE_BIN</key><string>/Users/nna/.local/bin/claude</string></dict>' \
    "$TEMP_PLIST"
plutil -lint "$TEMP_PLIST"

launchctl bootout "$USER_DOMAIN" "$PLIST" 2>/dev/null || true
install -m 600 "$TEMP_PLIST" "$PLIST"
launchctl bootstrap "$USER_DOMAIN" "$PLIST"
launchctl enable "$USER_DOMAIN/$LABEL"
launchctl kickstart -k "$USER_DOMAIN/$LABEL"

print -r -- "Installed $LABEL for 1:00 AM local time and missed-wake delivery"
