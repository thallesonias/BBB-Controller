
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    backgroundColor: '#0B0E14'
  });

  // Em produção, isso seria o arquivo buildado, mas para dev:
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'index.html')}`;
  mainWindow.loadURL(startUrl);

  // Toggle Compact Mode Handler
  ipcMain.on('toggle-compact', (event, isCompact) => {
    if (mainWindow) {
      if (isCompact) {
        mainWindow.setSize(350, 600);
        mainWindow.setAlwaysOnTop(true, 'floating');
      } else {
        mainWindow.setSize(1200, 800);
        mainWindow.setAlwaysOnTop(false);
      }
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- AUTOMATION LOGIC (NATIVE POWERSHELL) ---
ipcMain.handle('automate-votes', async (event, votes, coords) => {
  return new Promise((resolve, reject) => {
    
    // Construct a PowerShell script dynamically
    // This script imports user32.dll to handle mouse events and uses WScript.Shell for typing
    // It avoids external node modules like robotjs.
    
    const psCommands = votes.map(v => {
        const textToType = `${v.name}: ${v.count} votos`;
        return `
        $w.SendKeys('${textToType}')
        Start-Sleep -Milliseconds 100
        $w.SendKeys('{ENTER}')
        Start-Sleep -Milliseconds 800
        `;
    }).join('\n');

    const psScript = `
    param($x, $y)
    
    # Create Shell Object
    $w = New-Object -ComObject WScript.Shell
    
    # Focus Habbo (Attempt to find process or window title containing Habbo)
    if ($w.AppActivate('Habbo')) {
        Start-Sleep -Milliseconds 500
        
        # Add Type for Mouse Control via user32.dll
        $code = @"
        [DllImport("user32.dll")]
        public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
        
        [DllImport("user32.dll")]
        public static extern bool SetCursorPos(int X, int Y);
"@
        $mouse = Add-Type -MemberDefinition $code -Name "Win32Mouse" -Namespace Win32Functions -PassThru
        
        # Move Mouse to Coords
        $mouse::SetCursorPos($x, $y)
        Start-Sleep -Milliseconds 200
        
        # Click (MOUSEEVENTF_LEFTDOWN = 0x02, MOUSEEVENTF_LEFTUP = 0x04)
        $mouse::mouse_event(0x02, 0, 0, 0, 0)
        $mouse::mouse_event(0x04, 0, 0, 0, 0)
        
        Start-Sleep -Milliseconds 300
        
        # Type Votes Loop
        ${psCommands}
        
    } else {
        Write-Output "Janela do Habbo não encontrada."
    }
    `;

    // Spawn PowerShell process
    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command', psScript,
      '-x', coords.x,
      '-y', coords.y
    ]);

    let output = '';
    let errorOutput = '';

    ps.stdout.on('data', (data) => {
      output += data.toString();
    });

    ps.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ps.on('close', (code) => {
      if (code === 0) {
        resolve("Automação concluída");
      } else {
        console.error("PS Error:", errorOutput);
        reject(`Erro no PowerShell: ${errorOutput}`);
      }
    });
  });
});
