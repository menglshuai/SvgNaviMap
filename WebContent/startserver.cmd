@echo off
netstat -aon | find ":8888" > NUL

IF %ERRORLEVEL% EQU 0 (
  echo Port 8888 seems to be in use. Abort starting server.
  goto end
) ELSE (
  echo Port 8888 is available. Continue...
)


IF %PROCESSOR_ARCHITECTURE%==x86 (
    echo Starting node.js 32 bit...
    start node-x86 node_js_server.js
) ELSE (
  echo Starting node.js 64 bit...
    start node node_js_server.js
)

echo Opening Editor's View in default browser...
start http://localhost:8888/editorsview.html

:end