#!/bin/bash
# Find row and print columns in tab-delimited file

PMID=38029903
TAXID=[^\s]+
GENEID=[^\s]+
OUT_DIR=./results/

echo "Searching gene2pubmed for $PMID"
grep -Ei "^[0-9]+\t[0-9]+\t$PMID" ./sources/gene2pubmed > ${OUT_DIR}${PMID}_gene.txt
