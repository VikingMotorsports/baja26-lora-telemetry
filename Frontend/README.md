# Baja Telemetry Frontend
## Description
Draws coordinates on a map and stores them in a file

## Setup
Clone the repository

Follow environment setup instructions here. <br>
https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites

Then run `npm install` in the Frontend directory

Place map .png and .pgw files in the Frontend directory

Place cpp executable in the Frontend directory

Go to main.js and change
```
const cpp_program_path = './test_cpp_program';
```

to

```
const cpp_program_path = PATH_TO_YOUR_PROGRAM;
```

## Run
Run command `npm run start` in the Frontend directory to run the program

## What your C++ program should do
The frontend program will read from your C++ program's standard output stream.

Your program outputs should look like the following
```
std::cout << "{\"timestamp\":" << TIMESTAMP_DATA << ",\"lon\":" << LON_DATA << ",\"lat\":" << LAT_DATA << "}" << std::endl;
```