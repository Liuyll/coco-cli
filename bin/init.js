#! usr/bin/env node

const program = require('commander')
const create = require('./create')

program
    .command('create <projectName>')
    .action((projectName) => create(projectName))
    
program.parse(process.argv)