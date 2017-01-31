//#!/usr/bin/env node

/*jslint es5: true */

(function(){
    'use strict';
    var argv = require('minimist')(process.argv.slice(2)),
    routines = require('./tasks'),
     fs = require('fs'),
     packageData = readJsonFile(__dirname + '\\..\\package.json'),
     path = require('path');

    Array.prototype.contains = function(element){
        return this.indexOf(element) > -1;
    };

    String.prototype.contains = function(element){
        return this.indexOf(element) > -1;
    };

    function readJsonFile(filename) {
        var strData = fs.readFileSync(filename, 'utf8')
        var obj = JSON.parse(strData);
        return obj;
    }

    function cutHash(arrayOfString, condition) {
        var name;
        var result = {};
        for (name in arrayOfString) {
            if (!condition || condition(arrayOfString, name)) {
                result[name] = arrayOfString[name];
            }
        }
        return result;
    }

    function printNamesFromHash(obj) {
        var name;
        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                console.log("\t" + name);
            }
        }
    }

    function runStepsOneByOne() {
        var i = 0;

        function runFurtherSteps() {
            var stepName = argv._[i];
            var step;
            if (i < argv._.length) {
                step = module[stepName] ? module[stepName] : routines[stepName];
            } else {
                step = function () {
                    console.log("Finished!");
                };
            }

            i++;

            step(runFurtherSteps);
        }

        runFurtherSteps();
    }

    function isPackage(arr, name) { if (arr[name] && !arr[name].contains("node .build\\build.js") && arr[name].contains(".build\\build.js")) { return true; } }

    function isCommand(arr, name) { if (arr[name] && arr[name].contains("node .build\\build.js")) { return true; } }

    var module = (function () {
        var self = {};

        self.help = function(callback) {
            console.log("Syntax: <npm run> [<package>] [<package command>]")
            console.log("\tor <npm run> [<command>]")
            module.commands(function(){
                module.packages(function(){
                    console.log("Sample: nmp run server build")
                    if (callback) { callback(); }
                });
            });
        };

        self.packages = function(callback) {
            console.log("Available packages: ")
            var newHash = cutHash(packageData.scripts, isPackage);
            printNamesFromHash(newHash);
            console.log("")
            callback(newHash);
        };

        self.commands = function(callback) {
            console.log("Available commands: ");
            var newHash = cutHash(packageData.scripts, isCommand);
            printNamesFromHash(newHash);
            console.log("")
            callback(newHash);
        };

        return self;
    })();

    if (argv._.length > 0) {
        if (isPackage(packageData.scripts, argv._[0])) {
            var fork = require('child_process').fork;
            var child = fork('./script', process.argv.slice(4));
            child.on('exit', function (code) { console.log('Child process exited with exit code ' + code);  });
        }

        runStepsOneByOne();
    } else {
        module.help(function () {
            console.log("No command or package specified. Better use this tool from the package.json on top");
            process.exit(1);
        });
    }
})();