import * as vscode from 'vscode';
import translateSQL from './helpers/translateQuery';
import { getApiKey, loadPages } from './helpers/helpers';

// define the webview panel, so we can check if it is already open
let panel: vscode.WebviewPanel | undefined;

// This method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
  // context.globalState.update('OpenAiApiKey', undefined);
  // load pages from the views folder
  const { loadingHtmlContent, errorHtmlContent, noKeyHtmlContent } =
    loadPages(context);

  let disposable = vscode.commands.registerCommand(
    'vscode-sql-translate.SQLTranslator',
    async () => {
      // get the API key from the user's settings
      let OpenAiApiKey = await getApiKey(context);

      // get the active text editor
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        // get the selected text
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        // if the panel is not open, create it. Else just show it
        if (!panel) {
          panel = vscode.window.createWebviewPanel(
            'webviewPanel',
            'SQL Explainer',
            vscode.ViewColumn.Two, // set the view column to position the panel on the right
            {}
          );
          panel.onDidDispose(() => {
            panel = undefined;
          });
        } else {
          panel.webview.html = '';
          panel.reveal();
        }

        // if there is no API key, show the error message
        if (!OpenAiApiKey) return (panel.webview.html = noKeyHtmlContent);

        // if there is no text selected, show the error message
        if (!selectedText) return (panel.webview.html = errorHtmlContent);

        // while the translation is being done, show a loading spinner
        panel.webview.html = loadingHtmlContent;

        // translate the SQL query
        let { fullTranslation, tldrTranslation, error } = await translateSQL(
          selectedText,
          OpenAiApiKey
        );

        // if there is an error, show the error message
        if (error) {
          switch (error) {
            case 'Invalid SQL query':
              return (panel.webview.html = errorHtmlContent);

            case 'Invalid API key':
              return (panel.webview.html = noKeyHtmlContent);
          }
        }

        // return content to the webview panel
        panel.webview.html = `<html>
          <head>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
          </head>
          <body style="background-color: #1e1e1e" class="text-light">
            <header class="d-flex justify-content-center mt-6">
              <h1>SQL Explainer</h1>
            </header>
            <div class="container">
              <h2> Full Explanation: </h2>
              <p>${fullTranslation}<p>
              <hr class="hr hr-blurry" />
              <h2>TLDR</h2>
              <p>${tldrTranslation}</p>
            </div>
          </body>
        </html>`;
      }
    }
  );
  context.subscriptions.push(disposable);
}

// This method is called when the extension is deactivated
export function deactivate() {
  // Close the webview panel when the extension is deactivated
  if (panel) {
    // This closes the panel if it showing and disposes of the resources owned by the webview
    panel.dispose();
    panel = undefined;
  }
}
