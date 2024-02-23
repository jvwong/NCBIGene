import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib.colors import LogNorm

# Read the CSV file into a pandas DataFrame
data = pd.read_csv('/Users/jeffreywong/Projects/work/NCBIGene/results/adj_symbols.csv', header=0, index_col=0, sep='\t')

# Create the heatmap using seaborn with log scale colormap and gridlines
plt.figure(figsize=(12, 10))
heatmap = sns.heatmap(data, cmap='coolwarm', annot=True, fmt='d', linewidths=.5, norm=LogNorm(), linecolor='black')

# Move the x-axis ticks to the top
heatmap.xaxis.tick_top()

# Rotate x-axis labels vertically
plt.xticks(rotation=90)

plt.title('Gene symbol clashes')
plt.xlabel('Organisms')
plt.ylabel('Organisms')
plt.show()