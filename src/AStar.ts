import { MinHeapPriorityQueue } from './PriorityQueue.ts';

// make a tuple astarnode instead of a class
// (node, path, gCost, hCost)
export type AStarNode = [GridNode, GridNode[], number, number]
const nodeComparison = (a: AStarNode, b: AStarNode) => {
    const fCostA = a[2] + a[3]; // gCost + hCost for node A
    const fCostB = b[2] + b[3]; // gCost + hCost for node B
    return fCostA - fCostB;
};


export class AStar {

    frontier: MinHeapPriorityQueue<AStarNode>;
    reached: Set<GridNode>;
    problem: GridSearchProblem;
    numExpanded: number;

    constructor(problem: GridSearchProblem) {
        this.problem = problem;
        this.reached = new Set();
        this.numExpanded = 0;
        this.frontier = new MinHeapPriorityQueue(nodeComparison);
    }

    async searchVisualize(visualizeStep: (node: GridNode, action: string) => void): Promise<[GridNode[], number]> {

        const start: AStarNode = [this.problem.getStart(), [this.problem.getStart()], 0, this.problem.manhattanHeuristic(this.problem.getStart())];
        this.frontier.put(start);

        while (!this.frontier.isEmpty()) {
            let [currentNode, currentPath] = this.frontier.get()!;

            if (this.problem.isGoalState(currentNode)) {
                // Visualize final path minus start and goal
                currentPath = currentPath.slice(1, -1);
                for (const node of currentPath) {
                    await visualizeStep(node, 'path');
                }
                return [currentPath, this.numExpanded];
            }

            if (!this.reached.has(currentNode)) {
                this.reached.add(currentNode);
                this.numExpanded++;
                // Visualize current node expansion
                visualizeStep(currentNode, 'expanding');
                const successors = this.problem.getSuccessors(currentNode);

                for (let successor of successors) {
                    if (!this.reached.has(successor)) {
                        const gCost = this.problem.getPathCost(currentPath.concat([successor]));
                        const hCost = this.problem.manhattanHeuristic(successor);
                        this.frontier.put([successor, currentPath.concat([successor]), gCost, hCost]);
                        visualizeStep(successor, 'considering');
                    }
                }
                // Introduce a delay to visualize
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        return [[], this.numExpanded];
    }

    search(): [GridNode[], number] {
        const start: AStarNode = [this.problem.getStart(), [this.problem.getStart()], 0, this.problem.manhattanHeuristic(this.problem.getStart())];
        this.frontier.put(start);

        while (!this.frontier.isEmpty()) {
            let [currentNode, currentPath] = this.frontier.get()!;

            if (this.problem.isGoalState(currentNode)) {
                return [currentPath, this.numExpanded];
            }

            if (!this.reached.has(currentNode)) {
                this.reached.add(currentNode);
                this.numExpanded++;
                const successors = this.problem.getSuccessors(currentNode);

                for (let successor of successors) {
                    if (!this.reached.has(successor)) {
                        const gCost = this.problem.getPathCost(currentPath.concat([successor]));
                        const hCost = this.problem.manhattanHeuristic(successor);
                        this.frontier.put([successor, currentPath.concat([successor]), gCost, hCost]);
                    }
                }
            }
        }
        return [[], this.numExpanded];
    }
}

export class GridNode {
    x: number;
    y: number;
    walkCost: number;
    isWalkable: boolean;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.walkCost = 1;
        this.isWalkable = true;
    }
    setWalkCost(cost: number) {
        this.walkCost = cost;
    }
    setWalkable(walkable: boolean) {
        this.isWalkable = walkable;
    }
    equals(other: GridNode): boolean {
        return this.x == other.x && this.y == other.y;
    }
    toString() {
        return "(" + this.x + ", " + this.y + ")";
    }
}
export class GridState {
    /*
        This class represents the grid of nodes that the pathfinding algorithm will search through.
        The grid is a 2D array of GridNodes
        Row-major order is used, so the first index is the x-coordinate and the second index is the y-coordinate
        grid[0][0] is the bottom-left corner of the grid
        grid[width-1][height-1] is the top-right corner of the grid
        grid[y][x] is the node at position (x, y)
    */
    width: number;
    height: number;
    grid: GridNode[][];
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.grid = [];

        for (let y = 0; y < height; y++) {
            this.grid.push([]);
            for (let x = 0; x < width; x++) {
                this.grid[y].push(new GridNode(x, y));
            }
        }
    }

    getNode(x: number, y: number): GridNode {
        return this.grid[y][x];
    }
    setNode(x: number, y: number, node: GridNode) {
        this.grid[y][x] = node;
    }
    setWalkCost(x: number, y: number, cost: number) {
        this.grid[y][x].setWalkCost(cost);
    }
    setWalkable(x: number, y: number, walkable: boolean) {
        this.grid[y][x].setWalkable(walkable);
    }
    checkBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    isWalkable(x: number, y: number): boolean {
        return this.checkBounds(x, y) && this.grid[y][x].isWalkable;
    }
    neighbors(x: number, y: number): GridNode[] {
        let neighbors = [];
        if (this.isWalkable(x + 1, y)) {
            neighbors.push(this.getNode(x + 1, y));
        }
        if (this.isWalkable(x - 1, y)) {
            neighbors.push(this.getNode(x - 1, y));
        }
        if (this.isWalkable(x, y + 1)) {
            neighbors.push(this.getNode(x, y + 1));
        }
        if (this.isWalkable(x, y - 1)) {
            neighbors.push(this.getNode(x, y - 1));
        }
        return neighbors;
    }

    /*  Prints the grid to the console
        (0,0) starts at the bottom-left corner
        (width-1, height-1) is the top-right corner
    */
    toString() {
        let str = "";
        for (let y = this.height - 1; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                str += this.grid[y][x].isWalkable ? " o " : " x ";
            }
            str += "\n";
        }
        console.log(str);
    }
}
export class GridSearchProblem {
    /*
        This class represents a search problem on a grid
        The grid is represented by a GridState object
        The start and goal nodes are represented by GridNode objects
    */
    grid: GridState;
    start: GridNode;
    goal: GridNode;
    constructor(grid: GridState) {
        this.grid = grid;
        this.start = grid.getNode(0, 0);
        this.goal = grid.getNode(grid.width - 1, grid.height - 1);
    }

    randomizeStartAndGoal() {
        this.start = this.grid.getNode(Math.floor(Math.random() * this.grid.width), Math.floor(Math.random() * this.grid.height));
        this.goal = this.grid.getNode(Math.floor(Math.random() * this.grid.width), Math.floor(Math.random() * this.grid.height));
        // Ensure that the start and goal are walkable
        while (!this.start.isWalkable || !this.goal.isWalkable) {
            this.start = this.grid.getNode(Math.floor(Math.random() * this.grid.width), Math.floor(Math.random() * this.grid.height));
            this.goal = this.grid.getNode(Math.floor(Math.random() * this.grid.width), Math.floor(Math.random() * this.grid.height));
        }
    }

    setStart(x: number, y: number) {
        if (this.grid.checkBounds(x, y)) {
            this.start = this.grid.getNode(x, y);
        }
    }

    setGoal(x: number, y: number) {
        if (this.grid.checkBounds(x, y)) {
            this.goal = this.grid.getNode(x, y);
        }
    }

    getStart(): GridNode {
        return this.start;
    }

    getGoal(): GridNode {
        return this.goal;
    }

    isGoalState(node: GridNode): boolean {
        return node == this.goal;
    }

    /* 
        getSuccessors will return the succesor GridNodes of the input node
        Each node has a walk cost attribute we can access
    */
    getSuccessors(node: GridNode): GridNode[] {
        return this.grid.neighbors(node.x, node.y);
    }

    getPathCost(path: GridNode[]): number {
        let cost = 0;
        for (let i = 0; i < path.length - 1; i++) {
            cost += path[i].walkCost;
        }
        return cost;
    }

    manhattanHeuristic(node: GridNode): number {
        return Math.abs(node.x - this.goal.x) + Math.abs(node.y - this.goal.y);
    }

    euclideanHeuristic(node: GridNode): number {
        return Math.sqrt(Math.pow(node.x - this.goal.x, 2) + Math.pow(node.y - this.goal.y, 2));
    }

    nullHeuristic(): number {
        return 0;
    }

}

