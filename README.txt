===========================================================================
*
*                            PUBLIC DOMAIN NOTICE
*               National Center for Biotechnology Information
*
*  This software/database is a "United States Government Work" under the
*  terms of the United States Copyright Act.  It was written as part of
*  the author's official duties as a United States Government employee and
*  thus cannot be copyrighted.  This software/database is freely available
*  to the public for use. The National Library of Medicine and the U.S.
*  Government have not placed any restriction on its use or reproduction.
*
*  Although all reasonable efforts have been taken to ensure the accuracy
*  and reliability of the software and data, the NLM and the U.S.
*  Government do not and cannot warrant the performance or results that
*  may be obtained by using this software or data. The NLM and the U.S.
*  Government disclaim all warranties, express or implied, including
*  warranties of performance, merchantability or fitness for any particular
*  purpose.
*
===========================================================================

PubTator3 DATASET
===========================================================================

GENERAL DESCRIPTION:
---------------------------------------------------------------------------
PubTator3 (https://www.ncbi.nlm.nih.gov/research/pubtator3/) [1] is a web service for exploring and retrieving bioconcept and relation annotations in biomedical articles. PubTator3 provides automated annotations from state-of-the-art deep learning-based text mining systems for genes/proteins, genetic variants, diseases, chemicals, species, cell lines and the relations among the entities, all available for immediate download. PubTator3 annotates PubMed (36 million abstracts), the PMC Open Access Subset and the Author Manuscript Collection (6.3 million full text articles).  This FTP repository aggregated all the bio-entity and relation annotations in PubTator3 in BioC-XML and PubTator (tab-separated) formats. The files are expected to be updated monthly.

CONTENTS:

The entity files contain five columns as shown in below:
	i.   PMID:       PubMed abstract identifier
	ii.  Type:       i.e., gene, disease, chemical, species, and mutation
	iv.  Concept ID: Corresponding database identifier (e.g., NCBIGene ID and MESH ID)
	v.   Mentions:   Bio-concept mentions corresponding to the PubMed abstract
	vi.  Resource:   Various manually annotated resources are included in the files (e.g., MeSH and gene2pubmed)

The relation file contain four columns as shown in below:
	i.   PMID:       PubMed abstract identifier
	ii.  Type:       i.e., Association, Positive_Correlation, Negative_Correlation, Co-treatment, Drug_interaction, Comparison, Conversion, Binding
	iv.  1st concept with its entity type (e.g., Gene and Disease) and identifier (e.g., NCBIGene ID and MESH ID)
	v.   2nd concept with its entity type (e.g., Gene and Disease) and identifier (e.g., NCBIGene ID and MESH ID)

---------------------------------------------------------------------------
#1. gene2pubtator3.gz
---------------------------------------------------------------------------
	#gene2pubtator3 results are from AIONER [2] for NER and GNorm2 [3] for normalization.
	#GNorm2: https://github.com/ncbi/GNorm2
	
---------------------------------------------------------------------------
#2. disease2pubtator3.gz
---------------------------------------------------------------------------
	#disease2pubtator3 results are from AIONER [2] for NER and TaggerOne [4] for normalization.
	#TaggerOne: https://www.ncbi.nlm.nih.gov/research/bionlp/Tools/taggerone/
	
---------------------------------------------------------------------------
#3. chemical2pubtator3.gz
---------------------------------------------------------------------------
	#chemical2pubtator3 results are from AIONER [2] for NER and NLM-Chem [5] for normalization.
	#NLM-Chem: https://www.ncbi.nlm.nih.gov/research/bionlp/Tools/taggerone/
	
---------------------------------------------------------------------------
#4. species2pubtator3.gz
---------------------------------------------------------------------------
	#species2pubtator3 results are from AIONER [2] for NER and GNorm2 [3] for normalization.
	#GNorm2: https://github.com/ncbi/GNorm2
	
---------------------------------------------------------------------------
#5. mutation2pubtator3.gz
---------------------------------------------------------------------------
	#mutation2pubtator3 results are from tmVar3 [6].
	#tmVar3: https://github.com/ncbi/tmVar3
	
---------------------------------------------------------------------------
#6. cellline2pubtator3.gz
---------------------------------------------------------------------------
	#cellline2pubtator3 results are from AIONER [2] for NER and TaggerOne [4] for normalization.
	#TaggerOne: https://www.ncbi.nlm.nih.gov/research/bionlp/Tools/taggerone/
	
---------------------------------------------------------------------------
#7. bioconcepts2pubtator3.gz
---------------------------------------------------------------------------
	#It is a combination of all entity annotations in PubTator3 [1]. 

---------------------------------------------------------------------------
#8. relation2pubtator3.gz
---------------------------------------------------------------------------
	#relation2pubtator3 is the whole set of relations extracted by BioREx [7]. 
	
---------------------------------------------------------------------------
#9. pubtator3.BioCXML.[0-9].tar
---------------------------------------------------------------------------
	#These are the archivements of the abstracts and full texts with entity/relation annotations of the entire PubTator3 in BioC-XML format. 

USAGE:

	Please use "gunzip" to uncompress the *.gz files and use "tar -zxvf" to uncompress the *.tar files.

REFERENCE:
---------------------------------------------------------------------------
[1]Wei C-H, Allot A, Lai P-T and Lu Z (2023) "PubTator3
[2]Luo L, Wei C-H, Lai P-T, Leaman R, Chen Q, Lu Z (2023) "AIONER: all-in-one scheme-based biomedical named entity recognition using deep learning",Bioinformatics ,39(5): btad310
[3]Wei C-H, Luo L, Islamaj R, Lai P-T and Lu Z (2023) "GNorm2: an improved gene name recognition and normalization system", Bioinformatics, submitted
[4]Leaman R and Lu Z (2013) "TaggerOne: joint named entity recognition and normalization with semi-Markov Models", Bioinformatics, 32(18): 839-2846
[5]Islamaj R and et al. (2021) "NLM-Chem, a new resource for chemical entity recognition in PubMed full text literature", Scientific Data, 9, 91
[6]Wei C-H, Allot A, Riehle K, Milosavljevic A, Lu Z (2022) "tmVar 3.0: an improved variant concept recognition and normalization tool", Bioinformatics, 38(18): 4449–4451
[7]Lai P-T, Wei C-H, Luo L, Chen Q, Lu Z (2023) "BioREx: Improving Biomedical Relation Extraction by Leveraging Heterogeneous Datasets", Journal of Biomedical Informatics, in press
