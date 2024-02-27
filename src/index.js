import _ from 'lodash';
import fs from 'node:fs';
import readline from 'readline';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parse } from 'csv-parse';
import { finished } from 'stream/promises';

import { save, load } from './map.js';

const SOURCE_DIR = 'sources';
const RESULTS_DIR = 'results';
const GENE_INFO_FILE = 'gene_info.txt';
const GENE_INFO_PATH = path.join(SOURCE_DIR, GENE_INFO_FILE);
const FILTERED_GENE_INFO_FILE = 'gene_info_filtered.txt';
const FILTERED_GENE_INFO_PATH = path.join(SOURCE_DIR, FILTERED_GENE_INFO_FILE);
const NAMES_MAP_FILE = 'names_map.json';
const NAMES_MAP_PATH = path.join(SOURCE_DIR, NAMES_MAP_FILE);

const NODE_DELIMITER = '\t';


// Filter the CSV file
const filterFile = async () => {
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
    const sanitize = s => s.trim().toLowerCase();
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
    );
    names = names.filter( isValidValue );
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


async function main() {
  // --------------------      Create nameMap       -------------------------------- //
  // const nameMap = await toNameMap();
  // await save(NAMES_MAP_PATH, nameMap);

  // --------------------      Create clashMap      -------------------------------- //
  const CLASH_MAP_FILE = 'clash_map.json';
  const CLASH_MAP_PATH = path.join(SOURCE_DIR, CLASH_MAP_FILE);
  // const clashMap = new Map(
  //   [...nameMap]
  //     .filter(([k, v]) => v.length > 1)
  //     .sort((a, b) => b[1].length - a[1].length)
  // );
  // await save(CLASH_MAP_PATH, clashMap)

  const nameMap = await load(NAMES_MAP_PATH); //615443
  const clashMap = await load(CLASH_MAP_PATH);//68742

  // --------------------      Create clashMap      -------------------------------- //
  // const CLASH_MAP_FILE = 'human_mouse_clash_map.json';
  // const CLASH_MAP_PATH = path.join(SOURCE_DIR, CLASH_MAP_FILE);
  // const tax_ids = [
  //   '9606',
  //   '10090'
  // ];
  // const clashMap = new Map(
  //   [...originalMap]
  //     .filter(([k, v]) => {
  //       const orgs = new Set( v.map( o => o.tax_id ) );
  //       return tax_ids.every( tax_id => orgs.has(tax_id) );
  //     })
  //     .sort((a, b) => b[1].length - a[1].length)
  // );
  // await save(CLASH_MAP_PATH, clashMap)
  // const humanClashMap = await load(CLASH_MAP_PATH);
  // console.dir(humanClashMap.get('epididymis secretory sperm binding protein').map( o => o.tax_id ), {'maxArrayLength': null});

  // Process the clashMap
  // const clashMap = await load(CLASH_MAP_PATH);
  // // let entries = [...clashMap].map( a => ({ name: a[0], count: a[1].length }));
  // let subset = [...clashMap].slice(0, 1);
  // console.log(JSON.stringify(subset, null, 2));
}

main();



