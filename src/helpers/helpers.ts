import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export async function getApiKey(context: vscode.ExtensionContext) {

  // Check if the API key is already stored in globalState
  let OpenAiApiKey: string | undefined =
    context.globalState.get('OpenAiApiKey');

  // If the API key is not stored, prompt the user to enter it
  if (!OpenAiApiKey) {
    console.log('No API key found');
    OpenAiApiKey = await vscode.window
      .showInputBox({ prompt: 'Enter your OPENAI API key' })
      .then((value) => {
        return value;
      });

    // uncomment the line below to store the API key in globalState. It's commented for development purposes.
    // context.globalState.update('OpenAiApiKey', OpenAiApiKey);
  }
  return OpenAiApiKey;
}

export function loadPages(context: vscode.ExtensionContext) {

  // get the paths to the html files
  const errorHtmlPath = path.join(
    context.extensionPath,
    'src/views',
    'error.html'
  );

  const loadingHtmlPath = path.join(
    context.extensionPath,
    'src/views',
    'loading.html'
  );

  const noKeyHtmlPath = path.join(
    context.extensionPath,
    'src/views',
    'noKey.html'
  );

  // read the files
  const errorHtmlContent = fs.readFileSync(errorHtmlPath, 'utf8');
  const loadingHtmlContent = fs.readFileSync(loadingHtmlPath, 'utf8');
  const noKeyHtmlContent = fs.readFileSync(noKeyHtmlPath, 'utf8');

  return { errorHtmlContent, loadingHtmlContent, noKeyHtmlContent };
}