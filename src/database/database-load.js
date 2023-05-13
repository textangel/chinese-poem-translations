const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { get } = require('http');
const path = require('path');

let global_id = 0;
let dictFields = ["id", "title", "author", "source", "section", "content", "notes", "rhythmic", "internal_id"];

function processRecords(record, source) {
  // Collapsing para, paragraphs to content 
  if (record.hasOwnProperty('para')) {
    record.content = record.para;
    delete record.para;
  }
  if (record.hasOwnProperty('paragraphs')) {
    record.content = record.paragraphs;
    delete record.paragraphs;
  }
  if (typeof record.content === 'string') {
    // Do nothing, content is already a string
  } else if (Array.isArray(record.content)) {
    record.content = record.content.join('\n');
  } else {
    console.log("Offending record: " + record.content)
  }

  // Collapsing chapter, section, volume, no# to section
  if (record.hasOwnProperty('chapter')) {
    if (record.hasOwnProperty('section')) {
      record.section = "Chapter: " + record.chapter + " Section: " + record.section;
      delete record.chapter;
    }
    else {
      record.section = "Chapter: " + record.chapter;
      delete record.chapter;
    }
  }
  if (record.hasOwnProperty('volume')) {
    if (record.hasOwnProperty('no#')) {
      record.section = "Volume: " + record.volume + " No# " + record["no#"];
      delete record.volume;
      delete record["no#"];
    }
    else {
      record.section = "Volume: " + record.volume;
      delete record.volume;
    }
  }

  //Collapsing Prologue, Biography, Comments, Notes into notes
  if (record.hasOwnProperty('notes')) {
    notes = "Notes: " + record.notes + "\n\n";
  }
  if (record.hasOwnProperty('prologue')) {
    record.notes = "Prologue: " + record.prologue + "\n\n";
    delete record.prologue;
  } 
  if (record.hasOwnProperty('biography')) {
    record.notes =  "Biography: " + record.biography + "\n\n";
    delete record.biography;
  }
  if (record.hasOwnProperty('comment')) {
    record.notes =  "Comment: " + record.comment + "\n\n";
    delete record.comment;
  }
  if (typeof record.notes === 'string') {
    // Do nothing, content is already a string
  } else if (Array.isArray(record.notes)) {
    record.notes = record.notes.join('\n');
  }
  // Renaming the id field and replcaing with a global_id
  if (record.hasOwnProperty('id')) {
    record.internal_id = record.id;
    delete record.id;
  }
  record.id = global_id;
  global_id++;
  
  // Deleting some fields
  if (record.hasOwnProperty('dynasty')) {
    delete record.dynasty;
  }
  if (record.hasOwnProperty('tags')) {
    delete record.tags;
  }
  
  if (!record.hasOwnProperty('author')) {
    if (source === "曹操诗集") {
      record.author = "曹操";
    } else {
      record.author = "未知";
    }
  }

  //Imputing missing fields
  for (const field of dictFields) {
    if (!record.hasOwnProperty(field)) {
      record[field] = "";
    }
  }

  record.source = source;

  return record;
  
}

function loadRecords(fileUrl, db, source) {
  fs.readFile(fileUrl, (err, data) => {
    if (err) throw err;
    const poems = JSON.parse(data);
    poems.forEach(poem => {
      let processedPoem = processRecords(poem, source);
      const stmt = db.prepare('INSERT INTO poems (id, title, author, source, section, content, notes, rhythmic, internal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(processedPoem.id, processedPoem.title, processedPoem.author, processedPoem.source, processedPoem.section, processedPoem.content, processedPoem.notes, processedPoem.rhythmic, processedPoem.internal_id);
      stmt.finalize();
    });
    console.log(poems.length + ' records inserted successfully from fileUrl: ' + fileUrl);
  });
}

//Tested
function getJsonFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    let exclude_strs = ["author", "intro", "preface", "error", "表面结构字"]

    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getJsonFiles(filePath, fileList);
        } else if (path.extname(filePath) === '.json' && !exclude_strs.some(v => filePath.includes(v))) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

//Tested
function getJsonFilesWrapper(dir) {
  let exclude_dirs = ["rank", "strains", "unused", "error"]
  let fileMap = new Map();
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (!exclude_dirs.includes(file)) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fileMap.set(file, getJsonFiles(filePath));
      }
    }
  });
  return fileMap;
}

function populateDatabase(dir) {
  let db = new sqlite3.Database('./src/database/chinese-poems.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the in memory SQLite database.');
  });
  
  db.run(`CREATE TABLE IF NOT EXISTS poems (
      id INTEGER PRIMARY KEY,
      title TEXT,
      author TEXT,
      source TEXT,
      section TEXT,
      content TEXT,
      notes TEXT,
      rhythmic TEXT,
      internal_id TEXT
  );`);

  const jsonFilesMap = getJsonFilesWrapper(dir);
  for (const [sourceDir, filePaths] of jsonFilesMap.entries()) {
    filePaths.forEach(file => {
      loadRecords(file, db, sourceDir);
    });
  }
}

populateDatabase('src/chinese-poetry');
