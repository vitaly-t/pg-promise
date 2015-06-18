@ECHO OFF

REM Use this batch to run tests on Windows.
REM NOTE: Make sure to follow all the Testing steps first: https://github.com/vitaly-t/pg-promise#testing

node_modules/.bin/jasmine-node.cmd test

REM node_modules/.bin/jasmine.cmd
