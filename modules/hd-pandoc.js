import { nodePandoc } from './node-pandoc.js'

const markdownConvert = (srcFile, outFormat = 'gfm',
                         outFilePath = null, extraArgs = '') => {

    // mind where the dash has to be in RE
    const fileParts = srcFile.match(/([\w_\/\.-]+)\.(\w+)/u)

    const filePathedName = (fileParts && fileParts.length > 1) ? fileParts[1] : null
    const fileExt = (fileParts && fileParts.length > 2) ? fileParts[2] : null

    let fileName = null
    if (filePathedName) {
        // n.b. this appears to work out nicely on variations in paths, with just default behaviors
        const pathSplit = filePathedName.split('/')
        fileName = pathSplit.pop()
        if (!outFilePath) {
            outFilePath = pathSplit.join('/')
        }
    }

    // we must use a Promise, because the actual pandoc conversion occurs on a
    // forked/spawned separate process, and reports results through a callback
    // thus it's a very similar situation to internet calls with their own asynchronicity
    return new Promise ((resolve, reject) => {

        if (!fileName || !fileExt || !outFilePath) {
            return reject ('markdownConvert: bad srcFile: ' + srcFile)
        }

        let outExt = 'md'
        switch (outFormat) {
            case 'md':
            case 'gfm':
                outExt = 'md'
                break
            case 'html':
                outExt = 'html'
                break
            default:
                throw new Error ('Unknown output format: ' + outFormat)
                break
        }

        // using gfm (GitHub Flavored Markdown) avoids spurious codes readers won't handle
        // n.b. care there's no whitespace before the first arg in argBase, or nothing works
        const preArgs = extraArgs !== ''
            ? extraArgs + ' '
            : ''
        const argsBase = preArgs + '-f ' + fileExt + ' -t ' + outFormat + ' -o '
        const args = argsBase + outFilePath + '/' + fileName + '.' + outExt
        // console.log('args: <' + args + '>')

        nodePandoc(srcFile, args, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}
export { markdownConvert }
