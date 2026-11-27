#!/bin/zsh
# Installs, removes or reports on the daily snapshot job (run.sh) as a
# LaunchAgent for the current user.
#
#   install.sh install [HH:MM]   default 09:00, local time
#   install.sh uninstall
#   install.sh status            whether it is loaded, and the last runs
#   install.sh run               start it now, as launchd would
#
# Nothing here asks for secrets: the job does, when it runs.

emulate -L zsh
setopt err_exit pipefail no_unset

LABEL="dev.registry-directory.daily-index"
HERE="${0:A:h}"
REPO="${HERE:h:h:h:h}"
AGENT="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$HOME/Library/Logs/registry-directory"
DOMAIN="gui/$(id -u)"

case "${1:-}" in
  install)
    at="${2:-09:00}"
    [[ "$at" == <0-23>:<0-59> ]] || { print -u2 "time must be HH:MM, got $at"; exit 2; }
    hour="${at%%:*}"; minute="${at##*:}"
    mkdir -p "$LOG_DIR" "${AGENT:h}"
    sed -e "s|@LABEL@|$LABEL|" -e "s|@RUN@|$HERE/run.sh|" -e "s|@REPO@|$REPO|" \
        -e "s|@HOUR@|$((10#$hour))|" -e "s|@MINUTE@|$((10#$minute))|" -e "s|@LOG_DIR@|$LOG_DIR|g" \
        "$HERE/launchd.plist.template" > "$AGENT"
    plutil -lint -s "$AGENT"
    launchctl bootout "$DOMAIN/$LABEL" 2> /dev/null || true
    launchctl bootstrap "$DOMAIN" "$AGENT"
    print "installed $LABEL, daily at $at; log: $LOG_DIR/daily-index.tsv"
    ;;
  uninstall)
    launchctl bootout "$DOMAIN/$LABEL" 2> /dev/null || true
    rm -f "$AGENT"
    print "removed $LABEL (logs kept in $LOG_DIR)"
    ;;
  status)
    if launchctl print "$DOMAIN/$LABEL" > /dev/null 2>&1; then
      print "$LABEL is loaded"
    else
      print "$LABEL is not loaded"
    fi
    [[ -f "$LOG_DIR/daily-index.tsv" ]] && tail -n 7 "$LOG_DIR/daily-index.tsv"
    ;;
  run)
    launchctl kickstart "$DOMAIN/$LABEL"
    print "started; follow with: tail -f $LOG_DIR/runs/\$(ls -t $LOG_DIR/runs | head -1)"
    ;;
  *)
    print -u2 "usage: ${0:t} install [HH:MM] | uninstall | status | run"
    exit 2
    ;;
esac
