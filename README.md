# Blazingly fast TypeScript library

This library available as a git submodule so it's easy for me to edit this while I'm working on various main programs.

This works well with [Vite](https://vitejs.dev/).
When [I tried creating a similar library without a build tool](https://github.com/TradeIdeasPhilip/library), I ran into lots of problems.
## Adding to a new project
To import this library into a new project:
* `cd` into the directory where you want to add `lib` as a subdirectory.
* `git submodule add https://github.com/TradeIdeasPhilip/lib`
## Cloning an existing project
If you clone a main program that uses this library, you might or might not need to type the next line.
(It depends on which git client you used to grab the main program.)

`git submodule update --init --recursive`
## Working example
https://github.com/TradeIdeasPhilip/bounce-3d/commit/fd4ed77c298008787c8a49ac5398705a88870fe9