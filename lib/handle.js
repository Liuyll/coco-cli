const Metalsmith = require('metalsmith')
const ejs = require('ejs')
const rm = require('rimraf').sync

const ModifyFiles = ['package.json','config/webpack/webpack.config.js']
module.exports = function handleTemplate(root,src,metadata) {

    return new Promise((resolve,reject) => {
        Metalsmith(process.cwd())
            .destination(root)
            .source(src)
            .metadata(metadata)
            .use((files,metalsmith,done) => {
                const keys = Object.keys(files)
            
                ModifyFiles.forEach((file) => {
                    if(keys.includes(file)) {
                        let content = files[file].contents.toString()
                        files[file].contents = Buffer.from(ejs.render(content,metalsmith.metadata()))
                    }
                })
                done()
            })
            .build(err => {
                rm(src)
                err ? reject(err) : resolve()
            })
    })
}