import _ from 'lodash';
import fs from 'node:fs';
import readline from 'readline';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parse } from 'csv-parse';
import { finished } from 'stream/promises';

import { save, load } from './map.js';
import { save as strSave } from './string.js';
import Graph from './graph.js';

const SOURCE_DIR = 'sources';
const RESULTS_DIR = 'results';
const GENE_INFO_FILE = 'gene_info.txt';
const GENE_INFO_PATH = path.join(SOURCE_DIR, GENE_INFO_FILE);
const FILTERED_GENE_INFO_FILE = 'gene_info_filtered.txt';
const FILTERED_GENE_INFO_PATH = path.join(SOURCE_DIR, FILTERED_GENE_INFO_FILE);
const NAMES_MAP_FILE = 'names_map.json';
const NAMES_MAP_PATH = path.join(RESULTS_DIR, NAMES_MAP_FILE);
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


const toNameMap = async () => {
  let parser;

  const nameMap = new Map();

  const toRecord = nodes => {
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
    const sanitize = s => s.trim().replace(/^'+/, '').replace(/'+$/, '').toLowerCase();
    const EXCLUDED_NAMES = new Set([
      '-',
      'NEWENTRY',
      'uncharacterized protein'
    ].map( sanitize ));
    const isValidValue = val => {
      const isNil = _.isNil( val );
      const isExcludedName = EXCLUDED_NAMES.has( sanitize( val ) );
      return !isNil && !isExcludedName;
    };

    const safeSplit = ( val, delimiter = '|' ) => {
      if ( !isValidValue( val ) ) {
        return [];
      }

      return val.split( delimiter );
    };

    let tax_id = nodes[ NODE_NAMES.ORGANISM ];
    let gene_id = nodes[ NODE_NAMES.ID ];
    let type_of_gene = nodes[ NODE_NAMES.TYPE_OF_GENE ];
    let names = _.concat(
      safeSplit( nodes[ NODE_NAMES.SYNONYMS ] ),
      nodes[ NODE_NAMES.SYMBOL ],
      nodes[ NODE_NAMES.NA_SYMBOL],
      nodes[ NODE_NAMES.NA_FULL_NAME ]
    )
    .filter( isValidValue )
    .map( sanitize );
    names = _.uniq( names );

    return { gene_id, tax_id, type_of_gene, names };
  };

  const updateNames = ({ names, gene_id, tax_id, type_of_gene }) => {
    const IGNORE_GENE_TYPE = new Set([
      'unknown',
      'biological-region',
      'other',
      'tRNA',
      'rRNA',
      'snRNA',
      'scRNA',
      'snoRNA',
      'miscRNA',
      'pseudo',
      'transposon'
    ]);
    if( !IGNORE_GENE_TYPE.has(type_of_gene) ){
      for (const name of names) {
        let values = [];
        if( nameMap.has(name) ){
          values = nameMap.get(name);
        } else {
          nameMap.set(name, values);
        }
        values.push({ gene_id, tax_id });
      }
    }
  };

  const parseOpts = {
    columns: header => header.map(column => column.replace('#', '')),
    delimiter: '\t',
    relax_quotes: true
  };

  try {
    parser = fs
      .createReadStream(FILTERED_GENE_INFO_PATH)
      .pipe(parse(parseOpts));

    parser.on('readable', function(){
      let entry; while ((entry = parser.read()) !== null) {
        let record = toRecord(entry);
        updateNames(record);
      }
    });
    return nameMap;

  } catch (e) {
    console.error('Error parsing to name map');
    console.error(e);

  } finally {
    if(parser) await finished(parser);
  }
};

const toGraph = async () => {
  const adjGraph = new Graph(supportedTaxIds);
  const namesMap = await load(NAMES_MAP_PATH);
  const iterator1 = namesMap[Symbol.iterator]();
  for (const item of iterator1) {
    const orgList = item[1].map( o => o.tax_id );
    const orgCounts = _.countBy(orgList);
    const intraOrgClashes = Object.keys(_.pickBy(orgCounts, v => v > 1));
    intraOrgClashes.forEach( org => adjGraph.addEdge(org, org) );

    const interOrgClashes = Object.keys(orgCounts);
    for( let i = 0; i < interOrgClashes.length; i++ ){
      for( let j = i + 1; j < interOrgClashes.length; j++ ){
        adjGraph.addEdge(interOrgClashes[i], interOrgClashes[j]);
      }
    }
  }
  return adjGraph;
};

async function main() {
  // --------------------    Filter ncbi gene_info  -------------------------------- //
  // Description: Only include biofactoid-relevant organism entries
  // await filterFile();

  // --------------------      Create nameMap       -------------------------------- //
  // Description: Create a Map where keys are gene names and values are
  // [{ gene_id, tax_id },...]
  // const nameMap = await toNameMap();
  // await save(NAMES_MAP_PATH, nameMap);

  // --------------------      Create adjMatrix     -------------------------------- //
  // Description: Create a adjacency matrix of intra- or inter-org name clashes
  // const graph = await toGraph();
  // await strSave(ADJ_CSV_FILE_PATH, graph.toCsv());

  // --------------------      Create clashMap      -------------------------------- //
  // Description: Create a Map of names with intra- or inter-org clashes
  // const CLASH_MAP_FILE = 'clash_map.json';
  // const CLASH_MAP_PATH = path.join(RESULTS_DIR, CLASH_MAP_FILE);
  // const clashMap = new Map(
  //   [...nameMap]
  //     .filter(([k, v]) => v.length > 1)
  //     .sort((a, b) => b[1].length - a[1].length)
  // );
  // await save(CLASH_MAP_PATH, clashMap)

  // --------------------  Create orthologue clashMap  -------------------------------- //
  // Description: Clash Map for specific organisms (non-synonym)
  // const nameMap = await load(NAMES_MAP_PATH);
  // const CLASH_MAP_FILE = 'drerio_dmelanogaster.json';
  // const CLASH_MAP_PATH = path.join(RESULTS_DIR, CLASH_MAP_FILE);
  // const tax_ids = [
  //   '7955',
  //   '7227'
  // ];
  // const clashMap = new Map(
  //   [...nameMap]
  //     .filter(([k, v]) => {
  //       const orgs = new Set( v.map( o => o.tax_id ) );
  //       return tax_ids.every( tax_id => orgs.has(tax_id) );
  //     })
  //     .sort((a, b) => b[1].length - a[1].length)
  // );
  // await save(CLASH_MAP_PATH, clashMap);
  // console.log(clashMap.size); //32 265

  // --------------------  Process the species clashMap  -------------------------- //
  // const clashMap = new Map([
  //   ["hsp70",[{"gene_id":"820438","tax_id":"3702"},{"gene_id":"32133","tax_id":"7227"},{"gene_id":"39542","tax_id":"7227"},{"gene_id":"41609","tax_id":"7227"},{"gene_id":"41840","tax_id":"7227"},{"gene_id":"44920","tax_id":"7227"},{"gene_id":"44921","tax_id":"7227"},{"gene_id":"48581","tax_id":"7227"},{"gene_id":"48582","tax_id":"7227"},{"gene_id":"48583","tax_id":"7227"},{"gene_id":"50022","tax_id":"7227"},{"gene_id":"30671","tax_id":"7955"},{"gene_id":"387608","tax_id":"7955"},{"gene_id":"560210","tax_id":"7955"},{"gene_id":"100126123","tax_id":"7955"},{"gene_id":"3303","tax_id":"9606"},{"gene_id":"3308","tax_id":"9606"},{"gene_id":"15511","tax_id":"10090"},{"gene_id":"266759","tax_id":"10116"},{"gene_id":"108348108","tax_id":"10116"}]]
  // ])
  // let entries = clashMap.get('hsp70');
  //"linkname": "gene_pubmed_highlycited"
  // let subset = [...clashMap].slice(0, 1);
  // console.log(JSON.stringify(subset, null, 2));
}

main();



