#!/bin/bash
# Find row and print columns in tab-delimited file

# # gene2pubmed
PMID=31023582
TAXID=[^\s]+
GENEID=[^\s]+
OUT_DIR=./results/

echo "Searching gene2pubmed for $PMID"
grep -Ei "^[0-9]+\t[0-9]+\t$PMID" ./sources/gene2pubmed > ${OUT_DIR}${PMID}_gene.txt




# # gene_info
# TAXID=3702
# GENEID=814788
# # [^\s]+
# OUT_DIR=./results/

# # echo "Searching gene_info for GENEID: $GENEID"
# grep -Ei "^$TAXID\t$GENEID\t" ./sources/gene_info.txt

# # echo "Searching gene_info for TAXID: $TAXID"
# # grep -Ei "^$TAXID\t" ./sources/gene_info_filtered.txt > ${OUT_DIR}${TAXID}_genes.txt
