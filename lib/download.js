const download = require('download-git-repo')
const colors = require('colors')

// 2min
const Timeout = 1000 * 60 * 2
const TemplateName = 'Liuyll/coco-template'

module.exports = function pullTemplate(tempFolder) {
    return new Promise((resolve,reject) => {
        let startTime = Date.now()
        // 不需要精准计算,setInterval足以应付
        let timeoutCheckFlag = setInterval(() => {
            if(Date.now() - startTime > Timeout) {
                clearInterval(timeoutCheckFlag)
                reject(`
                    please check your network
                    It seems like we can't request GITHUB
                `)
            }
        },2000)
        download(
            TemplateName,
            tempFolder,
            (err) => {
                clearInterval(timeoutCheckFlag)
                if(err) {
                    reject(err)
                }
                
                else {
                    resolve()
                    spinner.succeed()
                }
            } 
        )
    }).then(() => {
        return {
            templateTarget:tempFolder
        }
    }).catch(err => {
        console.log(colors.bold.red(err))
        return false
    })
}
