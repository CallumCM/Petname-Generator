{ pkgs }: {
  deps = [
    pkgs.nodePackages.vscode-langservers-extracted
    pkgs.nodePackages.typescript-language-server  
    pkgs.nodePackages_latest.npm
    pkgs.nodejs-slim-19_x
  ];
}