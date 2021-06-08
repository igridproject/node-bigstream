const fs = require('fs');

var fname = "f.txt"
// Getting information for a file
fs.stat(fname, (error, stats) => {
    if (error) {
      console.log(error);
    }
    else {
      console.log("Stats object for: example_file.txt");
      console.log(stats.atimeMs);
    
      // Using methods of the Stats object
      console.log("Path is file:", stats.isFile());
      console.log("Path is directory:", stats.isDirectory());
    }
  });