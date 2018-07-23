.PHONY: build compile test copy-files clean install
default: build

SHELL:=/bin/bash
UNAME_S := $(shell uname -s)
TSC=./node_modules/typescript/bin/tsc
JEST=./node_modules/jest/bin/jest.js
TS_NODE=./node_modules/ts-node/dist/bin.js

install:
	yarn install
run: install
	$(TS_NODE) ./src/server.ts
copy-files:
		@if [ $(UNAME_S) = "Darwin" ]; then\
        rsync -mr src/ dist --exclude=*.ts;\
		else\
			find src -type f -not -name '*.ts' | xargs -I {} cp --parents {} dist/;\
    fi
compile: install clean
	$(TSC)
build: compile copy-files
test: install
	$(JEST)
clean:
	rm -rf ./dist
