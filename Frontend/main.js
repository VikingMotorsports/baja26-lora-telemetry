const { app, BrowserWindow, ipcMain } = require('electron')
const { spawn } = require('child_process');
const fs = require("fs");
const write = fs.createWriteStream("data.txt");

//Replace string with filepath of rf program.
const rf_program = spawn('./test_cpp_program');

let message_count = 0;
let buffer = "";

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
    buffer = "";
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

const path = require('node:path')

const createWindow = () => {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  })

  win.maximize();
  win.loadFile('index.html')


  /*NOTICE: The following code is for testing purposes only*/
  let t = 0;
  setInterval(() => {
    // Fake circular motion around a center point
    const lat = 45.63506 + 0.0003 * Math.sin(t);
    const lon = -122.26088 + 0.0003 * Math.cos(t);
    t += 0.05;

    win.webContents.send("telemetry", { lat, lon });
  }, 100);
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