//#!/usr/bin/env node

/*jslint es5: true */

const initial_task_js_content = "/*jslint es5: true */\n\
\n\
var cl = require(\"unibuild\").cl;\n\
\n\
module.exports = {\n\
    arguments: function (args) {\n\
        for(var i = 0; i<args.length; i++) {\n\
            cl(args[i]);\n\
        }\n\
    }\n\
};\n";

const unibuild_command = 'node_modules/unibuild/index.js'

function readJsonFile(filename) {
    var strData = fs.readFileSync(filename, 'utf8')
    var obj = JSON.parse(strData);
    return obj;
}

function isFunction(functionToCheck) {
    return {}.toString.call(functionToCheck) === '[object Function]';
}

function cl(args) {
    console.log(args);
}
module.exports.cl = cl;

var fs = require('fs');

(function () {
    'use strict';
    var argv = require('minimist')(process.argv.slice(2)),
        packageData,
        packageJsonPath,
        path = require('path');

    packageJsonPath = __dirname + '/../../package.json';
    if (fs.existsSync(packageJsonPath)) {
        packageData = readJsonFile(packageJsonPath)
    } else {
        cl("Install unibuild to the another project as dependency so it will analyse projects package.json")
        process.exit(2);
    }

    var taskJsDir = __dirname + '/../../.build';
    var taskJsPath = path.join(taskJsDir, 'tasks.js');

    if (!fs.existsSync(taskJsPath)) {
        cl("tasks.js doesn't exist.")
        cl(initial_task_js_content);
        cl("Would you like to create one with the following content? (y)")

        process.stdin.setRawMode(true);
        process.stdin.on('data', function (key) {
            if (key == 'y' || key == 'Y') {
                if (!fs.existsSync(taskJsDir)) {
                    fs.mkdirSync(taskJsDir);
                }
                cl("creating tasks.js");
                fs.writeFile(taskJsPath, initial_task_js_content, (err) => {
                    if (err) throw err;
                    cl("task.js is created. Restart unibuild command.")
                    process.exit(0);
                })
            } else {
                process.exit(1);
            }
        });
    } else {
        Array.prototype.contains = function (element) {
            return this.indexOf(element) > -1;
        };

        String.prototype.contains = function (element) {
            return this.indexOf(element) > -1;
        };

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
                    cl("\t" + name);
                }
            }
        }

        function runStep(stepName, stepArgs, taskJsPathLocal) {
            var effectivePath = taskJsPathLocal ? taskJsPathLocal : taskJsPath;
            var routines = require(effectivePath);
            var step = module[stepName] ? module[stepName] : routines[stepName];
            if (step) {
                step(stepArgs);
                cl("Finished!");
            } else {
                cl(`Step ${stepName} doesn't exist in ${taskJsPath}`);
                process.exit(3);
            }
        }

        function runCommandWithArguments() {
            var stepName = argv._[0];
            var stepArgs = process.argv.slice(3);
            runStep(stepName, stepArgs);
        }

        function isPackage(arr, name) { if (arr[name] && !arr[name].includes(`node ${unibuild_command}`) && arr[name].includes('unibuild_command')) { return true; } }

        function isCommand(arr, name) { if (arr[name] && arr[name].includes(`node ${unibuild_command}`)) { return true; } }

        var module = (function () {
            var self = {};

            self.help = function () {
                cl("Syntax: <npm run> [<package>] [<package command>]")
                cl("\tor <npm run> [<command>]")
                module.commands(function () {
                    module.packages(function () {
                        cl("Sample: nmp run server build")
                    });
                });
            };

            self.packages = function (callback) {
                cl("Available packages: ")
                var newHash = cutHash(packageData.scripts, isPackage);
                printNamesFromHash(newHash);
                cl("")
            };

            self.commands = function (args, callback) {
                if (args.length == 0) {
                    cl("Available commands: ");
                    var newHash = cutHash(packageData.scripts, isCommand);
                    printNamesFromHash(newHash);
                    cl("")
                    cl("To add more commands use .build/tasks.js")
                    if (callback && isFunction(callback)) callback(newHash);
                }
                else {
                    var newTaskJson = path.join(process.argv[1], '../../../.build/tasks.js');
                    cl(`Calling ${args[0]} with arguments ${args.slice(1)} in ${newTaskJson}`);
                    var stepName = args[0];
                    var stepArgs = args.slice(1);
                    runStep(stepName, stepArgs, newTaskJson);
                    if (callback && isFunction(callback)) callback(newHash);
                }
            };

            self.openUrl = function (url) {
                require("openurl").open(url);
            }

            self.mailTo = function (args) {
                var mailArgs = require('minimist')(args);
                cl(mailArgs);
                if (!mailArgs._) {
                    cl("mailTo <email1> [<email2>] -s <Subject> -b <Body>");
                    process.exit(1);
                }
                require("openurl").mailto(mailArgs._,
                    { subject: mailArgs.s, body: mailArgs.b });
            }

            return self;
        })();

        if (argv._.length > 0) {
            if (isPackage(packageData.scripts, argv._[0])) {
                var fork = require('child_process').fork;
                var child = fork('./script', process.argv.slice(4));
                child.on('exit', function (code) { cl('Child process exited with exit code ' + code); });
            }

            runCommandWithArguments();
        } else {
            module.help(function () {
                cl("No command or package specified. Better use this tool from the package.json on top");
                process.exit(1);
            });
        }
    }
})();