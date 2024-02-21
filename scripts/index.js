import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'csv-parse';
import { finished } from 'stream/promises';

const SOURCE_DIR = 'sources';
const GENE_INFO_FILE = 'gene_info_head.txt';
const GENE_INFO_PATH = path.join(SOURCE_DIR, GENE_INFO_FILE);

// Read and process the CSV file
const processFile = async () => {
  const opts = {
    columns: header => header.map(column => column.replace('#', '')),
    delimiter: '\t'
  };
  const records = [];
  const parser = fs
    .createReadStream(GENE_INFO_PATH)
    .pipe(parse(opts));
  parser.on('readable', function(){
    let record; while ((record = parser.read()) !== null) {
    // Work with each record
      records.push(record);
    }
  });
  await finished(parser);
  return records;
};

// Parse the CSV content
const records = await processFile();

console.log( records );
