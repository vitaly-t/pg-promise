@echo off

SET PARAMS=--target es6 --module commonjs --noImplicitAny

call tsc init %PARAMS%
call tsc events %PARAMS%
call tsc adapter %PARAMS%
call tsc queries %PARAMS%
call tsc formatting %PARAMS%
call tsc extensions %PARAMS%
call tsc minify %PARAMS%
call tsc pg %PARAMS%
call tsc prepared %PARAMS%
call tsc paramQuery %PARAMS%
call tsc errors %PARAMS%
call tsc help %PARAMS%
call tsc connection %PARAMS%
call tsc tasks %PARAMS%
call tsc utils %PARAMS%
call tsc config %PARAMS%
