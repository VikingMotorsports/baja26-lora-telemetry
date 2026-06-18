const { app, BrowserWindow, ipcMain, webContents } = require('electron')
const { spawn } = require('child_process');
const fs = require("fs");
const write = fs.createWriteStream("data.txt");

//Change this to the path of your cpp program
const cpp_program_path = './test_cpp_program';


let win;
let rf_program;
let message_count = 0;
let buffer = "";
let rendererReady = false;
let pendingTelemetry = [];
let refreshRate = 60; //Number of times data is send to the renderer per second.
let delay = 1000 / refreshRate; //Delay time between communication to the renderer
const path = require('node:path')

ipcMain.on("renderer-ready", () => {
  rendererReady = true;
});

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  })

  win.maximize();
  win.loadFile('index.html')

  rf_program = spawn(cpp_program_path);
  rf_program.stdout.on('data', (data) => {
    //Write data directly to a file
    write.write(`${data}`);

    //Assemble input for display
    buffer += `${data}`;

    let messages;

    if (buffer[buffer.length - 1] != '\n')
    {
      messages = buffer.split('\n');
      buffer = messages.pop();
    }
    else
    {
      messages = buffer.split('\n');
      messages.pop();
      buffer = "";
    }
    
    let message;
    for (let i = 0; i < messages.length; i += 1)
    {
      message = JSON.parse(messages[i]);
      if (message["code"] == "coords")
      {
        let lat = message["lat"];
        let lon = message["lon"];

        //Global list
        pendingTelemetry.push({lat, lon});
      }
      else if (message["code"] == "pit")
      {
        if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed())
        {
          win.webContents.send("pit", "t")
        }
      }
      else if (message["code"] == "help")
      {
        if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed())
        {
          win.webContents.send("help", "t")
        }
      }
    }
    /* Message count testing for input assembler
    for (const message of messages)
    {
      if(message.trim().length === 0) continue;
      message_count++;
    }
    console.log("Message recieved", message_count);
    */
  })
  setInterval(() => {
    if (rendererReady == true)
    {
      for (let j = 0; j < pendingTelemetry.length; j += 1)
      {
        let lat = pendingTelemetry[j]["lat"]
        let lon = pendingTelemetry[j]["lon"]
        if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) 
        {
          win.webContents.send("telemetry", { lat, lon });
        }
      }
      pendingTelemetry = [];
    }
  }, delay);
  /*NOTICE: The following code is for testing purposes only*/

  /*
  let t = 0;
  setInterval(() => {
    // Fake circular motion around a center point
    const lat = 45.63506 + 0.0003 * Math.sin(t);
    const lon = -122.26088 + 0.0003 * Math.cos(t);
    t += 0.05;

    win.webContents.send("telemetry", { lat, lon });
  }, 100);
  */
  /*End of testing code*/
}

app.on('window-all-closed', () => {
  write.end();
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.on('telemetry', () => {

})