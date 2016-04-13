@echo off

SET PARAMS=--target es6 --module commonjs

call tsc init.ts %PARAMS%
call tsc events.ts %PARAMS%
call tsc adapter.ts %PARAMS%
call tsc queries.ts %PARAMS%
