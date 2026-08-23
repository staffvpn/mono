#!/bin/sh
# npx запускает next-server дочерним процессом: убийство обёртки
# оставляло сервер на порту, и новый падал с EADDRINUSE.
# Поэтому останавливаем именно next-server, находя его через ps.
stop() {
  ps -eo pid,args | awk '$2 ~ /^next-server/ {print $1}' | while read pid; do kill "$pid" 2>/dev/null; done
  [ -f /tmp/next.pid ] && kill "$(cat /tmp/next.pid)" 2>/dev/null
  rm -f /tmp/next.pid
  sleep 2
}
case "$1" in
  stop) stop ;;
  start)
    stop
    nohup npx next start -p 4300 >/tmp/next.log 2>&1 &
    echo $! > /tmp/next.pid
    for i in 1 2 3 4 5 6 7 8 9 10; do
      curl -sf -o /dev/null http://localhost:4300/ && break
      sleep 1
    done
    ;;
esac
