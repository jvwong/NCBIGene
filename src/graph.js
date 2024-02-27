class Graph {
  numberNodes;
  adjacencyMatrix;
  elements

  constructor(eltSet){
    this.elements = [...eltSet];
    this.numberNodes = this.elements.length;
    this.adjacencyMatrix = [];
    for(let i = 0; i < this.numberNodes; i++){
      this.adjacencyMatrix[i] = new Array(this.numberNodes).fill(0);
    }
  }

  addEdge(node1, node2, weight = 1){
    const i = this.elements.indexOf(node1);
    const j = this.elements.indexOf(node2);
    this.adjacencyMatrix[i][j] += weight;
    if( i !== j ) this.adjacencyMatrix[j][i] += weight;
  }

  getNeighboors(node){
    const i = this.elements.indexOf(node);
    return this.adjacencyMatrix[i];
  }

  hasEdge(node1, node2){
    const i = this.elements.indexOf(node1);
    const j = this.elements.indexOf(node2);
    if(i >= 0 && i < this.numberNodes && j >= 0 && j < this.numberNodes){
      return this.adjacenMatrix[i][j] > 0 && this.adjacenMatrix[j][i] > 0;
    }
    return false;
  }

  removeEdge(node1, node2){
    const i = this.elements.indexOf(node1);
    const j = this.elements.indexOf(node2);
    if(i >= 0 && i < this.numberNodes && j >= 0 && j < this.numberNodes){
      this.adjacencyMatrix[i][j] = 0;
      this.adjacencyMatrix[j][i] = 0;
    }
  }
}

export default Graph;