import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let fileTreeProvider: CustomFileTreeProvider;
let indexFilePath: string | undefined;

// 激活插件时调用的函数
export function activate(context: vscode.ExtensionContext) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]; // 获取工作区的第一个文件夹
    const workspacePath = workspaceFolder?.uri.fsPath; // 转换为文件系统路径

    // 在插件激活时检查工作文件夹是否有 index.rse 文件
    if (workspaceFolder && workspacePath) {
        indexFilePath = path.join(workspacePath, 'index.rse');
        if (fs.existsSync(indexFilePath)) {
            // 如果 index.rse 存在，则自动加载视图
            loadIndexFile(indexFilePath);
        }
    }

    const disposable = vscode.commands.registerCommand('rgss-scripts-order.showFileOrder', async () => {
        // 选择 index 文件
        const indexFileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: '选择排序索引文件',
            filters: { '索引文件': ['rse'], '所有文件': ['*'] }
        });

        if (!indexFileUri || indexFileUri.length === 0) {
            return;
        }

        indexFilePath = indexFileUri[0].fsPath;
        loadIndexFile(indexFilePath);
    });

    context.subscriptions.push(disposable);

    // 注册重命名文件命令
    context.subscriptions.push(
        vscode.commands.registerCommand('rgss-scripts-order.renameFile', async (node: FileItem) => {
            if (!node || !node.label || !indexFilePath) return;
            const oldLabel = typeof node.label === 'string' ? node.label : node.label.label;
            const oldFileNameWithoutExt = path.parse(oldLabel).name;
            const newName = await vscode.window.showInputBox({
                prompt: `重命名文件: ${oldLabel}`,
                value: oldFileNameWithoutExt,
            });

            if (!newName || newName === oldFileNameWithoutExt) return;

            if (workspacePath)
            {
                const finalNewName = `${newName}.rb`;
                const oldFilePath = path.join(workspacePath, oldLabel);
                const newFilePath = path.join(workspacePath, finalNewName);
                // 执行文件重命名
                try {
                    fs.renameSync(oldFilePath, newFilePath);
                    updateIndexFile(indexFilePath, oldFileNameWithoutExt, newName);
                    loadIndexFile(indexFilePath);
                    vscode.window.showInformationMessage(`脚本文件已重命名为: ${finalNewName}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`重命名脚本文件失败!`);
                }
            }
        })
    );

    // 注册删除文件命令
    context.subscriptions.push(
        vscode.commands.registerCommand('rgss-scripts-order.deleteFile', async (node: FileItem) => {
            if (!node || !node.label || !indexFilePath) return;
            const oldLabel = typeof node.label === 'string' ? node.label : node.label.label;
            const oldFileNameWithoutExt = path.parse(oldLabel).name;
            const confirm = await vscode.window.showWarningMessage(
                `确定删除文件: ${oldLabel}?`,
                { modal: true },
                '确定'
            );

            if (confirm !== '确定') return;

            if (workspacePath)
            {
                const filePath = path.join(workspacePath, oldLabel);
                // 执行文件删除
                try {
                    fs.unlinkSync(filePath);
                    updateIndexFile(indexFilePath, oldFileNameWithoutExt, null);
                    loadIndexFile(indexFilePath);
                    vscode.window.showInformationMessage(`脚本文件 ${oldLabel} 已删除!`);
                } catch (error) {
                    vscode.window.showErrorMessage(`删除脚本文件失败!`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('rgss-scripts-order.moveUp', (item: FileItem) => {
            if (item.label) {
                fileTreeProvider.moveUp(item.label.toString());
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('rgss-scripts-order.moveDown', (item: FileItem) => {
            if (item.label) {
                fileTreeProvider.moveDown(item.label.toString());
            }
        })
    );
}

// 更新 index.rse 文件
function updateIndexFile(filePath: string, oldName: string, newName: string | null) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
        const [, fileName] = line.split('~');
        if (fileName && fileName === oldName) {
            return newName ? line.replace(oldName, newName) : null;
        }
        return line;
    }).filter(line => line !== null);

    fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf-8');
}

// 加载 Index 文件并创建排序视图
function loadIndexFile(filePath: string) {
    const fileOrder = parseIndexFile(filePath);
    if (!fileOrder) {
        vscode.window.showErrorMessage('无法解析 Index 文件');
        return;
    }

    const indexFileName = path.basename(filePath);
    fileOrder.push(indexFileName);

    fileTreeProvider = new CustomFileTreeProvider(fileOrder);
    vscode.window.createTreeView('rgssFileOrderView', {
        treeDataProvider: fileTreeProvider
    });

    vscode.window.showInformationMessage('RGSS Scripts Order 视图加载完毕');
}

// 解析 index 文件内容
function parseIndexFile(filePath: string): string[] | null {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content
            .split('\n') // 按行分割
            .map(line => line)
            .filter(line => line.includes('~')) // 过滤掉不包含 ~ 的行
            .map(line => {
                const parts = line.split('~');
                const fileName = parts[1]; // 获取 ~ 后面的部分
                return fileName ? `${fileName}.rb` : null; // 拼接 .rb
            })
            .filter(fileName => fileName !== null) as string[]; // 过滤掉无效项
    } catch (error) {
        console.error(error);
        return null;
    }
}

// 定义自定义文件树数据提供程序
class CustomFileTreeProvider implements vscode.TreeDataProvider<FileItem> {
    private fileOrder: string[];
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(fileOrder: string[]) {
        this.fileOrder = fileOrder;
    }

    getTreeItem(element: FileItem): vscode.TreeItem {
        const treeItem = element;
        treeItem.contextValue = 'fileItem'; // 设置上下文值用于菜单匹配
        return treeItem;
    }

    getChildren(): FileItem[] {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;
        return this.fileOrder.map(fileName => {
            const filePath = path.join(workspacePath, fileName);
            return new FileItem(fileName, vscode.Uri.file(filePath));
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    moveUp(label: string): void {
        if (!indexFilePath) return;
        const index = this.fileOrder.indexOf(label);
        if (index > 0 && index !== this.fileOrder.length - 1) {
            // 交换位置
            [this.fileOrder[index - 1], this.fileOrder[index]] = [this.fileOrder[index], this.fileOrder[index - 1]];
            this.refresh();
            this.updateScriptsIndex(indexFilePath, index - 1, index);
        }
    }

    moveDown(label: string): void {
        if (!indexFilePath) return;
        const index = this.fileOrder.indexOf(label);
        if (index < this.fileOrder.length - 2 && index !== this.fileOrder.length - 1) {
            // 交换位置
            [this.fileOrder[index], this.fileOrder[index + 1]] = [this.fileOrder[index + 1], this.fileOrder[index]];
            this.refresh();
            this.updateScriptsIndex(indexFilePath, index, index + 1);
        }
    }

    private updateScriptsIndex(filePath: string, index1: number, index2: number): void {
        try {
            // 读取文件内容
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
    
            // 确保索引有效
            if (index1 < 0 || index2 < 0 || index1 >= lines.length || index2 >= lines.length) {
                vscode.window.showErrorMessage('索引超出范围，无法更新脚本排序');
                return;
            }
    
            // 交换两行内容
            [lines[index1], lines[index2]] = [lines[index2], lines[index1]];
    
            // 将修改后的内容写回文件
            fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    
            vscode.window.showInformationMessage('脚本排序已成功更新');
        } catch (err) {
            vscode.window.showErrorMessage(`更新脚本排序失败: ${(err as Error).message}`);
        }
    }
}

// 定义文件项
class FileItem extends vscode.TreeItem {
    constructor(label: string, fileUri: vscode.Uri) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.resourceUri = fileUri;
        this.command = {
            command: 'vscode.open',
            title: '打开文件',
            arguments: [fileUri]
        };
    }
}
