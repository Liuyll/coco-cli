const fs = require('fs')
const child_process = require('child_process')

const glob = require('glob')
const path = require('path')
const colors = require('colors')
const inquirer = require('inquirer')
const rm = require('rimraf').sync

const pullTemplate = require('../lib/download')
const handleTemplate = require('../lib/handle')

function computedRootName(projectName) {
    let rootName

    const curList = glob.sync('*')
    const curFolderName = path.basename(process.cwd())
    // console.log(curName,curList)
    if(!curList.length && curFolderName == projectName) {
        rootName = '.'
    } else {
        if(!curList.includes(projectName)) mkdirAndSetRoot()
        else {
            if(fs.statSync(`./${projectName}`).isDirectory()) {
                console.log(colors.red(`Error: `))
                console.log(colors.red(`Project: ${projectName} has existed`))
            } else mkdirAndSetRoot()
        }
    }

    function mkdirAndSetRoot() {
        try {
            fs.mkdirSync(`./${projectName}`)
        } catch(err) {
            console.log(colors.red(`Create project: ${projectName} folder occur a error: ${err}`))
            console.log(colors.red(`${err}`))
        } 
      
        rootName = `./${projectName}`
    }

    return rootName
}

// utilize pull Template IO to do something
function waitingPullDoWhat() {
    return inquirer.prompt([
        {
            type: 'confirm',
            name: 'isDefault',
            message: 'whether to use the default template?',
            default: false
        },
        {   
            type: 'confirm',
            name: 'isJs',
            message: 'whether to use JavaScript rather than TypeScript',
            default: false,
            when: (answer) => (!answer.isDefault)
        },
        {
            type: 'list',
            name: 'preCss',
            message: 'choose your favorite CSS Preprocessor',
            choices: [
                'LESS',
                'SASS',
                'Default',
                'NONE',
            ],
            default: 'LESS',
            when: (answer) => (!answer.isDefault)
        }
    ])
}

const DefaultOptions = {
    isJs: false,
    preCss: 'LESS'
}

module.exports = function main(projectName) {
    const rootName = computedRootName(projectName)
    if(!rootName) return 

    Promise.all([
        pullTemplate(`./${rootName}/temp`),
        waitingPullDoWhat()
    ])
        .then(([result,config]) => {
            if(!result) return

            const { templateTarget } = result
            if(config.isDefault) {
                const defaultOptionsKeys = Object.keys(DefaultOptions) 
                defaultOptionsKeys.forEach((defaultOption) => {
                    config[defaultOption] = DefaultOptions[defaultOption]
                })
            }

            const tempModifyFolder = `${rootName}/_temp`
            handleTemplate(tempModifyFolder,templateTarget,config)
                .then(() => {
                    child_process.exec(`cp -r ${tempModifyFolder}/* ${rootName}`,() => rm(tempModifyFolder))
                })
        })

}