#!/bin/dash
# Kill if already running
if pidof -o %PPID -x "${0##*/}"; then
  exit 1
fi
# Start loop
while :
do
# What time is it?
  CURRENT_TIME=$(date +%H%M)
# Depending on time set THEME_CHOICE & NEXT_TIME
  if [ "$CURRENT_TIME" -ge 0000 ] && [ "$CURRENT_TIME" -lt 0200 ]; then
    THEME_CHOICE=Mint-Y-Dark-Red
    NEXT_TIME=0200
  elif [ "$CURRENT_TIME" -ge 0200 ] && [ "$CURRENT_TIME" -lt 0600 ]; then
    THEME_CHOICE=Mint-Y-Dark-Purple
    NEXT_TIME=0600
  elif [ "$CURRENT_TIME" -ge 0600 ] && [ "$CURRENT_TIME" -lt 1000 ]; then
    THEME_CHOICE=Mint-Y-Dark-Aqua
    NEXT_TIME=1000
  elif [ "$CURRENT_TIME" -ge 1000 ] && [ "$CURRENT_TIME" -lt 1400 ]; then
    THEME_CHOICE=Mint-Y-Dark
    NEXT_TIME=1400
  elif [ "$CURRENT_TIME" -ge 1400 ] && [ "$CURRENT_TIME" -lt 1800 ]; then
    THEME_CHOICE=Mint-Y-Dark-Sand
    NEXT_TIME=1800
  elif [ "$CURRENT_TIME" -ge 1800 ] && [ "$CURRENT_TIME" -lt 2200 ]; then
    THEME_CHOICE=Mint-Y-Dark-Orange
    NEXT_TIME=2200
  elif [ "$CURRENT_TIME" -ge 2200 ] && [ "$CURRENT_TIME" -le 2359 ]; then
    THEME_CHOICE=Mint-Y-Dark-Red
    NEXT_TIME=0000
  fi
# Set the chosen theme
  gsettings set org.cinnamon.desktop.interface gtk-theme "$THEME_CHOICE"
  gsettings set org.cinnamon.desktop.interface icon-theme "$THEME_CHOICE"
  gsettings set org.cinnamon.theme name "$THEME_CHOICE"
# Sleep until NEXT_TIME
  sleep $(($(date -d "$NEXT_TIME" +%s) - $(date -d "$CURRENT_TIME" +%s)))
done
