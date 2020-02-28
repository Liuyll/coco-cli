const fs = require('fs')
const child_process = require('child_process')

const glob = require('glob')
const path = require('path')
const colors = require('colors')
const inquirer = require('inquirer')
const rm = require('rimraf').sync
const ora = require('ora')

const pullTemplate = require('../lib/download')
const handleTemplate = require('../lib/handle')

const NOOP = () => {}
function computedRootFolder(projectName) {
    let rootFolder

    const curList = glob.sync('*')
    const curFolderName = path.basename(process.cwd())
    // console.log(curName,curList)
    if(!curList.length && curFolderName == projectName) {
        rootFolder = '.'
    } else {
        if(!curList.includes(projectName)) mkdirAndSetRoot()
        else {
            if(fs.statSync(`./${projectName}`).isDirectory()) {
                console.log(colors.bold.red(`Err! Project: ${projectName} has existed`))
            } else mkdirAndSetRoot()
        }
    }

    function mkdirAndSetRoot() {
        try {
            fs.mkdirSync(`./${projectName}`)
        } catch(err) {
            console.log(colors.bold.red(`Create project: ${projectName} folder occur a error: 
            ${err}`))
        } 
      
        rootFolder = `./${projectName}`
    }

    return rootFolder
}

// utilize pull Template IO to do something
function waitingPullDoWhat(cb = NOOP) {
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
        },
        {
            type: 'confirm',
            name: 'isStructure',
            message: 'whether to create default project structure?',
            default: false,
            when: (answer) => (!answer.isDefault)
        }
    ]).then((config) => {
        cb()
        return config
    })
}

const DefaultOptions = {
    isJs: false,
    preCss: 'LESS',
    isStructure: false
}

module.exports = function main(projectName) {
    const rootFolder = computedRootFolder(projectName)
    if(!rootFolder) return 

    const spinner = ora(colors.bold.yellow(`pulling template from git,waiting ...`))

    Promise.all([
        pullTemplate(`./${rootFolder}/temp`),
        waitingPullDoWhat(() => spinner.start())
    ])
        .then(([result,config]) => {
            if(!result) {
                spinner.fail()
                // 退出
                process.exit(1)
            }
            
            spinner.succeed()

            const { templateTarget } = result
            if(config.isDefault) {
                const defaultOptionsKeys = Object.keys(DefaultOptions) 
                defaultOptionsKeys.forEach((defaultOption) => {
                    config[defaultOption] = DefaultOptions[defaultOption]
                })
            }

            const tempModifyFolder = `${rootFolder}/_temp`
            handleTemplate(tempModifyFolder,templateTarget,config)
                .then(() => {
                        return new Promise((resolve) => child_process.exec(`cp -a ${tempModifyFolder}/. ${rootFolder}`,() => {
                            rm(tempModifyFolder)
                            resolve()
                        })
                     )
                })
                .then(() => {
                    handleCustom(rootFolder,config)
                })
                .then(() => {
                    console.log(colors.green.bold(`success!
project: ${projectName} has created;

please follow step:
1.${rootFolder == '.' ? 'yarn install' : 'cd '+ rootFolder.slice(2) +' && yarn install'}
2.yarn run dev
                    `))
                })
        })

}

function handleCustom(rootFolder,config) {
    if(config.isJs) {
        fs.unlinkSync(path.resolve(rootFolder,'.eslintrc-ts.yml'))
        fs.renameSync(path.resolve(rootFolder,'.eslintrc-js.yml'),path.resolve(rootFolder,'.eslintrc.yml'))

        // remove tsconfig.json in js mode
        fs.unlinkSync(path.resolve(rootFolder,'tsconfig.json'))
    } else {
        fs.unlinkSync(path.resolve(rootFolder,'.eslintrc-js.yml'))
        fs.renameSync(path.resolve(rootFolder,'.eslintrc-ts.yml'),path.resolve(rootFolder,'.eslintrc.yml'))    
    } 
}

