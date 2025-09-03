const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * 激活插件
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('插件 "mk-lang" 已激活');

    // 检查是否有多个模板，并设置上下文
    updateTemplateContext();

    // 监听配置变化，更新上下文
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('mk-lang.formatTemplate')) {
                updateTemplateContext();
            }
        })
    );

    // 注册主命令 - 使用第一个模板
    let mainCommand = vscode.commands.registerCommand('mk-lang.replaceWithLangKey', async function () {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            // 获取用户设置
            const config = vscode.workspace.getConfiguration('mk-lang');
            const langPackPath = config.get('langPackPath');
            const formatTemplates = config.get('formatTemplate');

            // 检查语言包路径是否设置
            if (!langPackPath) {
                vscode.window.showErrorMessage('请先设置多语言中文包路径');
                return;
            }

            // 获取模板数组
            let templates = [];
            if (Array.isArray(formatTemplates)) {
                templates = formatTemplates;
            } else if (typeof formatTemplates === 'string') {
                templates = [formatTemplates];
            } else {
                templates = ['$t("${key}")'];
            }

            // 主命令始终使用第一个模板
            if (templates.length > 0) {
                await replaceWithTemplate(templates[0]);
            } else {
                vscode.window.showErrorMessage('未找到有效的替换模板');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`执行命令时出错: ${error.message}`);
            console.error(error);
        }
    });

    // 注册模板命令
    const templateCommands = [];
    for (let i = 0; i < 3; i++) {
        const command = vscode.commands.registerCommand(`mk-lang.template.${i}`, async function () {
            try {
                // 获取用户设置
                const config = vscode.workspace.getConfiguration('mk-lang');
                const formatTemplates = config.get('formatTemplate');
                
                // 获取模板数组
                let templates = [];
                if (Array.isArray(formatTemplates)) {
                    templates = formatTemplates;
                } else if (typeof formatTemplates === 'string') {
                    templates = [formatTemplates];
                } else {
                    templates = ['$t("${key}")'];
                }
                
                // 检查索引是否有效
                if (i < templates.length) {
                    await replaceWithTemplate(templates[i]);
                } else {
                    vscode.window.showErrorMessage(`模板索引 ${i} 超出范围`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`执行命令时出错: ${error.message}`);
                console.error(error);
            }
        });
        templateCommands.push(command);
    }
    
    // 将命令添加到订阅列表
    context.subscriptions.push(mainCommand);
    templateCommands.forEach(cmd => context.subscriptions.push(cmd));

    /**
     * 更新模板上下文
     */
    function updateTemplateContext() {
        const config = vscode.workspace.getConfiguration('mk-lang');
        const formatTemplates = config.get('formatTemplate');
        
        let templates = [];
        if (Array.isArray(formatTemplates)) {
            templates = formatTemplates;
        } else if (typeof formatTemplates === 'string') {
            templates = [formatTemplates];
        } else {
            templates = ['$t("${key}")'];
        }
        
        // 设置上下文，用于控制"模板选择"子菜单的显示
        vscode.commands.executeCommand('setContext', 'mk-lang.hasMultipleTemplates', templates.length > 1);
    }

    /**
     * 使用指定模板替换选中文本
     * @param {string} template 替换模板
     */
    async function replaceWithTemplate(template) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showInformationMessage('请先选择要替换的中文文本');
            return;
        }

        const selectedText = editor.document.getText(selection);
        
        // 获取用户设置
        const config = vscode.workspace.getConfiguration('mk-lang');
        const langPackPath = config.get('langPackPath');

        // 检查语言包路径是否设置
        if (!langPackPath) {
            vscode.window.showErrorMessage('请先设置多语言中文包路径');
            return;
        }

        try {
            // 获取语言包内容
            const langPack = await getLangPack(langPackPath);
            
            // 查找对应的key
            const key = findKeyByValue(langPack, selectedText);
            
            if (!key) {
                vscode.window.showWarningMessage(`未在语言包中找到对应的key: "${selectedText}"`);
                return;
            }
            
            // 替换文本
            const replacementText = template.replace('${key}', key);
            
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, replacementText);
            });
            
            vscode.window.showInformationMessage(`已替换: ${selectedText} -> ${replacementText}`);
        } catch (error) {
            vscode.window.showErrorMessage(`替换失败: ${error.message}`);
            console.error(error);
        }
    }

    /**
     * 获取语言包内容
     * @param {string} langPackPath 语言包路径
     * @returns {Promise<Object>} 语言包对象
     */
    async function getLangPack(langPackPath) {
        try {
            // 处理相对路径
            let fullPath = langPackPath;
            if (!path.isAbsolute(langPackPath)) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    throw new Error('未打开工作区，无法使用相对路径');
                }
                fullPath = path.join(workspaceFolders[0].uri.fsPath, langPackPath);
            }
            
            // 检查文件是否存在
            if (!fs.existsSync(fullPath)) {
                throw new Error(`语言包文件不存在: ${fullPath}`);
            }
            
            // 根据文件扩展名处理不同类型的文件
            const ext = path.extname(fullPath).toLowerCase();
            
            if (ext === '.json') {
                // 读取JSON文件
                const content = fs.readFileSync(fullPath, 'utf8');
                return JSON.parse(content);
            } else if (ext === '.js') {
                // 读取JS文件
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // 尝试提取导出的对象
                const exportMatch = content.match(/export\s+default\s+(\w+)/);
                if (exportMatch) {
                    const varName = exportMatch[1];
                    const varMatch = content.match(new RegExp(`const\\s+${varName}\\s*=\\s*({[\\s\\S]*?});`));
                    if (varMatch) {
                        try {
                            // 尝试解析JS对象
                            return eval(`(${varMatch[1]})`);
                        } catch (e) {
                            throw new Error(`无法解析JS对象: ${e.message}`);
                        }
                    }
                }
                
                throw new Error('无法从JS文件中提取语言包对象，请确保使用 export default 导出');
            } else {
                throw new Error(`不支持的文件类型: ${ext}，仅支持 .json 和 .js 文件`);
            }
        } catch (error) {
            throw new Error(`读取语言包失败: ${error.message}`);
        }
    }

    /**
     * 根据值查找对应的key
     * @param {Object} obj 语言包对象
     * @param {string} value 要查找的值
     * @returns {string|null} 找到的key或null
     */
    function findKeyByValue(obj, value) {
        for (const key in obj) {
            if (obj[key] === value) {
                return key;
            }
        }
        return null;
    }
}

/**
 * 停用插件
 */
function deactivate() {}

module.exports = {
    activate,
    deactivate
}