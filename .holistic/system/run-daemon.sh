#!/usr/bin/env sh
cd 'C:\Users\lweis\Documents\command-center' || exit 1
'C:\Users\lweis\Documents\command-center\.holistic\system\restore-state.sh' || true
'C:\Program Files\nodejs\node.exe' 'C:\Users\lweis\AppData\Roaming\npm\node_modules\holistic\dist\daemon.js' --interval 30 --agent unknown
