#! usr/bin/env node

const program = require('commander')
const create = require('./create')
const colors = require('colors')

program
    .command('create <projectName>')
    .action((projectName) => create(projectName))

program
    .usage(colors.blue.bold('create <projectName>'))

program.version('1.2.1')
program.parse(process.argv)