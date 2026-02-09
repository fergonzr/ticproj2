{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
    gitignore.url = "github:hercules-ci/gitignore.nix";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      gitignore,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        inherit (gitignore.lib) gitignoreSource;
      in
      {
        devShell = pkgs.mkShell {
          packages = with pkgs; [
            prefetch-npm-deps
            nodejs_20
            android-tools
          ];
        };
      }
    );
}
