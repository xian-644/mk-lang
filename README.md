# MK-Lang

一个用于多语言替换的VSCode插件，帮助你快速将中文文本替换为多语言引用格式。

## 功能

- 选中中文文本，右键替换为多语言引用格式
- 支持配置多种替换模板
- 支持JSON和JS格式的语言包文件
- 支持绝对路径和相对路径的语言包配置

## 使用方法

1. 在VSCode设置中配置语言包路径和替换模板
2. 选中需要替换的中文文本
3. 右键点击，选择"mk-lang: 语言替换"
4. 或者展开"mk-lang: 选择模板"子菜单，选择需要使用的模板

## 配置项

- `mk-lang.langPackPath`: 多语言中文包路径
  - 支持绝对路径和相对路径（相对于工作区根目录）
  - 支持JSON和JS格式的语言包文件
- `mk-lang.formatTemplate`: 替换格式模板
  - 可以是字符串或字符串数组
  - 使用`${key}`作为占位符，会被替换为找到的key

## 示例配置

```json
{
  "mk-lang.langPackPath": "src/locales/zh-CN.json",
  "mk-lang.formatTemplate": [
    "$t(\"${key}\")",
    "this.$t(\"${key}\")",
    "i18n.t(\"${key}\")"
  ]
}
```

## 详细文档

更多详细信息，请查看[使用指南](./USAGE.md)。

## 更新日志

查看[更新日志](./CHANGELOG.md)了解版本更新内容。

## 许可证

MIT