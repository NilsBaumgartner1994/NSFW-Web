#NSFW-Web

## Common Error
- Something went wrong installing the "sharp" module
    - run npm install as sudo "sudo npm rebuild --verbose sharp" 
    
- Production error: "runtimeGenerator":
    - add "import "regenerator-runtime/runtime.js";" as first import in index.js