// import Graph from './graph.js';
// const RESULTS_DIR = 'results';
// const ADJ_CSV_FILE = 'adj.csv';
// const ADJ_CSV_FILE_PATH = path.join(RESULTS_DIR, ADJ_CSV_FILE);

// out of date with name Map format.
// const toAdjacency = async () => {
//   const adj2csv = adj => {
//     var csv = adj
//       .map( item => {
//         var row = item;
//         return row.join(',');
//       })
//       .join('\n');
//     return csv;
//   }

//   const adjGraph = new Graph(supportedTaxIds);
//   const namesMap = await loadMap(NAMES_MAP_FILE);
//   const iterator1 = namesMap[Symbol.iterator]();
//   for (const item of iterator1) {
//     const orgList = item[1];
//     const orgCounts = _.countBy(orgList);

//     // if(_.has(orgCounts, '9606') && orgCounts['9606'] > 1){
//     //   console.log( item );
//     // }
//     // if(_.has(orgCounts, '7227') && _.has(orgCounts, '2697049') ){
//     //   console.log( item );
//     // }

//     const intraOrgClashes = Object.keys(_.pickBy(orgCounts, v => v > 1));
//     intraOrgClashes.forEach( org => adjGraph.addEdge(org, org) );

//     const interOrgClashes = Object.keys(orgCounts);
//     for( let i = 0; i < interOrgClashes.length; i++ ){
//       for( let j = i + 1; j < interOrgClashes.length; j++ ){
//         adjGraph.addEdge(interOrgClashes[i], interOrgClashes[j]);
//       }
//     }
//   }
//   const csv = adj2csv(adjGraph.adjacencyMatrix);
//   await toFile(ADJ_CSV_FILE_PATH, csv);
// };