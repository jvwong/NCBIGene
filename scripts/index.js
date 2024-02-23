import _ from 'lodash';
import fs from 'node:fs';
import readline from 'readline';
import { appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parse } from 'csv-parse';
import { finished } from 'stream/promises';
import Graph from './graph.js';

const SOURCE_DIR = 'sources';
const RESULTS_DIR = 'results';
const GENE_INFO_FILE = 'gene_info.txt';
const GENE_INFO_PATH = path.join(SOURCE_DIR, GENE_INFO_FILE);
const FILTERED_GENE_INFO_FILE = 'gene_info_filtered.txt';
const FILTERED_GENE_INFO_PATH = path.join(SOURCE_DIR, FILTERED_GENE_INFO_FILE);
const NAMES_MAP_FILE = 'names_map.json';
const NAMES_MAP_PATH = path.join(SOURCE_DIR, NAMES_MAP_FILE);
const ADJ_CSV_FILE = 'adj.csv';
const ADJ_CSV_FILE_PATH = path.join(RESULTS_DIR, ADJ_CSV_FILE);

const NODE_DELIMITER = '\t';

const supportedTaxIds = new Set([
  '562',    // 0 - Escherichia coli
  '3702',   // 1 - Arabidopsis thaliana
  '4932',   // 2 - Saccharomyces cerevisiae
  '6239',   // 3 - Caenorhabditis elegans
  '7227',   // 4 - Drosophila melanogaster
  '7955',   // 5 - Danio rerio
  '9606',   // 6 - human
  '10090',  // 7 - mouse
  '10116',  // 8 - rat
  '227984', // 9 - SARS coronavirus Tor2
  '2697049' // 10 - Severe acute respiratory syndrome coronavirus 2
]);

const toFile = async ( fpath, data ) => {
  await writeFile( fpath,  data, err => {
    if (err) {
      console.error( err );
    } else {
      console.log(`Data  successfully written to ${fpath}`);
    }
  });
};

const processEntry = nodes => {
  const EMPTY_VALUE = '-';
  const NEW_ENTRY_VALUE = 'NEWENTRY';
  const NODE_NAMES = Object.freeze({
    ORGANISM: 'tax_id',
    ID: 'GeneID',
    SYMBOL: 'Symbol',
    SYNONYMS: 'Synonyms',
    DB_XREFS: 'dbXrefs',
    DESCRIPTION: 'description',
    TYPE_OF_GENE: 'type_of_gene',
    NA_SYMBOL: 'Symbol_from_nomenclature_authority',
    NA_FULL_NAME: 'Full_name_from_nomenclature_authority',
    OTHER_DESIGNATORS: 'Other_designations'
  });
  const lowerCase = s => s.toLowerCase();

  const isValidValue = val => val != EMPTY_VALUE && !_.isNil( val ) && val != NEW_ENTRY_VALUE;

  const safeSplit = ( val, delimiter = '|' ) => {
    if ( !isValidValue( val ) ) {
      return [];
    }

    return val.split( delimiter );
  };

  let taxId = nodes[ NODE_NAMES.ORGANISM ];
  let id = nodes[ NODE_NAMES.ID ];
  let names = _.concat(
    safeSplit( nodes[ NODE_NAMES.SYNONYMS ] ),
    safeSplit( nodes[ NODE_NAMES.OTHER_DESIGNATORS ] ),
    nodes[ NODE_NAMES.SYMBOL ],
    nodes[ NODE_NAMES.NA_SYMBOL],
    nodes[ NODE_NAMES.NA_FULL_NAME ]
  ).filter( isValidValue )
   .map( lowerCase );
  names = _.uniq( names );

  return { id, taxId, names };
};

// Read and process the CSV file
const mapFile = async () => {
  const namesMap = new Map();
  const updateNames = record => {
    const { names, taxId } = record;
    for (const name of names) {
      let orgs = [];
      if( namesMap.has(name) ){
        orgs = namesMap.get(name);
      } else {
        namesMap.set(name, orgs);
      }
      orgs.push(taxId);
    }
  };
  const opts = {
    columns: header => header.map(column => column.replace('#', '')),
    delimiter: '\t',
    relax_quotes: true
  };
  const parser = fs
    .createReadStream(FILTERED_GENE_INFO_PATH)
    .pipe(parse(opts));
  parser.on('readable', function(){
    let entry; while ((entry = parser.read()) !== null) {
      let record = processEntry(entry);
      updateNames(record);
    }
  });
  await finished(parser);
  let serialMap = JSON.stringify(Array.from(namesMap.entries()))
  await toFile(NAMES_MAP_PATH, serialMap);
};

// Filter the CSV file
const filterFile = async () => {
  const isSupportedOrganism = taxId => supportedTaxIds.has(taxId);
  const includeEntry = entryLine => {
    // assume org is first tab-delimited entry
    const i = 0;
    const j = entryLine.indexOf(NODE_DELIMITER);
    const tax_id = entryLine.substring(i, j);
    const isSupported = isSupportedOrganism(tax_id);
    return isSupported;
  };

  const onError = err => {
    if (err) throw err;
    console.log('data appended to file');
  };
  const fileStream = fs.createReadStream(GENE_INFO_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let header = true;
  for await (const line of rl) {
    if( header ){
      await appendFile(FILTERED_GENE_INFO_PATH, line + os.EOL, onError);
      header = false;
    }
    if( !includeEntry(line) ) continue;
    await appendFile(FILTERED_GENE_INFO_PATH, line + os.EOL, onError);
  }

};

const toAdjacency = async () => {
  const adj2csv = adj => {
    var csv = adj
      .map( item => {
        var row = item;
        return row.join(',');
      })
      .join('\n');
    return csv;
  }
  const loadNamesMap = async () => {
    const raw = fs.readFileSync(NAMES_MAP_PATH);
    const namesMap = new Map(JSON.parse(raw));
    return namesMap;
  };
  const adjGraph = new Graph(supportedTaxIds);
  const namesMap = await loadNamesMap();
  const iterator1 = namesMap[Symbol.iterator]();
  for (const item of iterator1) {
    const orgList = item[1];
    const orgCounts = _.countBy(orgList);

    // if(_.has(orgCounts, '9606') && orgCounts['9606'] > 1){
    //   console.log( item );
    // }
    // if(_.has(orgCounts, '7227') && _.has(orgCounts, '2697049') ){
    //   console.log( item );
    // }

    const intraOrgClashes = Object.keys(_.pickBy(orgCounts, v => v > 1));
    intraOrgClashes.forEach( org => adjGraph.addEdge(org, org) );

    const interOrgClashes = Object.keys(orgCounts);
    for( let i = 0; i < interOrgClashes.length; i++ ){
      for( let j = i + 1; j < interOrgClashes.length; j++ ){
        adjGraph.addEdge(interOrgClashes[i], interOrgClashes[j]);
      }
    }
  }
  const csv = adj2csv(adjGraph.adjacencyMatrix);
  await toFile(ADJ_CSV_FILE_PATH, csv);
};



// Filter the CSV content
// await filterFile();

// Map the CSV content
await mapFile();

// Load namesMap
await toAdjacency();


