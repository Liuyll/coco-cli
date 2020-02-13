const Metalsmith = require('metalsmith')
const ejs = require('ejs')
const rm = require('rimraf').sync

const ModifyFiles = ['package.json','config/webpack/webpack.config.js']
const TsIgnore = ['src/app.jsx','src/index.jsx']
const JsIgnore = ['src/app.tsx','src/index.tsx']
module.exports = function handleTemplate(root,src,metadata) {

    return new Promise((resolve,reject) => {
        Metalsmith(process.cwd())
            .destination(root)
            .source(src)
            .metadata(metadata)
            .use((files,metalsmith,done) => {
                const fileKeys = Object.keys(files)
            
                ModifyFiles.forEach((file) => {
                    if(fileKeys.includes(file)) {
                        let content = files[file].contents.toString()
                        files[file].contents = Buffer.from(ejs.render(content,metalsmith.metadata()))
                    }
                })
                done()
            })
            // support javascript 
            .use((files,metalsmith,done) => {
                const config = metalsmith.metadata()
                config.isJs ? ignore(JsIgnore) : ignore(TsIgnore);
                done()

                function ignore(ignoreFiles){
                    ignoreFiles.forEach(ignoreFile => delete files[ignoreFile])
                }
            })
            .build(err => {
                rm(src)
                err ? reject(err) : resolve()
            })
    });
}
