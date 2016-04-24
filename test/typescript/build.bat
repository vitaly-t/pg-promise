@echo off

SET PARAMS=--target es6 --module commonjs

call tsc init %PARAMS%
call tsc events %PARAMS%
call tsc adapter %PARAMS%
call tsc queries %PARAMS%
call tsc formatting %PARAMS%
call tsc extensions %PARAMS%
call tsc minify %PARAMS%
call tsc pg %PARAMS%
call tsc prepared %PARAMS%
call tsc errors %PARAMS%
