@ECHO OFF

REM Use this batch to generate jsdoc documentation in folder \out

node_modules\.bin\jsdoc.cmd lib/index.js
