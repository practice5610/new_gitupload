# Developer's Guide

We use Visual Studio Code for developing the API and recommend the same to all team members.

## VSCode setup

Install the following extensions:

- [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Auto format on save

1. Go to View > Command Palette...
2. Type in `Open User Settings`, into the command palette
3. Under your `User` tab, go to Text Editor > Formatting, and turn on "Format on Save". This will allow Prettier to format your code when you save it.

If your file does not format when you save it, there could be a conflict with the formatter, and VS Code doesn't know which formatter you want to use. Usually you can resolve this by simply running the format command yourself. VS Code will ask you what formatter you want to use. To run the command yourself do the following:

MacOs = `option + shift + f`

Windows = `alt + shift + f`
